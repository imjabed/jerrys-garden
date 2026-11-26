import { preparationDaysFor, enabledCourierModes, carrierModeCode, carrierShippingName, customerShippingFee, type CourierMode, type DeliveryMode } from './shared/deliveryModes';
import { validParcel, estimateParcel, chargeableGrams } from './shared/parcelShipping';
import type { Parcel } from './shared/parcelShipping';
import express from 'express';
import crypto from 'crypto';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { estimateCustomBouquet, indiaDate, minimumWrappers } from './shared/customPricing.js';
import { isValidCustomDeliveryDate, isValidCustomPhone, isValidCustomEmail } from './shared/customOrderValidation.js';
import { isServiceableCity, isValidOptionalDeliveryDate, SERVICE_CITY } from './shared/orderRules.js';
import { customerReviewId, reviewerDisplayName, reviewInputError } from './shared/reviewRules.js';
import { PRODUCT_SIZE_LABELS, PRODUCT_SIZE_KEYS, isProductSize, hasProductSizes, productDeliveryTotal, isValidProductSizeOption, normalizeProductSizes, productSizeFor, customSizeMap, validateCustomSizeFlowers } from './shared/productSizes.js';
import { DEFAULT_SITE_CONTENT, sanitizeSiteContent } from './shared/siteEditor.js';
import type { SiteContent } from './shared/siteEditor.js';
import {
  getMongoStatus,
  seedMongoCollections,
  buildCollections,
  buildCollectionsForCustomersAndProducts,
  setCustomMongoUri,
  getActiveMongoConfig,
  mongoGetCustomers,
  mongoSaveCustomer,
  mongoUpdateCustomerProfile,
  mongoVerifyCustomerLogin,
  mongoGetBouquets,
  mongoSaveBouquet,
  mongoDeleteBouquet,
  mongoGetOrders,
  mongoFindOrderForCustomer,
  mongoFindCustomerByEmail,
  mongoGetOrdersForCustomer,
  mongoCreateOrder,
  getMongoDb,
  mongoUpdateOrderStatus,
  mongoGetSettings,
  mongoUpdateSettings,
  mongoGetCoupons,
  mongoSaveCoupon,
  mongoDeleteCoupon,
  mongoFindCoupon,
  mongoCountCustomerCouponUses,
  mongoHasCustomerOrder,
} from './server/mongodb.js';

dotenv.config();

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
// Optional upgrades: a salted scrypt password hash and TOTP authenticator MFA.
const ADMIN_PASSWORD_SCRYPT = process.env.ADMIN_PASSWORD_SCRYPT || '';
const ADMIN_TOTP_SECRET = (process.env.ADMIN_TOTP_SECRET || '').replace(/\s/g, '').toUpperCase();
const AUTH_SECRET = process.env.AUTH_SECRET || '';
const isProduction = process.env.NODE_ENV === 'production';
const OWNER_COOKIE = 'jg_owner_session';
const CUSTOMER_COOKIE = 'jg_customer_session';
const CLIENT_HEADER = 'x-jg-client';

if (!AUTH_SECRET) {
  console.warn('[Security] AUTH_SECRET is not configured. Admin/customer authentication will be unavailable until it is set.');
}

function base64Url(value: string) {
  return Buffer.from(value).toString('base64url');
}

function signToken(payload: Record<string, unknown>, ttlSeconds: number) {
  if (!AUTH_SECRET) throw new Error('AUTH_SECRET is not configured');
  const body = base64Url(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds }));
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token: string | undefined) {
  if (!token || !AUTH_SECRET) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', AUTH_SECRET).update(body).digest('base64url');
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload as { role: string; email?: string; exp: number; verified?: boolean };
  } catch {
    return null;
  }
}

function parseCookies(req: express.Request) {
  const raw = req.headers.cookie || '';
  return Object.fromEntries(raw.split(';').map(v => v.trim()).filter(Boolean).map(v => {
    const i = v.indexOf('=');
    return i === -1 ? [v, ''] : [v.slice(0, i), decodeURIComponent(v.slice(i + 1))];
  }));
}

function setAuthCookie(res: express.Response, name: string, token: string, maxAgeSeconds: number) {
  const sameSite = isProduction ? 'SameSite=None; Secure' : 'SameSite=Lax';
  res.setHeader('Set-Cookie', `${name}=${encodeURIComponent(token)}; Path=/; HttpOnly; Max-Age=${maxAgeSeconds}; ${sameSite}`);
}

function clearAuthCookie(res: express.Response, name: string) {
  const sameSite = isProduction ? 'SameSite=None; Secure' : 'SameSite=Lax';
  res.setHeader('Set-Cookie', `${name}=; Path=/; HttpOnly; Max-Age=0; ${sameSite}`);
}

function requireClientHeader(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.headers[CLIENT_HEADER] !== '1') return res.status(403).json({ success: false, error: 'Invalid client request.' });
  next();
}

const ADMIN_SESSION_SECONDS = 60 * 60 * 2;
function safeAdminCredentials(email: string, password: string): boolean {
  if (!ADMIN_EMAIL || !AUTH_SECRET || (!ADMIN_PASSWORD && !ADMIN_PASSWORD_SCRYPT)) return false;
  const suppliedEmail = crypto.createHmac('sha256', AUTH_SECRET).update(email).digest();
  const expectedEmail = crypto.createHmac('sha256', AUTH_SECRET).update(ADMIN_EMAIL).digest();
  const emailValid = crypto.timingSafeEqual(suppliedEmail, expectedEmail);
  let passwordValid = false;
  if (ADMIN_PASSWORD_SCRYPT) {
    const [salt, encodedHash] = ADMIN_PASSWORD_SCRYPT.split(':');
    try {
      if (salt && encodedHash && /^[a-f0-9]{32,}$/i.test(salt) && /^[a-f0-9]{128}$/i.test(encodedHash)) {
        const candidate = crypto.scryptSync(password, Buffer.from(salt, 'hex'), 64);
        passwordValid = crypto.timingSafeEqual(candidate, Buffer.from(encodedHash, 'hex'));
      }
    } catch { passwordValid = false; }
  } else {
    const supplied = crypto.createHmac('sha256', AUTH_SECRET).update(password).digest();
    const expected = crypto.createHmac('sha256', AUTH_SECRET).update(ADMIN_PASSWORD).digest();
    passwordValid = crypto.timingSafeEqual(supplied, expected);
  }
  return emailValid && passwordValid;
}
function decodeBase32(secret: string): Buffer | null {
  if (!/^[A-Z2-7]+=*$/.test(secret)) return null;
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0, value = 0;
  const output: number[] = [];
  for (const character of secret.replace(/=+$/, '')) {
    value = (value << 5) | alphabet.indexOf(character);
    bits += 5;
    if (bits >= 8) { bits -= 8; output.push((value >>> bits) & 255); }
  }
  return output.length >= 10 ? Buffer.from(output) : null;
}
function verifyAdminTotp(code: string): boolean {
  if (!ADMIN_TOTP_SECRET) return true;
  if (!/^\d{6}$/.test(code)) return false;
  const secret = decodeBase32(ADMIN_TOTP_SECRET);
  if (!secret) return false;
  const counter = Math.floor(Date.now() / 30000);
  for (let offset = -1; offset <= 1; offset++) {
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64BE(BigInt(counter + offset));
    const digest = crypto.createHmac('sha1', secret).update(buffer).digest();
    const position = digest[digest.length - 1] & 0x0f;
    const number = ((digest[position] & 0x7f) << 24) | (digest[position + 1] << 16)
      | (digest[position + 2] << 8) | digest[position + 3];
    const expected = String(number % 1000000).padStart(6, '0');
    if (crypto.timingSafeEqual(Buffer.from(code), Buffer.from(expected))) return true;
  }
  return false;
}
function requireOwner(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = parseCookies(req)[OWNER_COOKIE];
  const auth = verifyToken(token);
  if (!auth || auth.role !== 'owner' || auth.email !== ADMIN_EMAIL) return res.status(401).json({ success: false, error: 'Owner authentication required.' });
  next();
}

function getCustomerAuth(req: express.Request) {
  return verifyToken(parseCookies(req)[CUSTOMER_COOKIE]);
}

// Configure Cloudinary using environment variables only (no hardcoded credentials)
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Email delivery uses AgentMail's HTTPS API instead of SMTP so it works on Render Free.
const AGENTMAIL_API_KEY = process.env.AGENTMAIL_API_KEY || '';
const AGENTMAIL_INBOX_ID = process.env.AGENTMAIL_INBOX_ID || '';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "Jame Bouquets";

async function sendEmailWithAgentMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!AGENTMAIL_API_KEY || !AGENTMAIL_INBOX_ID) {
    throw new Error('Email verification service is not configured. Please set AGENTMAIL_API_KEY and AGENTMAIL_INBOX_ID in the Render environment variables.');
  }

  const response = await fetch(
    `https://api.agentmail.to/v0/inboxes/${encodeURIComponent(AGENTMAIL_INBOX_ID)}/messages/send`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AGENTMAIL_API_KEY}`,
      },
      body: JSON.stringify({
        to: [to],
        subject,
        html,
      }),
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error?.message ||
      data?.detail ||
      `Email API returned HTTP ${response.status}`;
    throw new Error(message);
  }

  return data;
}

// In-memory OTP storage (10-minute validity)
interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
}
const otpStore = new Map<string, OtpRecord>();
const otpRequestLog = new Map<string, number[]>();
const otpIpLog = new Map<string, number[]>();
const loginAttemptLog = new Map<string, number[]>();

function allowLoginAttempt(ip: string, max = 10) {
  const now = Date.now();
  const recent = (loginAttemptLog.get(ip) || []).filter(t => now - t < 15 * 60 * 1000);
  if (recent.length >= max) return false;
  recent.push(now);
  loginAttemptLog.set(ip, recent);
  return true;
}

function indiaTodayPlusDays(days: number) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  const d = new Date(Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day) + days));
  return d.toISOString().slice(0, 10);
}

function calculateCouponDiscount(coupon: any, items: any[]) {
  const applicableIds = Array.isArray(coupon.applicableProductIds)
    ? coupon.applicableProductIds.map((id: any) => String(id).trim()).filter(Boolean)
    : [];

  // An empty list means the coupon applies to every product. For a restricted
  // coupon, compare normalized product IDs only. Items reaching this helper
  // have already had their prices resolved from the database.
  const applicable = items.filter((item: any) => {
    const id = String(item?.bouquet?.id || item?.productId || '').trim();
    return id && (applicableIds.length === 0 || applicableIds.some((allowed: string) => allowed === id));
  });

  const base = applicable.reduce((sum: number, item: any) => {
    const price = Number(item?.bouquet?.price ?? item?.price ?? 0);
    const quantity = Number(item?.quantity ?? 0);
    return sum + (Number.isFinite(price) && price > 0 ? price : 0) * (Number.isFinite(quantity) ? quantity : 0);
  }, 0);

  if (base <= 0) return 0;
  const value = Number(coupon.discountValue || 0);
  if (!Number.isFinite(value) || value <= 0) return 0;
  const discount = coupon.discountType === 'PERCENT' ? base * value / 100 : value;
  return Math.min(Math.max(0, Math.round(discount * 100) / 100), base);
}

async function resolveCouponItems(items: any[], database: any) {
  const pricedItems: any[] = [];
  for (const item of items) {
    const productId = String(item?.productId || item?.bouquet?.id || '').trim();
    const quantity = Number(item?.quantity);
    if (!productId || !Number.isInteger(quantity) || quantity < 1) continue;

    if (productId.startsWith('custom-bouq-')) {
      pricedItems.push({ productId, quantity, price: 899 });
      continue;
    }

    // The products collection is the authoritative catalogue.
    // Coupon validation must use the same fallback as the public catalogue.
    const product = await database.collection('products').findOne({ id: productId });
    if (product) {
      const size = item?.selectedSize || item?.bouquet?.selectedSize || 'M';
      const variant = hasProductSizes({ category: product.category, sizeOptions: product.sizeOptions })
        ? productSizeFor(product as any, size) : null;
      if (hasProductSizes({ category: product.category, sizeOptions: product.sizeOptions }) && !variant) continue;
      pricedItems.push({
        productId: String(product.id || productId), quantity,
        price: variant ? variant.price : Number(product.price || 0),
      });
    }
  }
  return pricedItems;
}

async function startServer() {

  const app = express();
  app.disable('x-powered-by');
  if (isProduction) app.set('trust proxy', 1);
  const PORT = Number(process.env.PORT) || 3000;

  // Allow the Vercel frontend to call this Render backend.
  // Add FRONTEND_URL in Render Environment Variables.
  const allowedOrigins = [
    'http://localhost:5173',
    'https://jamebouquets.vercel.app',
    'https://jamebouquets.in',
    'https://www.jamebouquets.in',
    'https://jerrys-garden.vercel.app',
    'https://jerrysgarden-iggf6pgbv-jabedsprojects.vercel.app',
    ...(process.env.FRONTEND_URL || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  ].map((origin) => origin.replace(/\/$/, ''));

  app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Vary', 'Origin');
    }

    res.header(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    );
    res.header(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-JG-Client'
    );

    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.header('X-Frame-Options', req.method==='GET' && req.query['studio-preview']==='1' && !req.path.startsWith('/api/') ? 'SAMEORIGIN' : 'DENY');
    if (isProduction) res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    if (req.path.startsWith('/api/')) res.header('Cache-Control', 'no-store');
    const fetchSite = req.headers['sec-fetch-site'];
    if (origin && !allowedOrigins.includes(origin)) return res.status(403).json({ success: false, error: 'Origin not allowed.' });
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !origin && fetchSite === 'cross-site') {
      return res.status(403).json({ success: false, error: 'Origin required.' });
    }

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    next();
  });

  // Body parsing for base64 uploads (up to 30mb)
  app.use('/api', (req, res, next) => {
    if (!allowLoginAttempt(`api:${String(req.ip || 'unknown')}`, 240)) return res.status(429).json({ success: false, error: 'Too many requests. Please try again later.' });
    next();
  });
  app.use(express.json({ limit: '10mb' }));

  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: "Jame Bouquets Bouquet API",
      auth: { ownerConfigured: Boolean(ADMIN_EMAIL && (ADMIN_PASSWORD || ADMIN_PASSWORD_SCRYPT) && AUTH_SECRET) },
      cloudinary: {
        configured: Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET),
      },
      email: {
        configured: Boolean(AGENTMAIL_API_KEY && AGENTMAIL_INBOX_ID),
      },
    });
  });

  // Cloudinary Upload API endpoint
  app.post('/api/upload-image', requireOwner, requireClientHeader, async (req, res) => {
    try {
      if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        return res.status(500).json({
          success: false,
          error: 'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.',
        });
      }

      const { image, folder } = req.body;
      if (!image || typeof image !== 'string') return res.status(400).json({ success: false, error: 'No image data provided' });
      if (image.length > 7 * 1024 * 1024) return res.status(413).json({ success: false, error: 'Image is too large. Maximum size is 5 MB.' });
      if (!/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(image)) return res.status(400).json({ success: false, error: 'Only JPEG, PNG and WebP images are allowed.' });

      const managedFolder = folder === 'jame_bouquets_branding' ? 'jame_bouquets_branding'
        : folder === 'jame_bouquets_collections' ? 'jame_bouquets_collections'
        : folder === 'jame_bouquets_themes' ? 'jame_bouquets_themes'
        : 'jerrys_garden_bouquets';
      const payload = image.split(',')[1] || '';
      const bytes = Buffer.from(payload, 'base64');
      if (!bytes.length || bytes.length > 5 * 1024 * 1024) {
        return res.status(413).json({ success: false, error: 'Invalid image or image exceeds 5 MB.' });
      }
      // Content-based IDs make repeated uploads of exactly the same image
      // idempotent, even if renamed locally or used in several editor slots.
      // Never overwrite an asset that might be referenced by live pages/history.
      const digest = crypto.createHash('sha256').update(bytes).digest('hex');
      const publicId = `${managedFolder}/jb_${digest.slice(0, 44)}`;
      let uploadResponse: any;
      let reused = false;
      try {
        uploadResponse = await cloudinary.uploader.upload(image, {
          folder: managedFolder,
          public_id: `jb_${digest.slice(0, 44)}`,
          unique_filename: false,
          overwrite: false,
          resource_type: 'image',
        });
        reused = uploadResponse.existing === true;
      } catch (err: any) {
        // Some Cloudinary configurations reply 409 instead of returning
        // {existing:true}. Re-read only that exact content-addressed asset.
        const code = Number(err?.http_code || err?.statusCode || err?.status || 0);
        if (code !== 409) throw err;
        const existing = await cloudinary.api.resource(publicId, { resource_type: 'image', type: 'upload' });
        uploadResponse = existing;
        reused = true;
      }

      return res.json({
        success: true,
        url: uploadResponse.secure_url,
        public_id: uploadResponse.public_id,
        width: uploadResponse.width,
        height: uploadResponse.height,
        format: uploadResponse.format,
        reused,
      });
    } catch (error: any) {
      console.error('Cloudinary upload error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to upload image to Cloudinary',
      });
    }
  });

  // Managed assets are never deleted while any draft, public page or
  // rollback version still references them.
  type ManagedFolder = 'jerrys_garden_bouquets' | 'jame_bouquets_branding'
    | 'jame_bouquets_collections' | 'jame_bouquets_themes';
  function managedCloudinaryId(imageUrl: unknown, expectedFolder: ManagedFolder): string | null {
    if (typeof imageUrl !== 'string' || !CLOUDINARY_CLOUD_NAME) return null;
    try {
      const url = new URL(imageUrl);
      if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com') return null;
      const parts = decodeURIComponent(url.pathname).split('/').filter(Boolean);
      if (parts[0] !== CLOUDINARY_CLOUD_NAME || parts[1] !== 'image' || parts[2] !== 'upload') return null;
      let start = 3;
      // Theme Editor saves Cloudinary URLs with non-destructive c_crop
      // transformations. Treat the transformed image as a reference to the
      // same underlying public_id, otherwise cleanup could delete a source
      // still used by the live website.
      while (/^(?:c_crop,x_\d+,y_\d+,w_\d+,h_\d+|f_auto,q_auto(?::best)?,w_\d+,c_limit)$/.test(parts[start] || '')) {
        start++;
      }
      if (/^v[0-9]+$/.test(parts[start] || '')) start++;
      if (parts.length !== start + 2 || parts[start] !== expectedFolder) return null;
      const filename = parts[start + 1];
      const match = /^([A-Za-z0-9_-]+)\.(?:png|jpe?g|webp|gif|avif)$/i.exec(filename);
      return match ? `${expectedFolder}/${match[1]}` : null;
    } catch {
      return null;
    }
  }

  async function cleanupUnreferencedCloudinaryImage(
    imageUrl: unknown,
    folder: ManagedFolder
  ): Promise<{ status: 'deleted' | 'skipped' | 'failed'; warning?: string }> {
    const publicId = managedCloudinaryId(imageUrl, folder);
    if (!publicId) return { status: 'skipped' };
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      return { status: 'failed', warning: 'Image cleanup was skipped because Cloudinary is not configured.' };
    }
    try {
      const database = await getMongoDb();
      // Fail closed: don't delete when references cannot be verified.
      if (!database) return { status: 'failed', warning: 'Image cleanup could not check database references.' };
      const imageRefs = await database.collection('products').find({}, { projection: { imageUrl: 1, 'sizeOptions.images': 1 } }).toArray();
      if (imageRefs.some(doc => [doc.imageUrl, ...(doc.sizeOptions ?? []).flatMap((option: any) => option.images ?? [])]
        .some(url => managedCloudinaryId(url, folder) === publicId))) return { status: 'skipped' };
      const currentSettings = await database.collection('settings').findOne({ key: 'store_settings' });
      if (managedCloudinaryId(currentSettings?.data?.logoUrl, folder) === publicId) return { status: 'skipped' };
      const siteContent = await database.collection('site_content').findOne({ key: 'homepage' });
      const usesImage = (config: any) => {
        const usesCollectionCover = Array.isArray(config?.collections?.cards)
          && config.collections.cards.some((card: any) => managedCloudinaryId(card.imageUrl, folder) === publicId);
        const usesPageBlock = Array.isArray(config?.blocks)
          && config.blocks.some((block: any) =>
            managedCloudinaryId(block.imageUrl, folder) === publicId
            || (Array.isArray(block.images)
              && block.images.some((url: string) => managedCloudinaryId(url, folder) === publicId)));
        const allMedia = [
          ...Object.values(config?.themeMedia || {}),
          ...Object.values(config?.themeMobileMedia || {}),
          ...Object.values(config?.originalImages || {}),
          ...Object.values(config?.valentines || {}).filter((v: any) => typeof v === 'string'),
          ...Object.values(config?.themeBanners || {}).map((b: any) => b?.imageUrl),
          ...Object.values(config?.themeExtras || {}).flatMap((p: any) => [
            p?.customImageUrl, p?.customMobileImageUrl, p?.navImageUrl, p?.navMobileImageUrl,
            p?.footerSceneUrl, p?.footerImageUrl, p?.footerMobileImageUrl,
          ]),
        ];
        return usesCollectionCover || usesPageBlock
          || allMedia.some(url => managedCloudinaryId(url, folder) === publicId);
      };
      if (siteContent && (
        usesImage(siteContent.draft) || usesImage(siteContent.published) ||
        (Array.isArray(siteContent.history) && siteContent.history.some((version: any) => usesImage(version.content)))
      )) return { status: 'skipped' };

      const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
      if (result.result !== 'ok' && result.result !== 'not found') {
        console.error('[Cloudinary cleanup] Unexpected result for managed asset:', publicId, result.result);
        return { status: 'failed', warning: 'The old Cloudinary image could not be deleted. Check server logs.' };
      }
      return { status: 'deleted' };
    } catch (error) {
      console.error('[Cloudinary cleanup] Failed:', publicId, error);
      return { status: 'failed', warning: 'The old Cloudinary image could not be deleted. Check server logs.' };
    }
  }

  // A safe owner-only cleanup route for assets removed from their editor slot.
  // A referenced photo (including a rollback) is deliberately retained.
  app.post('/api/admin/media/cleanup', requireOwner, requireClientHeader, async (req, res) => {
    const url = req.body?.url;
    const folders: ManagedFolder[] = [
      'jame_bouquets_themes', 'jame_bouquets_collections',
      'jame_bouquets_branding', 'jerrys_garden_bouquets',
    ];
    const folder = folders.find(name => Boolean(managedCloudinaryId(url, name)));
    if (!folder) return res.status(400).json({ success: false, error: 'Not a managed Cloudinary image.' });
    const result = await cleanupUnreferencedCloudinaryImage(url, folder);
    if (result.status === 'failed') return res.status(503).json({ success: false, ...result });
    return res.json({ success: true, ...result });
  });

  // Owner authentication
  app.post('/api/admin/login', requireClientHeader, (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const otp = String(req.body?.otp || '').trim();
    if (!allowLoginAttempt(String(req.ip || 'unknown'), 8)) return res.status(429).json({ success: false, error: 'Too many login attempts. Please try again later.' });
    if (!ADMIN_EMAIL || (!ADMIN_PASSWORD && !ADMIN_PASSWORD_SCRYPT) || !AUTH_SECRET) {
      return res.status(503).json({ success: false, error: 'Owner authentication is not configured on the server.' });
    }
    if (!email || !password || !safeAdminCredentials(email, password) || !verifyAdminTotp(otp)) {
      return res.status(401).json({ success: false, error: 'Invalid owner credentials.' });
    }
    const token = signToken({ role: 'owner', email }, ADMIN_SESSION_SECONDS);
    setAuthCookie(res, OWNER_COOKIE, token, ADMIN_SESSION_SECONDS);
    return res.json({ success: true, user: { email } });
  });

  app.get('/api/admin/session', (req, res) => {
    const auth = verifyToken(parseCookies(req)[OWNER_COOKIE]);
    return res.json({ authenticated: Boolean(auth?.role === 'owner' && auth?.email === ADMIN_EMAIL), email: auth?.role === 'owner' && auth?.email === ADMIN_EMAIL ? ADMIN_EMAIL : null });
  });

  app.post('/api/admin/logout', requireClientHeader, (req, res) => {
    clearAuthCookie(res, OWNER_COOKIE);
    return res.json({ success: true });
  });

  // OTP Email Verification Endpoints
  // 1. Send OTP to customer's email address
  app.post('/api/send-otp', async (req, res) => {
    try {
      if (!AGENTMAIL_API_KEY || !AGENTMAIL_INBOX_ID) {
        return res.status(500).json({
          success: false,
          error: 'Email verification service is not configured. Please set AGENTMAIL_API_KEY and AGENTMAIL_INBOX_ID in the Render environment variables.',
        });
      }

      const { email, name } = req.body;
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ success: false, error: 'A valid email address is required.' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail.length > 254) return res.status(400).json({ success: false, error: 'Invalid email address.' });
      const nowMs = Date.now();
      const ipKey = String(req.ip || req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
      const recentIp = (otpIpLog.get(ipKey) || []).filter(t => nowMs - t < 15 * 60 * 1000);
      if (recentIp.length >= 10) return res.status(429).json({ success: false, error: 'Too many verification requests from this network. Please try again later.' });
      recentIp.push(nowMs);
      otpIpLog.set(ipKey, recentIp);
      const recent = (otpRequestLog.get(normalizedEmail) || []).filter(t => nowMs - t < 15 * 60 * 1000);
      if (recent.length >= 3) return res.status(429).json({ success: false, error: 'Too many verification requests. Please try again later.' });
      recent.push(nowMs);
      otpRequestLog.set(normalizedEmail, recent);
      if (otpStore.has(normalizedEmail) && nowMs - (otpStore.get(normalizedEmail)!.expiresAt - 10 * 60 * 1000) < 60 * 1000) {
        return res.status(429).json({ success: false, error: 'Please wait 60 seconds before requesting another code.' });
      }
      // Generate a cryptographically secure 6-digit verification code
      const code = crypto.randomInt(100000, 1000000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

      otpStore.set(normalizedEmail, {
        code,
        expiresAt,
        attempts: 0,
      });

      const recipientName = name ? String(name).trim() : 'Valued Customer';

      // Send email through AgentMail's HTTPS API (port 443), avoiding SMTP restrictions on Render Free.
      await sendEmailWithAgentMail({
        to: normalizedEmail,
        subject: `${code} is your ${EMAIL_FROM_NAME} Verification Code`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fafaf9; margin: 0; padding: 30px 15px;">
            <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #f0ebe1; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
              
              <div style="background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 50%, #fef3c7 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid #ffe4e6;">
                <h1 style="font-family: Georgia, serif; font-size: 26px; color: #881337; margin: 0; font-weight: bold;">Jame Bouquets</h1>
                <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #e11d48; margin: 6px 0 0 0; font-weight: 600;">Handcrafted Satin Ribbon Bouquets</p>
              </div>

              <div style="padding: 32px 28px;">
                <h2 style="font-size: 18px; color: #1c1917; margin: 0 0 12px 0;">Hello ${recipientName},</h2>
                <p style="font-size: 14px; line-height: 1.6; color: #57534e; margin: 0 0 20px 0;">
                  Thank you for signing up with <strong>Jame Bouquets</strong>. Please enter the 6-digit verification code below to confirm your email and complete your account creation:
                </p>

                <div style="background: #fff1f2; border: 2px dashed #f43f5e; border-radius: 16px; padding: 22px 16px; text-align: center; margin: 24px 0;">
                  <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #be123c; font-weight: 700; margin-bottom: 8px;">Verification Code</div>
                  <div style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #881337; font-family: monospace, Courier, sans-serif;">${code}</div>
                  <div style="font-size: 12px; color: #9f1239; margin-top: 8px; font-weight: 500;">Valid for 10 minutes</div>
                </div>

                <p style="font-size: 13px; line-height: 1.5; color: #78716c; margin: 0 0 16px 0;">
                  Once verified, your account will be activated and you can sign in with your password to order handcrafted bouquets, track deliveries, and save favorite arrangements.
                </p>

                <div style="background: #fafaf9; border-radius: 12px; padding: 12px 16px; font-size: 12px; color: #a8a29e; line-height: 1.5;">
                  <strong>Notice:</strong> If you did not create an account on Jame Bouquets, please ignore this email. Never share your verification code with anyone.
                </div>
              </div>

              <div style="padding: 20px 24px; background: #fafaf9; text-align: center; font-size: 11px; color: #a8a29e; border-top: 1px solid #f5f5f4;">
                © 2026 Jame Bouquets • Berhampore, Murshidabad, West Bengal<br>
                Jame Bouquets · Handmade Gifts
              </div>

            </div>
          </div>
        `,
      });

      console.log(`[Jame Bouquets] OTP email successfully dispatched to: ${normalizedEmail}`);

      // Crucial: do NOT return the code to the frontend!
      return res.json({
        success: true,
        message: `A 6-digit verification code has been sent to ${normalizedEmail}. Please check your inbox or spam folder.`,
      });
    } catch (error: any) {
      console.error('[Jame Bouquets] Failed to send OTP email:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to send verification email. Please check your email and try again.',
      });
    }
  });

  // 2. Verify OTP entered by customer
  app.post('/api/verify-otp', (req, res) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ success: false, error: 'Email and verification code are required.' });
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const enteredOtp = String(otp).trim();

      const record = otpStore.get(normalizedEmail);
      if (!record) {
        return res.status(400).json({
          success: false,
          error: 'No active verification code found for this email, or it has expired. Please request a new code.',
        });
      }

      if (Date.now() > record.expiresAt) {
        otpStore.delete(normalizedEmail);
        return res.status(400).json({
          success: false,
          error: 'Verification code has expired (valid for 10 minutes). Please request a new code.',
        });
      }

      record.attempts += 1;
      if (record.attempts > 5) {
        otpStore.delete(normalizedEmail);
        return res.status(429).json({
          success: false,
          error: 'Too many incorrect attempts. Please request a new verification code.',
        });
      }

      if (record.code !== enteredOtp) {
        return res.status(400).json({
          success: false,
          error: 'Invalid verification code. Please check your email and enter the 6-digit code again.',
        });
      }

      // Verification successful! Clean up record
      otpStore.delete(normalizedEmail);
      const verificationToken = signToken({ role: 'otp', email: normalizedEmail, verified: true }, 15 * 60);
      return res.json({
        success: true,
        message: 'Email verified successfully!',
        verificationToken,
      });
    } catch (error: any) {
      console.error('[Jame Bouquets] Error verifying OTP:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to verify code. Please try again.',
      });
    }
  });

  // ==========================================
  // MongoDB / admin-only operations
  // ==========================================

  app.get('/api/mongodb/status', requireOwner, async (req, res) => {
    try { return res.json(await getMongoStatus()); }
    catch (err: any) { return res.status(500).json({ configured: false, connected: false, error: 'Request failed. Please try again.' }); }
  });

  // Disabled in production unless explicitly enabled during supervised maintenance.
  const requireMaintenance = (_req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (isProduction && process.env.ALLOW_DATABASE_MAINTENANCE !== 'true') {
      return res.status(403).json({ success: false, error: 'Database maintenance is disabled in production.' });
    }
    next();
  };
  // Development/database maintenance endpoints are owner-only.
  app.post('/api/mongodb/build-collections', requireOwner, requireClientHeader, requireMaintenance, async (req, res) => {
    try {
      const results = await buildCollections(req.body || {});
      return res.json({ success: true, message: 'Collections verified successfully.', results });
    } catch (err: any) { return res.status(500).json({ success: false, error: 'Request failed. Please try again.' }); }
  });

  app.post('/api/mongodb/build-customers-products', requireOwner, requireClientHeader, requireMaintenance, async (req, res) => {
    try {
      const results = await buildCollectionsForCustomersAndProducts(req.body || {});
      return res.json({ success: true, message: 'Collections verified successfully.', results });
    } catch (err: any) { return res.status(500).json({ success: false, error: 'Request failed. Please try again.' }); }
  });

  app.post('/api/mongodb/config', requireOwner, requireClientHeader, requireMaintenance, async (req, res) => {
    // Intentionally retained for the existing dashboard, but now owner-only.
    try {
      const { uri, database } = req.body || {};
      if (!uri || typeof uri !== 'string' || !uri.startsWith('mongodb')) return res.status(400).json({ success: false, error: 'A valid MongoDB URI is required.' });
      setCustomMongoUri(uri, database);
      return res.json({ success: true, message: 'MongoDB configuration updated.', status: await getMongoStatus() });
    } catch (err: any) { return res.status(500).json({ success: false, error: 'Request failed. Please try again.' }); }
  });

  app.post('/api/mongodb/seed', requireOwner, requireClientHeader, requireMaintenance, async (req, res) => {
    try {
      const results = await seedMongoCollections(req.body || {});
      return res.json({ success: true, message: 'Data synchronized with MongoDB.', results });
    } catch (err: any) { return res.status(500).json({ success: false, error: 'Request failed. Please try again.' }); }
  });

  // Customers: only owner can list customers. Registration/login are public.
  app.get('/api/customers', requireOwner, async (req, res) => {
    try {
      const customers = await mongoGetCustomers();
      if (customers === null) return res.status(503).json({ success: false, connected: false, customers: [] });
      return res.json({ success: true, connected: true, customers });
    } catch (err: any) { return res.status(500).json({ success: false, error: 'Request failed. Please try again.' }); }
  });

  app.post('/api/customers/register', requireClientHeader, async (req, res) => {
    try {
      const { name, email, phone, address, password, verificationToken } = req.body || {};
      if (!name || !email || !phone || !password || typeof verificationToken !== 'string') return res.status(400).json({ success: false, error: 'Name, email, phone, password and email verification are required.' });
      const otpAuth = verifyToken(verificationToken);
      const normalizedEmail = String(email).trim().toLowerCase();
      if (!otpAuth || otpAuth.role !== 'otp' || !otpAuth.verified || otpAuth.email !== normalizedEmail) return res.status(401).json({ success: false, error: 'Email verification is required before creating the account.' });
      if (typeof name !== 'string' || name.trim().length < 2 || name.length > 120 || /[<>\x00-\x1f]/.test(name) || typeof email !== 'string' || email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail) || typeof phone !== 'string' || !/^\+?[0-9]{10,15}$/.test(phone.trim()) || (address != null && (typeof address !== 'string' || address.length > 500 || /[<>\x00-\x1f]/.test(address))) || typeof password !== 'string' || password.length > 128) return res.status(400).json({ success: false, error: 'Invalid registration details.' });
      if (await mongoFindCustomerByEmail(normalizedEmail)) return res.status(409).json({ success: false, error: 'Unable to register. Please sign in or contact support.' });
      if (String(password).length < 6) return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
      const saved = await mongoSaveCustomer({ name: String(name).trim(), email: normalizedEmail, phone: String(phone).trim(), address: String(address || '').trim(), password, isVerified: true });
      if (!saved) return res.status(503).json({ success: false, connected: false, error: 'Database is unavailable. Please try again.' });
      const token = signToken({ role: 'customer', email: normalizedEmail }, 60 * 60 * 24 * 30);
      setAuthCookie(res, CUSTOMER_COOKIE, token, 60 * 60 * 24 * 30);
      return res.json({ success: true, connected: true, user: saved });
    } catch (err: any) {
      if (err?.code === 11000) return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
      return res.status(500).json({ success: false, error: 'Request failed. Please try again.' });
    }
  });

  app.post('/api/customers/login', requireClientHeader, async (req, res) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      const password = String(req.body?.password || '');
      const otp = String(req.body?.otp || '').trim();
      if (!allowLoginAttempt(String(req.ip || 'unknown'), 10)) return res.status(429).json({ success: false, error: 'Too many login attempts. Please try again later.' });
      if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password are required.' });
      if (ADMIN_EMAIL && email === ADMIN_EMAIL) {
        if ((!ADMIN_PASSWORD && !ADMIN_PASSWORD_SCRYPT) || !AUTH_SECRET || !safeAdminCredentials(email, password) || !verifyAdminTotp(otp)) return res.status(401).json({ success: false, connected: true, error: 'Invalid email or password.' });
        const token = signToken({ role: 'owner', email }, ADMIN_SESSION_SECONDS);
        setAuthCookie(res, OWNER_COOKIE, token, ADMIN_SESSION_SECONDS);
        return res.json({ success: true, connected: true, role: 'admin' });
      }
      const verification = await mongoVerifyCustomerLogin(email, password);
      if (verification === null) return res.status(503).json({ success: false, connected: false, error: 'Database is unavailable. Please try again.' });
      if (!verification.success) return res.status(401).json({ success: false, connected: true, error: 'Invalid email or password.' });
      const token = signToken({ role: 'customer', email }, 60 * 60 * 24 * 30);
      setAuthCookie(res, CUSTOMER_COOKIE, token, 60 * 60 * 24 * 30);
      return res.json({ success: true, connected: true, user: verification.user });
    } catch (err: any) { return res.status(500).json({ success: false, error: 'Request failed. Please try again.' }); }
  });

  app.post('/api/customers/logout', requireClientHeader, (req, res) => { clearAuthCookie(res, CUSTOMER_COOKIE); return res.json({ success: true }); });
  app.get('/api/customers/session', async (req, res) => {
    const auth = getCustomerAuth(req);
    if (!auth || auth.role !== 'customer' || !auth.email) return res.json({ authenticated: false });
    try {
      const customer = await mongoFindCustomerByEmail(auth.email);
      if (!customer) {
        clearAuthCookie(res, CUSTOMER_COOKIE);
        return res.json({ authenticated: false });
      }
      return res.json({ authenticated: true, user: customer });
    } catch (err: any) {
      return res.status(500).json({ authenticated: false, error: 'Request failed. Please try again.' });
    }
  });

  app.patch('/api/customers/profile', requireClientHeader, async (req, res) => {
    try {
      const auth = getCustomerAuth(req);
      if (auth?.role !== 'customer' || !auth.email) return res.status(401).json({ success: false, error: 'Sign in to edit your profile.' });
      const { name, address, addresses } = req.body || {};
      const validText = (v: unknown, max: number) => typeof v === 'string' && v.length <= max && !/[<>\x00-\x1f]/.test(v);
      if (!validText(name, 120) || name.trim().length < 2 || !validText(address, 500) || !Array.isArray(addresses) || addresses.length > 10 || addresses.some(v => !validText(v, 500) || !v.trim())) return res.status(400).json({ success: false, error: 'Invalid profile details.' });
      const user = await mongoUpdateCustomerProfile(auth.email, { name: name.trim(), address: address.trim(), addresses: [...new Set<string>(addresses.map(v => v.trim()))] });
      if (!user) return res.status(404).json({ success: false, error: 'Profile unavailable.' });
      return res.json({ success: true, user });
    } catch { return res.status(500).json({ success: false, error: 'Unable to update profile.' }); }
  });

  app.get('/api/customers/orders', requireClientHeader, async (req, res) => {
    try {
      const auth = getCustomerAuth(req);
      if (!auth || auth.role !== 'customer' || !auth.email) return res.status(401).json({ success: false, error: 'Customer authentication required.' });
      const orders = await mongoGetOrdersForCustomer(auth.email);
      if (orders === null) return res.status(503).json({ success: false, connected: false, orders: [] });
      return res.json({ success: true, connected: true, orders });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Request failed. Please try again.' });
    }
  });


  // Public home content is always the last published version, never an owner's draft.
  app.get('/api/site-content', async (_req, res) => {
    try {
      const database = await getMongoDb();
      if (!database) return res.status(503).json({ success: false, error: 'Homepage settings are temporarily unavailable.' });
      const doc = await database.collection('site_content').findOne({ key: 'homepage' });
      res.set('Cache-Control', 'no-store');
      return res.json({ success: true, content: sanitizeSiteContent(doc?.published || DEFAULT_SITE_CONTENT) });
    } catch (error) {
      console.error('Site content fetch error:', error);
      return res.status(500).json({ success: false, error: 'Unable to load homepage settings.' });
    }
  });

  const ensureHomeContent = async (database: any) => {
    await database.collection('site_content').updateOne(
      { key: 'homepage' },
      { $setOnInsert: {
        key: 'homepage', draft: DEFAULT_SITE_CONTENT, published: DEFAULT_SITE_CONTENT,
        revision: 0, publishedRevision: 0, history: [], publishedAt: null,
      } }, { upsert: true }
    );
    return database.collection('site_content').findOne({ key: 'homepage' });
  };

  // All authoring endpoints are strictly owner-authenticated and CSRF-header protected.
  app.get('/api/admin/site-content', requireOwner, async (_req, res) => {
    try {
      const database = await getMongoDb();
      if (!database) return res.status(503).json({ success: false, error: 'Database is unavailable.' });
      const doc = await ensureHomeContent(database);
      res.set('Cache-Control', 'no-store');
      return res.json({
        success: true,
        draft: sanitizeSiteContent(doc?.draft || DEFAULT_SITE_CONTENT),
        published: sanitizeSiteContent(doc?.published || DEFAULT_SITE_CONTENT),
        revision: Number(doc?.revision || 0),
        publishedRevision: Number(doc?.publishedRevision || 0),
        publishedAt: doc?.publishedAt || null,
        history: Array.isArray(doc?.history) ? doc.history.slice(-8).reverse().map((entry: any) => ({
          revision: entry.revision, publishedAt: entry.publishedAt,
          content: sanitizeSiteContent(entry.content),
        })) : [],
      });
    } catch (error) {
      console.error('Owner site content fetch error:', error);
      return res.status(500).json({ success: false, error: 'Unable to open homepage editor.' });
    }
  });

  app.put('/api/admin/site-content/draft', requireOwner, requireClientHeader, async (req, res) => {
    try {
      const revision = Number(req.body?.revision);
      if (!Number.isInteger(revision) || revision < 0 || !req.body?.content) {
        return res.status(400).json({ success: false, error: 'Invalid editor draft.' });
      }
      const database = await getMongoDb();
      if (!database) return res.status(503).json({ success: false, error: 'Database is unavailable.' });
      await ensureHomeContent(database);
      const content = sanitizeSiteContent(req.body.content);
      const result = await database.collection('site_content').updateOne(
        { key: 'homepage', revision },
        { $set: { draft: content, draftSavedAt: new Date().toISOString() }, $inc: { revision: 1 } }
      );
      if (!result.matchedCount) return res.status(409).json({ success: false, error: 'A newer editor draft exists. Reload before saving to avoid overwriting changes.' });
      return res.json({ success: true, draft: content, revision: revision + 1 });
    } catch (error) {
      console.error('Site draft error:', error);
      return res.status(500).json({ success: false, error: 'Could not save the homepage draft.' });
    }
  });

  app.post('/api/admin/site-content/publish', requireOwner, requireClientHeader, async (req, res) => {
    try {
      const revision = Number(req.body?.revision);
      if (!Number.isInteger(revision) || revision < 0) return res.status(400).json({ success: false, error: 'Invalid revision.' });
      const database = await getMongoDb();
      if (!database) return res.status(503).json({ success: false, error: 'Database is unavailable.' });
      const doc = await ensureHomeContent(database);
      if (Number(doc?.revision || 0) !== revision) {
        return res.status(409).json({ success: false, error: 'This version is outdated. Reload the latest draft before publishing.' });
      }
      const content = sanitizeSiteContent(doc?.draft || DEFAULT_SITE_CONTENT);
      const publishedAt = new Date().toISOString();
      const entry = { revision: Number(doc?.publishedRevision || 0), publishedAt: doc?.publishedAt || null,
        content: sanitizeSiteContent(doc?.published || DEFAULT_SITE_CONTENT) };
      const result = await database.collection('site_content').updateOne(
        { key: 'homepage', revision },
        {
          $set: { published: content, publishedAt, publishedRevision: revision + 1 },
          $inc: { revision: 1 },
          $push: { history: { $each: [entry], $slice: -8 } },
        } as any
      );
      if (!result.matchedCount) return res.status(409).json({ success: false, error: 'The draft changed before it could be published. Reload and try again.' });
      return res.json({ success: true, published: content, revision: revision + 1, publishedAt });
    } catch (error) {
      console.error('Site publish error:', error);
      return res.status(500).json({ success: false, error: 'Could not publish the homepage.' });
    }
  });

  // Public catalogue read; writes require owner auth.
  // Delhivery read-only serviceability. No shipment is created or charged.
  const localShipping = (pin: string) => {
    const nearby = new Set((process.env.LOCAL_DELIVERY_PINCODES || '742407,742102,742103').split(',').map(p => p.trim()).filter(p => /^\d{6}$/.test(p)));
    const free = pin === '742101';
    if (!free && !nearby.has(pin)) return null;
    const minDays = free ? 1 : 2;
    const maxDays = free ? 2 : 3;
    return { shippingCharge: free ? 0 : 10, estimatedDeliveryDate: indiaTodayPlusDays(maxDays), earliestDeliveryDate: indiaTodayPlusDays(minDays), transitDays: maxDays, preparationDays: 0, deliveryMinDays: minDays, deliveryMaxDays: maxDays, estimateStatus: 'estimated', approximate: false, localDelivery: true };
  };
  app.get('/api/shipping/serviceability', async (req, res) => {
    const pincode = String(req.query.pincode || '').trim();
    if (!/^\d{6}$/.test(pincode)) return res.status(400).json({ success: false, error: 'Enter a valid six-digit Indian PIN code.' });
    const local = localShipping(pincode);
    if (local) return res.json({ success: true, pincode, serviceable: true, prepaid: true, cod: true, ...local });
    const token = process.env.DELHIVERY_API_TOKEN?.trim();
    if (!token) return res.status(503).json({ success: false, error: 'Courier service is not configured.' });
    const environment = process.env.DELHIVERY_ENV === 'staging' ? 'staging' : 'production';
    const host = environment === 'staging' ? 'https://staging-express.delhivery.com' : 'https://track.delhivery.com';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      let response: Response;
      try {
        response = await fetch(`${host}/c/api/pin-codes/json/?filter_codes=${pincode}`, {
          headers: { Authorization: `Token ${token}`, Accept: 'application/json' },
          signal: controller.signal,
        });
      } finally { clearTimeout(timeout); }
      if (!response.ok) {
        console.warn('Delhivery serviceability HTTP status:', response.status);
        return res.status(502).json({ success: false, error: response.status === 401 || response.status === 403 ? 'Delhivery API authentication failed.' : 'Courier availability could not be verified.' });
      }
      const data: any = await response.json();
      const records = Array.isArray(data?.delivery_codes) ? data.delivery_codes : [];
      const match = records.map((entry: any) => entry?.postal_code).find((entry: any) => String(entry?.pin) === pincode);
      const serviceable = Boolean(match && !String(match.remarks || '').trim() && (match.pre_paid === 'Y' || match.cash === 'Y'));
      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.json({ success: true, pincode, serviceable, prepaid: match?.pre_paid === 'Y', cod: match?.cod === 'Y', city: match?.city || null, state: match?.state_code || null, preparationDays: preparationDaysFor(await mongoGetSettings()), estimatedDeliveryDate: null, shippingCharge: null, estimateStatus: 'pending_courier_quote' });
    } catch (error) {
      console.warn('Delhivery serviceability request failed:', error instanceof Error ? error.message : 'unknown');
      return res.status(502).json({ success: false, error: 'Courier availability is temporarily unavailable.' });
    }
  });

  // Read-only freight estimate; prices are approximate until carrier billing.
  const shippingQuoteCache = new Map<string, { expires: number; value: any }>();
  const getShippingQuote = async (pin: string, grams: number, fresh = false, mode: CourierMode = 'standard', prepDays?: number) => {
    if (!/^\d{6}$/.test(pin) || !Number.isInteger(grams) || grams < 1 || grams > 100000)
      throw new Error('INVALID_SHIPPING_INPUT');
    const local = localShipping(pin);
    if (local) return { pincode: pin, originPincode: '742101', chargeableWeightGrams: grams, currency: 'INR', ...local, deliveryMode:'local' as DeliveryMode };
    const preparationDays=prepDays??preparationDaysFor(await mongoGetSettings());
    const key = `${pin}:${grams}:${mode}:${preparationDays}:${indiaTodayPlusDays(0)}`;
    const cached = shippingQuoteCache.get(key);
    if (!fresh && cached && cached.expires > Date.now()) return cached.value;
    const token = process.env.DELHIVERY_API_TOKEN?.trim();
    if (!token) throw new Error('COURIER_NOT_CONFIGURED');
    const courierHost = process.env.DELHIVERY_ENV === 'staging' ? 'https://staging-express.delhivery.com' : 'https://track.delhivery.com';
    const serviceabilityController = new AbortController();
    const serviceabilityTimer = setTimeout(() => serviceabilityController.abort(), 8000);
    try {
      const availability = await fetch(`${courierHost}/c/api/pin-codes/json/?filter_codes=${pin}`, {
        headers: { Authorization: `Token ${token}`, Accept: 'application/json' }, signal: serviceabilityController.signal,
      });
      if (!availability.ok) throw new Error('COURIER_SERVICEABILITY_UNAVAILABLE');
      const payload: any = await availability.json();
      const entries = Array.isArray(payload?.delivery_codes) ? payload.delivery_codes : [];
      const postal = entries.map((entry: any) => entry?.postal_code).find((entry: any) => String(entry?.pin) === pin);
      if (!postal || postal.pre_paid !== 'Y') throw new Error('COURIER_PIN_UNSERVICEABLE');
    } finally { clearTimeout(serviceabilityTimer); }
    const params = new URLSearchParams({ md: carrierModeCode(mode), ss: 'Delivered', d_pin: pin, o_pin: '742101', cgm: String(grams), pt: 'Pre-paid' });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${courierHost}/api/kinko/v1/invoice/charges/.json?${params}`, {
        headers: { Authorization: `Token ${token}`, Accept: 'application/json' }, signal: controller.signal,
      });
      if (!response.ok) throw new Error('COURIER_RATE_UNAVAILABLE');
      const raw: any = await response.json();
      const candidates = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [raw];
      const amount = candidates.map((x: any) => Number(x?.total_amount)).find((x: number) => Number.isFinite(x) && x > 0);
      if (amount === undefined) throw new Error('COURIER_RATE_UNAVAILABLE');
      // TAT is requested for the expected dispatch date, after the configured preparation days.
      // Never manufacture a delivery promise when Delhivery omits or rejects the TAT.
      const dispatchDate = new Date(indiaTodayPlusDays(preparationDays)+'T00:00:00Z');
      const dateISO = (date: Date) => date.toISOString().slice(0, 10);
      let estimatedDeliveryDate: string | null = null;
      let transitDays: number | null = null;
      try {
        const tatParams = new URLSearchParams({
          origin_pin: '742101', destination_pin: pin, mot: carrierModeCode(mode), pdt: 'B2C',
          expected_pickup_date: dateISO(dispatchDate) + ' 10:00',
        });
        const tatController = new AbortController();
        const tatTimeout = setTimeout(() => tatController.abort(), 7000);
        try {
          const tatResponse = await fetch(`${courierHost}/api/dc/expected_tat?${tatParams}`, {
            headers: { Authorization: `Token ${token}`, Accept: 'application/json' },
            signal: tatController.signal,
          });
          if (tatResponse.ok) {
            const tat: any = await tatResponse.json();
            const days = Number(tat?.data?.tat);
            if (tat?.success === true && Number.isInteger(days) && days >= 0 && days <= 30) {
              transitDays = days;
              estimatedDeliveryDate = dateISO(new Date(dispatchDate.getTime() + days * 86400000));
            }
          }
        } finally { clearTimeout(tatTimeout); }
      } catch (error) {
        console.warn('Delhivery TAT unavailable:', error instanceof Error ? error.message : 'unknown');
      }
      const result = { pincode: pin, originPincode: '742101', chargeableWeightGrams: grams, shippingCharge: Math.ceil(amount), currency: 'INR', estimatedDeliveryDate, transitDays, preparationDays, deliveryMode:mode as DeliveryMode, estimatedDispatchDate:dateISO(dispatchDate), estimateStatus: estimatedDeliveryDate ? 'estimated' : 'rate_available_tat_pending', approximate: true };
      if (shippingQuoteCache.size > 500) shippingQuoteCache.clear();
      shippingQuoteCache.set(key, { expires: Date.now() + 300000, value: result });
      return result;
    } finally { clearTimeout(timer); }
  };
  app.get('/api/shipping/quote', async (req, res) => {
    const pin = String(req.query.pincode || '').trim();
    const grams = Number(req.query.weightGrams);
    if (!/^\d{6}$/.test(pin) || !Number.isInteger(grams) || grams < 1 || grams > 100000)
      return res.status(400).json({ success: false, error: 'Provide a six-digit PIN and packed weight in grams (1-100000).' });
    if (!allowLoginAttempt(`shipping:${String(req.ip || 'unknown')}`, 40))
      return res.status(429).json({ success: false, error: 'Too many shipping requests.' });
    try { const settings=await mongoGetSettings(); const mode=enabledCourierModes(settings)[0]; if(!mode&&!localShipping(pin))throw Error('No courier service enabled'); return res.json({ success: true, ...(await getShippingQuote(pin, grams,false,mode||'standard',preparationDaysFor(settings))) }); }
    catch { return res.status(502).json({ success: false, error: 'Delhivery shipping estimate is currently unavailable.' }); }
  });

  app.get('/api/bouquets', async (req, res) => {
    try {
      const bouquets = await mongoGetBouquets();
      if (bouquets === null) return res.status(503).json({ success: false, connected: false, bouquets: [] });
      return res.json({ success: true, connected: true, bouquets });
    } catch (err: any) { return res.status(500).json({ success: false, error: 'Request failed. Please try again.' }); }
  });


  // Use only authoritative product records for checkout quotes; never trust client weights or prices.
  app.post('/api/shipping/cart-quote', requireClientHeader, async (req,res) => {
    const pin=String(req.body?.pincode||'').trim(), raw=req.body?.items;
    if(!/^\d{6}$/.test(pin)||!Array.isArray(raw)||!raw.length||raw.length>50)return res.status(400).json({success:false,error:'Invalid cart or PIN.'});
    if(!allowLoginAttempt('cart-quote:'+String(req.ip||'unknown'),40))return res.status(429).json({success:false,error:'Too many shipping requests.'});
    try{
      const db=await getMongoDb(); if(!db)return res.status(503).json({success:false,error:'Database unavailable.'});
      const items:any[]=[];let subtotal=0;
      for(const item of raw){
        const q=Number(item.quantity);if(!Number.isInteger(q)||q<1||q>20||typeof item.productId!=='string')return res.status(400).json({success:false,error:'Invalid cart item.'});
        const p=await db.collection('products').findOne({id:item.productId});
        if(!p||p.inStock===false)return res.status(409).json({success:false,error:'Product unavailable. Refresh your bag.'});
        const sized=hasProductSizes({category:p.category,sizeOptions:p.sizeOptions}),v=sized?productSizeFor(p as any,item.selectedSize||'M'):null;
        if(sized&&!v)return res.status(409).json({success:false,error:'Selected size unavailable.'});
        subtotal+=Number(v?.price??p.price)*q;items.push({bouquet:p,quantity:q});
      }
      const parcel=estimateParcel(items);
      if(!parcel&&!localShipping(pin))return res.status(409).json({success:false,error:'Packed dimensions are not configured or the combined box is too large. Contact the shop.'});
      const settings=await mongoGetSettings();if(!settings)throw Error('settings');
      const threshold=Number(settings.freeDeliveryThreshold||0),prep=preparationDaysFor(settings);
      const modes:CourierMode[]=localShipping(pin)?['standard']:enabledCourierModes(settings);
      const settled=await Promise.allSettled(modes.map(mode=>getShippingQuote(pin,parcel?chargeableGrams(parcel):1,false,mode,prep)));
      const options=settled.flatMap(result=>{
        if(result.status!=='fulfilled')return [];
        const quote=result.value,mode=quote.deliveryMode as DeliveryMode;
        return [{...quote,customerDeliveryFee:customerShippingFee(quote.shippingCharge,subtotal,threshold,mode),freeDeliveryEligible:mode!=='express'&&threshold>0&&subtotal>=threshold}];
      });
      if(!options.length)return res.status(503).json({success:false,error:'No enabled delivery method returned a courier quote for this address.'});
      return res.json({success:true,...options[0],options,parcel,subtotal});
    }catch{return res.status(503).json({success:false,error:'Courier quote unavailable. Please try again.'});}
  });

  app.post('/api/bouquets', requireOwner, requireClientHeader, async (req, res) => {
    try {
      const bouquet = req.body as Record<string, any>;
      if (!bouquet || !bouquet.id || !bouquet.title || typeof bouquet.price !== 'number' || bouquet.price < 0) return res.status(400).json({ success: false, error: 'Valid bouquet data is required.' });
      const database = await getMongoDb();
      if (!database) return res.status(503).json({ success: false, connected: false, error: 'Database is unavailable.' });
      if ((!Number.isSafeInteger(bouquet.stockLeft) || bouquet.stockLeft < 0)
        || (bouquet.deliveryCost !== undefined && (!Number.isFinite(bouquet.deliveryCost) || bouquet.deliveryCost < 0
          || Math.abs(bouquet.deliveryCost * 100 - Math.round(bouquet.deliveryCost * 100)) > 0.000001))) {
        return res.status(400).json({ success: false, error: 'Enter a valid stock quantity and delivery cost.' });
      }
      if (!validParcel({parcelLengthCm:bouquet.parcelLengthCm,parcelWidthCm:bouquet.parcelWidthCm,parcelHeightCm:bouquet.parcelHeightCm,parcelWeightGrams:bouquet.parcelWeightGrams})) return res.status(400).json({ success: false, error: 'Invalid packed parcel measurements.' });
      if (hasProductSizes(bouquet)) {
        if (!Array.isArray(bouquet.sizeOptions) || bouquet.sizeOptions.length < 1
            || bouquet.sizeOptions.length > 4
            || bouquet.sizeOptions.some((option: unknown) => !isValidProductSizeOption(option))
            || new Set(bouquet.sizeOptions.map((option: any) => option.size)).size !== bouquet.sizeOptions.length) {
          return res.status(400).json({ success: false, error: 'Configure one to four valid sizes and their flower counts and prices.' });
        }
        if (!bouquet.sizeOptions.some((option: any) => option.available)) {
          return res.status(400).json({ success: false, error: 'Enable at least one size.' });
        }
        const first = bouquet.sizeOptions.find((option: any) => option.size === 'M' && option.available) || bouquet.sizeOptions.find((option: any) => option.available);
        bouquet.price = first.price;
        bouquet.flowerCount = first.flowerCount;
        if (first.name) bouquet.originalPrice = first.originalPrice ?? null;
        if (first.images?.length) bouquet.imageUrl = first.images[0];
      } else bouquet.sizeOptions = [];
      const previous = await database.collection('products').findOne({ id: bouquet.id });
      const saved = await mongoSaveBouquet(bouquet);
      if (!saved) return res.status(503).json({ success: false, connected: false, error: 'Database is unavailable.' });
      const cleanup = previous && previous.imageUrl !== saved.imageUrl
        ? await cleanupUnreferencedCloudinaryImage(previous.imageUrl, 'jerrys_garden_bouquets')
        : { status: 'skipped' as const };
      return res.json({ success: true, connected: true, bouquet: saved, cleanupWarning: cleanup.warning });
    } catch (err: any) { return res.status(500).json({ success: false, error: 'Request failed. Please try again.' }); }
  });

  // Inventory adjustments are server-side atomic increments; never trust a client product snapshot.
  app.post('/api/admin/stock/:id/add', requireOwner, requireClientHeader, async (req, res) => {
    try {
      const amount = Number(req.body?.amount);
      if (!Number.isSafeInteger(amount) || amount < 1 || amount > 100000) {
        return res.status(400).json({ success: false, error: 'Enter a whole-number quantity between 1 and 100000.' });
      }
      const database = await getMongoDb();
      if (!database) return res.status(503).json({ success: false, error: 'Database unavailable.' });
      const product = await database.collection('products').findOneAndUpdate(
        { id: req.params.id, stockLeft: { $type: 'number' } },
        { $inc: { stockLeft: amount }, $set: { inStock: true, updatedAt: new Date().toISOString() } },
        { returnDocument: 'after' },
      );
      if (!product) return res.status(404).json({ success: false, error: 'Product missing or stock not configured.' });
      await database.collection('bouquets').updateOne({ id: req.params.id }, { $set: { stockLeft: product.stockLeft, inStock: true } });
      return res.json({ success: true, bouquet: product });
    } catch (error) {
      console.error('Stock adjustment failed:', error);
      return res.status(500).json({ success: false, error: 'Could not update inventory.' });
    }
  });

  app.delete('/api/bouquets/:id', requireOwner, requireClientHeader, async (req, res) => {
    try {
      const database = await getMongoDb();
      if (!database) return res.status(503).json({ success: false, connected: false, error: 'Database is unavailable.' });
      const previous = await database.collection('products').findOne({ id: req.params.id });
      const deleted = await mongoDeleteBouquet(req.params.id);
      if (deleted === null) return res.status(503).json({ success: false, connected: false, error: 'Database is unavailable.' });
      const cleanup = deleted && previous
        ? await cleanupUnreferencedCloudinaryImage(previous.imageUrl, 'jerrys_garden_bouquets')
        : { status: 'skipped' as const };
      return res.json({ success: true, connected: true, deleted, cleanupWarning: cleanup.warning });
    } catch (err: any) { return res.status(500).json({ success: false, error: 'Request failed. Please try again.' }); }
  });

  // Genuine, product-specific reviews: only verified account holders who have
  // received this exact product (a Delivered order) may post one review.
  // Clients cannot supply the customer identity, verified flag or product details.
  // Previously published reviews without a status remain visible; new ones await review.
  const publicReviewFilter = {
    verifiedPurchase: true,
    $or: [{ status: 'approved' }, { status: { $exists: false } }],
  };

  app.get('/api/reviews/summary', async (_req, res) => {
    try {
      const database = await getMongoDb();
      if (!database) return res.status(503).json({ success: false, error: 'Reviews are temporarily unavailable.' });
      const rows = await database.collection('reviews').aggregate([
        { $match: publicReviewFilter },
        { $group: { _id: '$productId', count: { $sum: 1 }, average: { $avg: '$rating' } } },
      ]).toArray();
      const summary = Object.fromEntries(rows.map(row => [
        String(row._id), { count: Number(row.count), average: Math.round(Number(row.average) * 10) / 10 },
      ]));
      return res.json({ success: true, summary });
    } catch (err) {
      console.error('Review summary error:', err);
      return res.status(500).json({ success: false, error: 'Could not load reviews.' });
    }
  });

  app.get('/api/reviews/highlights', async (_req, res) => {
    try {
      const database = await getMongoDb();
      if (!database) return res.status(503).json({ success: false, error: 'Reviews are temporarily unavailable.' });
      const latest = await database.collection('reviews')
        .find(publicReviewFilter).sort({ createdAt: -1 }).limit(12).toArray();
      const ids = [...new Set(latest.map(review => String(review.productId)))];
      const products = await database.collection('products').find({ id: { $in: ids } }, { projection: { id: 1, title: 1 } }).toArray();
      const titles = new Map(products.map(product => [String(product.id), String(product.title)]));
      const reviews = latest.filter(review => titles.has(String(review.productId))).slice(0, 3)
        .map(review => ({
          productId: review.productId, productTitle: titles.get(String(review.productId)),
          rating: review.rating, comment: review.comment, customerName: review.customerName,
          createdAt: review.createdAt, verifiedPurchase: true,
        }));
      return res.json({ success: true, reviews });
    } catch (error) {
      console.error('Homepage review error:', error);
      return res.status(500).json({ success: false, error: 'Could not load customer reviews.' });
    }
  });

  const deliveredPurchaseFilter = (email: string, productId: string) => ({
    status: 'Delivered',
    'items.bouquet.id': productId,
    $or: [{ customerEmail: email }, { 'customer.email': email }],
  });

  app.get('/api/admin/reviews', requireOwner, async (_req, res) => {
    try {
      const database = await getMongoDb();
      if (!database) return res.status(503).json({ success: false, error: 'Database is unavailable.' });
      const rows = await database.collection('reviews').find({ verifiedPurchase: true })
        .sort({ createdAt: -1 }).limit(200).toArray();
      const ids = [...new Set(rows.map(r => String(r.productId)))];
      const products = await database.collection('products')
        .find({ id: { $in: ids } }, { projection: { id: 1, title: 1 } }).toArray();
      const names = new Map(products.map(p => [String(p.id), String(p.title)]));
      return res.json({ success: true, reviews: rows.map(r => ({
        id: String(r._id), productId: String(r.productId),
        productTitle: names.get(String(r.productId)) || 'Discontinued product',
        rating: r.rating, customerName: r.customerName, comment: r.comment,
        createdAt: r.createdAt, verifiedPurchase: true, status: r.status || 'approved',
      })) });
    } catch (error) {
      console.error('Owner review list error:', error);
      return res.status(500).json({ success: false, error: 'Unable to load customer reviews.' });
    }
  });

  app.patch('/api/admin/reviews/status', requireOwner, requireClientHeader, async (req, res) => {
    try {
      const id = String(req.body?.id || '');
      const status = String(req.body?.status || '');
      if (!id || id.length > 400 || !['pending', 'approved', 'hidden'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid review or moderation action.' });
      }
      const database = await getMongoDb();
      if (!database) return res.status(503).json({ success: false, error: 'Database is unavailable.' });
      const updated = await database.collection('reviews').updateOne(
        { _id: id, verifiedPurchase: true } as any,
        { $set: { status, moderatedAt: new Date().toISOString() } }
      );
      if (!updated.matchedCount) return res.status(404).json({ success: false, error: 'Review not found.' });
      return res.json({ success: true, status });
    } catch (error) {
      console.error('Review moderation error:', error);
      return res.status(500).json({ success: false, error: 'Could not update review status.' });
    }
  });

  app.get('/api/reviews/:productId', async (req, res) => {
    try {
      const productId = String(req.params.productId || '').trim();
      if (!productId || productId.length > 160) return res.status(400).json({ success: false, error: 'Invalid product.' });
      const database = await getMongoDb();
      if (!database) return res.status(503).json({ success: false, error: 'Reviews are temporarily unavailable.' });
      const rows = await database.collection('reviews')
        .find({ productId, ...publicReviewFilter }).sort({ createdAt: -1 }).limit(60).toArray();
      const stats = await database.collection('reviews').aggregate([
        { $match: { productId, ...publicReviewFilter } },
        { $group: { _id: null, count: { $sum: 1 }, average: { $avg: '$rating' } } },
      ]).toArray();
      const auth = getCustomerAuth(req);
      const email = auth?.role === 'customer' && auth.email ? auth.email.toLowerCase() : null;
      let eligible = false;
      let hasReviewed = false;
      let isSignedIn = false;
      if (email) {
        isSignedIn = Boolean(await mongoFindCustomerByEmail(email));
        if (isSignedIn) {
          const [order, existingReview] = await Promise.all([
            database.collection('orders').findOne(deliveredPurchaseFilter(email, productId), { projection: { _id: 1 } }),
            database.collection('reviews').findOne({ _id: customerReviewId(email, productId) } as any, { projection: { _id: 1 } }),
          ]);
          eligible = Boolean(order);
          hasReviewed = Boolean(existingReview);
        }
      }
      return res.json({
        success: true,
        reviews: rows.map(row => ({
          id: String(row.productId) + ':' + String(row.createdAt),
          productId: row.productId, rating: row.rating, comment: row.comment,
          customerName: row.customerName, createdAt: row.createdAt, verifiedPurchase: true,
        })),
        summary: stats[0] ? { count: Number(stats[0].count), average: Math.round(Number(stats[0].average) * 10) / 10 } : { count: 0, average: 0 },
        canReview: isSignedIn && eligible && !hasReviewed,
        hasReviewed, hasDeliveredPurchase: eligible, isSignedIn,
      });
    } catch (err) {
      console.error('Review fetch error:', err);
      return res.status(500).json({ success: false, error: 'Could not load this product’s reviews.' });
    }
  });

  app.post('/api/reviews/:productId', requireClientHeader, async (req, res) => {
    try {
      const auth = getCustomerAuth(req);
      if (!auth || auth.role !== 'customer' || !auth.email) {
        return res.status(401).json({ success: false, error: 'Sign in to review a product you have received.' });
      }
      if (!allowLoginAttempt(`review:${String(req.ip || 'unknown')}`, 15)) {
        return res.status(429).json({ success: false, error: 'Too many review attempts. Please try again later.' });
      }
      const productId = String(req.params.productId || '').trim();
      if (!productId || productId.length > 160) return res.status(400).json({ success: false, error: 'Invalid product.' });
      const rating = req.body?.rating;
      const comment = req.body?.comment;
      const validationError = reviewInputError(rating, comment);
      if (validationError) return res.status(400).json({ success: false, error: validationError });
      const database = await getMongoDb();
      if (!database) return res.status(503).json({ success: false, error: 'Reviews are temporarily unavailable.' });
      const [product, customer, deliveredOrder] = await Promise.all([
        database.collection('products').findOne({ id: productId }, { projection: { id: 1 } }),
        mongoFindCustomerByEmail(auth.email),
        database.collection('orders').findOne(deliveredPurchaseFilter(auth.email.toLowerCase(), productId), { projection: { _id: 1 } }),
      ]);
      if (!product) return res.status(404).json({ success: false, error: 'Product not found.' });
      if (!customer || !deliveredOrder) {
        return res.status(403).json({ success: false, error: 'Only customers with a delivered order for this product can review it.' });
      }
      const review = {
        _id: customerReviewId(auth.email, productId),
        productId, rating: Number(rating), comment: String(comment).trim(),
        customerName: reviewerDisplayName(String(customer.name || 'Verified customer')),
        verifiedPurchase: true,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      try {
        await database.collection('reviews').insertOne(review as any);
      } catch (err: any) {
        if (err?.code === 11000) return res.status(409).json({ success: false, error: 'You have already reviewed this product.' });
        throw err;
      }
      return res.status(201).json({ success: true, message: 'Your verified review was submitted for moderation.' });
    } catch (err) {
      console.error('Review submission error:', err);
      return res.status(500).json({ success: false, error: 'Could not submit your review. Please try again.' });
    }
  });

  // Owner-only full order list.
  app.get('/api/orders', requireOwner, async (req, res) => {
    try {
      const orders = await mongoGetOrders();
      if (orders === null) return res.status(503).json({ success: false, connected: false, orders: [] });
      return res.json({ success: true, connected: true, orders });
    } catch (err: any) { return res.status(500).json({ success: false, error: 'Request failed. Please try again.' }); }
  });

  // Coupons
  app.get('/api/coupons', requireOwner, async (req, res) => {
    try { const coupons = await mongoGetCoupons(); if (coupons === null) return res.status(503).json({ success: false, connected: false, coupons: [] }); return res.json({ success: true, connected: true, coupons }); }
    catch (err: any) { return res.status(500).json({ success: false, error: 'Request failed. Please try again.' }); }
  });

  app.post('/api/coupons', requireOwner, requireClientHeader, async (req, res) => {
    try {
      const c = req.body || {};
      const code = String(c.code || '').trim().toUpperCase();
      const value = Number(c.discountValue);
      if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return res.status(400).json({ success: false, error: 'Coupon code must be 3-30 letters, numbers, hyphens or underscores.' });
      if (!['PERCENT','AMOUNT'].includes(c.discountType)) return res.status(400).json({ success: false, error: 'Invalid discount type.' });
      if (!Number.isFinite(value) || value <= 0 || (c.discountType === 'PERCENT' && value > 100)) return res.status(400).json({ success: false, error: 'Invalid discount value.' });
      if (!c.expiresAt || String(c.expiresAt) < indiaTodayPlusDays(0)) return res.status(400).json({ success: false, error: 'Expiry date must be today or later.' });
      const rawUsageLimit = c.usageLimitPerCustomer;
      const hasUsageLimit = rawUsageLimit !== undefined && rawUsageLimit !== null && String(rawUsageLimit).trim() !== '';
      const usageLimit = hasUsageLimit ? Number(rawUsageLimit) : undefined;
      if (hasUsageLimit && (!Number.isInteger(usageLimit) || usageLimit < 1 || usageLimit > 1000000)) {
        return res.status(400).json({ success: false, error: 'Uses per customer must be a whole number between 1 and 1,000,000.' });
      }
      const applicableProductIds = Array.isArray(c.applicableProductIds)
        ? c.applicableProductIds.map(String).map((id: string) => id.trim()).filter(Boolean)
        : [];
      const coupon: any = {
        id: String(c.id || `coupon-${crypto.randomUUID()}`),
        code,
        discountType: c.discountType,
        discountValue: value,
        expiresAt: String(c.expiresAt).slice(0,10),
        applicableProductIds,
        firstOrderOnly: Boolean(c.firstOrderOnly),
        active: c.active !== false,
        createdAt: c.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (usageLimit !== undefined) coupon.usageLimitPerCustomer = usageLimit;
      const saved = await mongoSaveCoupon(coupon);
      if (!saved) return res.status(503).json({ success: false, error: 'Database is unavailable.' });
      return res.json({ success: true, coupon: saved });
    } catch (err: any) { if (err?.code === 11000) return res.status(409).json({ success: false, error: 'A coupon with this code already exists.' }); return res.status(500).json({ success: false, error: 'Request failed. Please try again.' }); }
  });

  app.delete('/api/coupons/:id', requireOwner, requireClientHeader, async (req, res) => {
    try { const ok = await mongoDeleteCoupon(req.params.id); return ok ? res.json({ success: true }) : res.status(404).json({ success: false, error: 'Coupon not found.' }); }
    catch (err: any) { return res.status(500).json({ success: false, error: 'Request failed. Please try again.' }); }
  });

  app.post('/api/coupons/validate', requireClientHeader, async (req, res) => {
    try {
      const code = String(req.body?.code || '').trim().toUpperCase();
      const auth = getCustomerAuth(req);
      if (auth?.role !== 'customer' || !auth.email || !(await mongoFindCustomerByEmail(auth.email))?.isVerified) return res.status(401).json({ success: false, error: 'Sign in with a verified account to use coupons.' });
      const email = auth.email;
      const items = Array.isArray(req.body?.items) ? req.body.items : [];
      if (!code || !email) return res.status(400).json({ success: false, error: 'Coupon code and email are required.' });
      const coupon = await mongoFindCoupon(code);
      if (!coupon || coupon.active === false) return res.status(404).json({ success: false, error: 'Invalid or inactive coupon.' });
      if (String(coupon.expiresAt) < indiaTodayPlusDays(0)) return res.status(400).json({ success: false, error: 'This coupon has expired.' });
      if (coupon.firstOrderOnly && await mongoHasCustomerOrder(email)) return res.status(400).json({ success: false, error: 'This coupon is only valid on your first order.' });
      if (coupon.usageLimitPerCustomer) { const uses = await mongoCountCustomerCouponUses(code, email); if (uses === null) return res.status(503).json({ success: false, error: 'Database is unavailable.' }); if (uses >= Number(coupon.usageLimitPerCustomer)) return res.status(400).json({ success: false, error: 'You have reached the usage limit for this coupon.' }); }

      // Resolve product IDs against MongoDB so coupon validation has trusted prices.
      const database = await getMongoDb();
      if (!database) return res.status(503).json({ success: false, error: 'Database is unavailable.' });
      const pricedItems = await resolveCouponItems(items, database);
      const discountAmount = calculateCouponDiscount(coupon, pricedItems);
      if (discountAmount <= 0) return res.status(400).json({ success: false, error: 'This coupon does not apply to the selected products.' });
      return res.json({ success: true, coupon, discountAmount });
    } catch (err: any) { return res.status(500).json({ success: false, error: 'Request failed. Please try again.' }); }
  });

  // Safe customer tracking. Guest users must provide an order number; logged-in customers may access their own orders.
  app.post('/api/orders/lookup', requireClientHeader, async (req, res) => {
    try {
      if (!allowLoginAttempt(`lookup:${String(req.ip || 'unknown')}`, 30)) return res.status(429).json({ success: false, error: 'Too many tracking requests. Please try again later.' });
      const query = String(req.body?.orderNumber || '').trim();
      if (!query) return res.status(400).json({ success: false, error: 'Order number is required.' });
      const auth = getCustomerAuth(req);
      if (auth?.role !== 'customer' || !auth.email) return res.status(401).json({ success: false, error: 'Sign in to track your order.' });
      const order = await mongoFindOrderForCustomer(query, auth.email);
      if (!order) return res.status(404).json({ success: false, error: 'Order not found or access denied.' });
      return res.json({ success: true, order });
    } catch (err: any) { return res.status(500).json({ success: false, error: 'Request failed. Please try again.' }); }
  });

  // Event bouquet enquiries are separate from the product catalogue but share
  // the regular orders collection and admin workflow.
  app.post('/api/orders/custom', requireClientHeader, async (req, res) => {
    try {
      if (!allowLoginAttempt(`custom:${String(req.ip || 'unknown')}`, 8)) {
        return res.status(429).json({ success: false, error: 'Too many enquiries. Please try again later.' });
      }
      const input = req.body || {};
      const size = input.size;
      const customSettings = await mongoGetSettings();
      const sizeChart = customSizeMap(customSettings?.customSizeFlowers);
      if (!isProductSize(size) || Number(input.flowers) !== sizeChart[size]) {
        return res.status(400).json({ success: false, error: 'Size selection changed. Refresh and choose a bouquet size again.' });
      }
      const flowers = sizeChart[size];
      const wrappers = Number(input.wrappers);
      const wrapperType = String(input.wrapperType || '');
      const occasion = String(input.occasion || '').trim();
      const flowerColors = String(input.flowerColors || '').trim();
      const wrapperColor = String(input.wrapperColor || '').trim();
      const name = String(input.name || '').trim();
      const phone = String(input.phone || '').trim();
      const email = String(input.email || '').trim().toLowerCase();
      const address = String(input.address || '').trim();
      const deliveryDate = String(input.deliveryDate || '').trim();
      const extraNotes = String(input.extraNotes || '').trim();
      const withinBerhampore = input.withinBerhampore === true;
      const gypsy = input.gypsy === true;
      const glitter = input.glitter === true;

      if (!Number.isInteger(flowers) || flowers < 25 || flowers > 100 || flowers % 5 !== 0) {
        return res.status(400).json({ success: false, error: 'Choose 25–100 flowers in increments of five.' });
      }
      if (wrapperType !== 'paper' && wrapperType !== 'net') {
        return res.status(400).json({ success: false, error: 'Select a wrapper type.' });
      }
      if (!Number.isInteger(wrappers) || wrappers < minimumWrappers(flowers) || wrappers > 100) {
        return res.status(400).json({ success: false, error: 'Choose enough wrappers for the flower count.' });
      }
      if (!['Wedding','Anniversary','Birthday','Event','Other'].includes(occasion)
        || !flowerColors || flowerColors.length > 200 || !wrapperColor || wrapperColor.length > 120) {
        return res.status(400).json({ success: false, error: 'Provide a valid occasion and flower and wrapper colours.' });
      }
      if (!isValidCustomDeliveryDate(deliveryDate)) {
        return res.status(400).json({ success: false, error: `Delivery must be at least 7 days ahead (from ${indiaDate(7)}).` });
      }
      if (!name || name.length > 120 || !isValidCustomPhone(phone)
        || !address || address.length > 500 || extraNotes.length > 1200
        || (email.length > 0 && !isValidCustomEmail(email))) {
        return res.status(400).json({ success: false, error: 'Please review your name, phone, email and delivery location.' });
      }

      if (!withinBerhampore) return res.status(400).json({ success: false, error: 'Custom bouquet delivery is currently available within Berhampore only.' });
      const estimate = estimateCustomBouquet({ flowers, wrappers, wrapperType, gypsy, glitter, deliveryDate });
      const database = await getMongoDb();
      if (!database) return res.status(503).json({ success: false, error: 'Enquiries are temporarily unavailable.' });
      const now = new Date().toISOString();
      const orderNumber = '';
      const customDetails = {
        occasion, size, flowerCount: flowers, flowerColors, wrapperColor,
        wrapperType, wrapperCount: wrappers, gypsy, glitter,
        extraNotes, estimatedMin: estimate.minimum, estimatedMax: estimate.maximum,
      };
      // Custom requests are not confirmed sales. Preserve the range, not a fictional amount.
      const order = {
        id: `ord-${crypto.randomUUID()}`, orderNumber,
        orderType: 'Custom', customDetails, status: 'Order Placed',
        createdAt: now, updatedAt: now,
        items: [{
          bouquet: {
            id: `custom-enquiry-${orderNumber}`, title: `Custom ${occasion} Bouquet`,
            price: 0, imageUrl: '', description: extraNotes,
            flowerCount: flowers, category: 'Custom', ribbonColors: [flowerColors],
            ribbonMaterial: 'Custom', inStock: true, createdAt: now,
          }, quantity: 1,
        }],
        subtotal: 0, deliveryFee: 0, codHandlingCharge: 0,
        totalAmount: 0, customer: {
          fullName: name, email, phone, deliveryAddress: address, city: SERVICE_CITY,
          pincode: '', deliveryDate, deliveryTimeSlot: '', specialInstructions: extraNotes,
          giftNote: '',
        }, customerEmail: email,
        payment: { method: 'CONTACT_LATER', paymentStatus: 'Not Required', paidAt: '' },
      };
      const saved = await mongoCreateOrder(order);
      if (!saved) return res.status(503).json({ success: false, error: 'Unable to save your enquiry.' });
      return res.status(201).json({
        success: true, orderNumber: saved.orderNumber, estimatedMin: estimate.minimum, estimatedMax: estimate.maximum,
      });
    } catch (err: any) {
      console.error('Custom enquiry error:', err);
      return res.status(500).json({ success: false, error: 'Unable to submit your enquiry.' });
    }
  });

  // Authoritative order creation: server calculates product prices, fees and IDs.
  app.post('/api/orders', requireClientHeader, async (req, res) => {
    try {
      if (!allowLoginAttempt(`order:${String(req.ip || 'unknown')}`, 20)) return res.status(429).json({ success: false, error: 'Too many order attempts. Please try again later.' });
      const body = req.body || {};
      const rawItems = Array.isArray(body.items) ? body.items : [];
      if (!rawItems.length) return res.status(400).json({ success: false, error: 'Your cart is empty.' });
      const c = body.customer || {};
      const required = ['fullName', 'email', 'phone', 'deliveryAddress', 'city', 'pincode'];
      for (const key of required) if (!String(c[key] || '').trim()) return res.status(400).json({ success: false, error: `Customer ${key} is required.` });
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(c.email).trim())) return res.status(400).json({ success: false, error: 'A valid customer email is required.' });
      if (!/^\d{6}$/.test(String(c.pincode).replace(/\s/g, ''))) return res.status(400).json({ success: false, error: 'A valid 6-digit pincode is required.' });
      if (!/^[0-9]{6}$/.test(String(c.pincode || ''))) return res.status(400).json({ success: false, error: 'Enter a valid 6-digit delivery PIN code.' });

      // Requested date is optional; our team confirms availability by phone.
      const database = await getMongoDb();
      if (!database) return res.status(503).json({ success: false, error: 'Orders are temporarily unavailable. Please try again in a moment.' });
      const normalizedItems: any[] = [];
      const quantityByVariant = new Map<string, number>();
      const stockReservations = new Map<string, { quantity: number; updatedAt: string | undefined }>();
      for (const raw of rawItems) {
        const id = String(raw?.bouquet?.id || raw?.productId || '').trim();
        const quantity = Number(raw?.quantity);
        if (!id || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return res.status(400).json({ success: false, error: 'Invalid cart item or quantity.' });
        const product = await database.collection('products').findOne({ id });
        if (!product) return res.status(400).json({ success: false, error: 'A selected product is no longer available.' });
        if (product.inStock === false) return res.status(409).json({ success: false, error: `${product.title || 'A selected product'} is currently out of stock.` });
        const bouquetProduct = hasProductSizes({ category: product.category, sizeOptions: product.sizeOptions });
        const selectedSize = raw.selectedSize || 'M';
        const variant = bouquetProduct ? productSizeFor(product as any, selectedSize) : null;
        if (bouquetProduct && !variant) {
          return res.status(409).json({ success: false, error: `${product.title} is not available in the selected size. Please update your bag.` });
        }
        const cartKey = id + ':' + (variant?.size || 'ONE');
        const totalForVariant = (quantityByVariant.get(cartKey) || 0) + quantity;
        if (totalForVariant > 20) {
          return res.status(400).json({ success: false, error: 'Maximum 20 pieces per product size per order.' });
        }
        quantityByVariant.set(cartKey, totalForVariant);
        if (!Number.isSafeInteger(product.stockLeft)) return res.status(409).json({ success: false, error: `${product.title} has no configured stock. Please contact the shop.` });
        {
          const requested = (stockReservations.get(id)?.quantity ?? 0) + quantity;
          if (requested > product.stockLeft) {
            return res.status(409).json({ success: false, error: `Only ${product.stockLeft} left in stock for ${product.title}.` });
          }
          stockReservations.set(id, { quantity: requested, updatedAt: product.updatedAt });
        }
        const itemSnapshot = variant ? {
          ...product, flowerCount: variant.flowerCount, price: variant.price, imageUrl: variant.images?.[0] || product.imageUrl,
        } : product;
        normalizedItems.push({ bouquet: itemSnapshot, quantity, selectedSize: variant?.size });
      }
      const subtotal = normalizedItems.reduce((sum, item) => sum + Number(item.bouquet.price || 0) * item.quantity, 0);
      const parcel=estimateParcel(normalizedItems);
      if (!parcel && !localShipping(String(c.pincode))) return res.status(409).json({success:false,error:'Packed dimensions are missing or combined package is too large. Please contact the shop.'});
      let deliveryFee: number;
      let shippingEstimate: any;
      const shippingSettings = await mongoGetSettings();
      if (!shippingSettings) return res.status(503).json({ success:false,error:'Store delivery settings are unavailable.' });
      const isLocal=Boolean(localShipping(String(c.pincode)));
      const requestedMode=body.deliveryMode??(isLocal?'local':'standard');
      if(isLocal?requestedMode!=='local':!enabledCourierModes(shippingSettings).includes(requestedMode))return res.status(409).json({success:false,error:'Selected delivery method is unavailable. Refresh checkout.'});
      const deliveryMode:DeliveryMode=requestedMode;
      try {
        const quote = await getShippingQuote(String(c.pincode), parcel?chargeableGrams(parcel):1, true,deliveryMode==='express'?'express':'standard',preparationDaysFor(shippingSettings));
        shippingEstimate={...quote,parcel,quotedAt:new Date().toISOString()};
        if (c.deliveryDate && (!quote.estimatedDeliveryDate || !/^\d{4}-\d{2}-\d{2}$/.test(String(c.deliveryDate)) || String(c.deliveryDate) < (quote.earliestDeliveryDate || quote.estimatedDeliveryDate)))
          return res.status(400).json({ success: false, error: 'Preferred delivery date must be on or after the earliest available delivery date. Leave blank when an estimate is unavailable.' });
        deliveryFee = quote.shippingCharge;
      } catch {
        return res.status(503).json({ success: false, error: 'Courier rate is unavailable. Your order has not been placed. Please try later.' });
      }
      const codHandlingCharge = 0;
      let discountAmount = 0;
      const couponCode = String(body.couponCode || '').trim().toUpperCase();
      let couponDoc: any = null;
      if (couponCode) {
        const auth = getCustomerAuth(req);
        if (auth?.role !== 'customer' || !auth.email || !(await mongoFindCustomerByEmail(auth.email))?.isVerified || auth.email !== String(c.email).trim().toLowerCase()) return res.status(401).json({ success: false, error: 'Sign in with a verified account and use its email to apply coupons.' });
        couponDoc = await mongoFindCoupon(couponCode);
        if (!couponDoc || couponDoc.active === false || String(couponDoc.expiresAt) < indiaTodayPlusDays(0)) return res.status(400).json({ success: false, error: 'Coupon is invalid or expired.' });
        if (couponDoc.firstOrderOnly && await mongoHasCustomerOrder(String(c.email))) return res.status(400).json({ success: false, error: 'This coupon is only valid on your first order.' });
        if (couponDoc.usageLimitPerCustomer) { const uses = await mongoCountCustomerCouponUses(couponCode, String(c.email)); if (uses === null || uses >= Number(couponDoc.usageLimitPerCustomer)) return res.status(400).json({ success: false, error: 'Coupon usage limit reached for this customer.' }); }
        const couponItems = normalizedItems.map(item => ({ productId: item.bouquet.id, quantity: item.quantity, price: item.bouquet.price }));
        discountAmount = calculateCouponDiscount(couponDoc, couponItems);
        if (discountAmount <= 0) return res.status(400).json({ success: false, error: 'This coupon does not apply to the selected products.' });
      }
      const freeDeliveryThreshold = Number(shippingSettings.freeDeliveryThreshold || 0);
      deliveryFee=customerShippingFee(deliveryFee,subtotal,freeDeliveryThreshold,deliveryMode);
      const totalAmount = Math.round((Math.max(0, subtotal - discountAmount) + deliveryFee) * 100) / 100;
      if(Math.abs(Number(body.totalAmount)-totalAmount)>0.009 || Math.abs(Number(body.deliveryFee)-deliveryFee)>0.009 || !Number.isFinite(Number(body.totalAmount)) || !Number.isFinite(Number(body.deliveryFee))) return res.status(409).json({success:false,error:'Order price or shipping changed. Refresh checkout to review the updated amount.'});
      const now = new Date().toISOString();
      const id = `ord-${crypto.randomUUID()}`;
      const orderNumber = '';
      const customerAuth = getCustomerAuth(req);
      const safeCustomer = {
        fullName: String(c.fullName).trim().slice(0, 120), email: String(c.email).trim().toLowerCase().slice(0, 254), phone: String(c.phone).trim().slice(0, 30),
        deliveryAddress: String(c.deliveryAddress).trim().slice(0, 500), city: String(c.city).trim().slice(0, 120), pincode: String(c.pincode).replace(/\s/g, ''),
        deliveryDate: String(c.deliveryDate).trim(), deliveryTimeSlot: String(c.deliveryTimeSlot || '').slice(0, 100), specialInstructions: String(c.specialInstructions || '').slice(0, 500), giftNote: String(c.giftNote || '').slice(0, 500),
      };
      const paymentMethod = 'CONTACT_LATER';
      const order = {
        id, orderNumber, createdAt: now, updatedAt: now, status: 'Order Placed', items: normalizedItems, subtotal, deliveryFee, codHandlingCharge, totalAmount, shippingEstimate, deliveryMode,
        couponCode: couponCode || undefined, discountAmount,
        customer: safeCustomer,
        authenticatedCustomer: customerAuth?.role === 'customer',
        customerEmail: customerAuth?.role === 'customer' ? customerAuth.email : safeCustomer.email,
        payment: {
          method: paymentMethod,
          paymentStatus: 'Not Required',
          paidAt: '',
        },
      };
      const saved = await mongoCreateOrder(order, stockReservations);
      if (saved === false) return res.status(409).json({ success: false, error: 'Product stock or pricing changed. Refresh your bag and try again.' });
      if (!saved) return res.status(503).json({ success: false, error: 'Order could not be saved. Please try again.' });
      order.orderNumber = saved.orderNumber;
      if (safeCustomer.email) {
        try {
          const rows = normalizedItems.map((item: any) => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${String(item.bouquet.title)}${item.selectedSize ? ' (' + (productSizeFor(item.bouquet, item.selectedSize)?.name || PRODUCT_SIZE_LABELS[item.selectedSize as keyof typeof PRODUCT_SIZE_LABELS]) + ', ' + item.bouquet.flowerCount + ' flowers)' : ''}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₹${Number(item.bouquet.price) * item.quantity}</td></tr>`).join('');
          await sendEmailWithAgentMail({
            to: safeCustomer.email,
            subject: `Jame Bouquets — Order Placed ${order.orderNumber}`,
            html: `<div style="font-family:Georgia,serif;max-width:640px;margin:auto;padding:28px;color:#292524"><h1>Jame Bouquets</h1><h2>Order Placed!</h2><p>Thank you for your order <strong>${order.orderNumber}</strong>.</p><p>Our team will contact you by phone to confirm your order and discuss payment. No payment is required on the website.</p><table style="width:100%"><tbody>${rows}</tbody></table><p>Products subtotal: ₹${subtotal}</p><p>Delivery: ₹${deliveryFee} · Total: ₹${totalAmount}</p><p><strong>Phone:</strong> ${safeCustomer.phone}</p><p><strong>Delivery address:</strong> ${safeCustomer.deliveryAddress}, ${safeCustomer.city} - ${safeCustomer.pincode}</p></div>`,
          });
        } catch (emailErr) { console.error("[Jame Bouquets] Order confirmation email failed:", emailErr); }
      }
      return res.status(201).json({ success: true, connected: true, order: saved });
    } catch (err: any) { console.error('Order creation error:', err); return res.status(500).json({ success: false, error: 'Could not place your order. Please try again.' }); }
  });


  // Owner-only dispatch. No carrier mutation until the owner explicitly confirms a packed, paid order.
  app.post('/api/admin/orders/:id/parcel-quote',requireOwner,requireClientHeader,async(req,res)=>{
    try{
      const db=await getMongoDb();const order=await db?.collection('orders').findOne({id:req.params.id});
      if(!order||order.orderType==='Custom')return res.status(404).json({success:false,error:'Standard order not found.'});
      if(localShipping(order.customer.pincode))return res.status(400).json({success:false,error:'Local delivery: courier pickup is not needed.'});
      if(!validParcel(req.body?.parcel))return res.status(400).json({success:false,error:'Enter valid actual packed measurements.'});
      const quote=await getShippingQuote(order.customer.pincode,chargeableGrams(req.body.parcel),true,order.deliveryMode==='express'?'express':'standard');
      return res.json({success:true,...quote});
    }catch{return res.status(503).json({success:false,error:'Courier quote unavailable.'});}
  });
  app.post('/api/admin/orders/:id/ready-for-pickup',requireOwner,requireClientHeader,async(req,res)=>{
    const token=process.env.DELHIVERY_API_TOKEN?.trim(),warehouse=process.env.DELHIVERY_PICKUP_LOCATION?.trim();
    const environment=process.env.DELHIVERY_ENV==='staging'?'staging':'production';
    const host=environment==='staging'?'https://staging-express.delhivery.com':'https://track.delhivery.com';
    if(process.env.DELHIVERY_DISPATCH_ENABLED!=='true'||!token||!warehouse)return res.status(503).json({success:false,error:'Pickup is disabled until Delhivery token, registered warehouse and dispatch enable flag are configured.'});
    const parcel=req.body?.parcel, date=String(req.body?.pickupDate||''),time=String(req.body?.pickupTime||'');
    if(!validParcel(parcel)||!/^\d{4}-\d{2}-\d{2}$/.test(date)||date<indiaTodayPlusDays(0)||date>indiaTodayPlusDays(7)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)||req.body?.paymentConfirmed!==true||req.body?.confirmSingleBox!==true)
      return res.status(400).json({success:false,error:'Confirm full payment and one packed box, valid measurements, and pickup date/time within 7 days.'});
    const db=await getMongoDb();if(!db)return res.status(503).json({success:false,error:'Database unavailable.'});
    const collection=db.collection('orders');
    const order=await collection.findOne({id:req.params.id});
    if(!order||order.orderType==='Custom'||!['Order Placed','Pending'].includes(order.status))return res.status(409).json({success:false,error:'Only active standard orders can be dispatched.'});
    if(localShipping(order.customer.pincode))return res.status(409).json({success:false,error:'This is a local delivery order.'});
    if(order.courierShipment)return res.status(409).json({success:false,error:'Shipment already started. Check Delhivery One before any further action; do not create a duplicate.'});
    let quote:any;
    try{quote=await getShippingQuote(order.customer.pincode,chargeableGrams(parcel),true,order.deliveryMode==='express'?'express':'standard');}catch{return res.status(503).json({success:false,error:'Unable to verify current courier cost.'});}
    if(Number(req.body?.acceptedCourierFee)!==quote.shippingCharge)return res.status(409).json({success:false,error:'Courier cost changed. Recalculate and confirm the new amount.'});
    const at=new Date().toISOString();
    const initial={state:'manifesting',environment,warehouse,parcel,deliveryMode:order.deliveryMode==='express'?'express':'standard',estimatedCourierFee:quote.shippingCharge,customerDeliveryFee:order.deliveryFee,startedAt:at,pickupDate:date,pickupTime:time};
    // Atomic durable lock. Timeouts/uncertain provider outcomes require manual reconciliation, not automatic retries.
    const lock=await collection.updateOne({id:order.id,status:{$in:['Order Placed','Pending']},courierShipment:{$exists:false}},{$set:{courierShipment:initial,updatedAt:at,'payment.paymentStatus':'Verified','payment.paidAt':at}});
    if(lock.modifiedCount!==1)return res.status(409).json({success:false,error:'Dispatch already started; refresh the order.'});
    let waybill='',stage='manifesting';
    const persist=async(state:string,extra:any={})=>{await collection.updateOne({id:order.id},{$set:{courierShipment:{...initial,state,...(waybill?{waybill}:{}),...extra},updatedAt:new Date().toISOString()}});};
    const post=async(path:string,body:string,contentType:string)=>{
      const response=await fetch(host+path,{method:'POST',headers:{Authorization:'Token '+token,Accept:'application/json','Content-Type':contentType},body,signal:AbortSignal.timeout(15000)});
      const data:any=await response.json().catch(()=>null);return {ok:response.ok,data};
    };
    try{
      const cust=order.customer;
      const shipment={order:order.orderNumber,invoice_reference:order.orderNumber,name:cust.fullName,add:cust.deliveryAddress,pin:String(cust.pincode),city:cust.city,phone:cust.phone,country:'India',payment_mode:'Pre-paid',cod_amount:0,total_amount:order.totalAmount,products_desc:order.items.map((i:any)=>i.bouquet.title+' x'+i.quantity).join(', ').slice(0,250),quantity:order.items.reduce((n:number,i:any)=>n+i.quantity,0),weight:Math.ceil(parcel.parcelWeightGrams),shipment_length:parcel.parcelLengthCm,shipment_width:parcel.parcelWidthCm,shipment_height:parcel.parcelHeightCm,shipping_mode:carrierShippingName(order.deliveryMode==='express'?'express':'standard'),seller_name:'Jame Bouquets'};
      const manifest=await post('/api/cmu/create.json',new URLSearchParams({format:'json',data:JSON.stringify({pickup_location:{name:warehouse},shipments:[shipment]})}).toString(),'application/x-www-form-urlencoded');
      const pack=manifest.data?.packages?.[0];
      if(!manifest.ok||manifest.data?.success!==true||!pack?.waybill||/fail|error/i.test(String(pack.status||'')))throw Error('Shipment not confirmed');
      waybill=String(pack.waybill);stage='pickup';
      await persist('manifested');
      const pickup=await post('/fm/request/new/',JSON.stringify({pickup_location:warehouse,pickup_date:date,pickup_time:time+':00',expected_package_count:1}),'application/json');
      const pickupId=pickup.data?.pickup_id??pickup.data?.data?.pickup_id;
      if(!pickup.ok||!pickupId)throw Error('Pickup not confirmed');
      await persist('pickup_requested',{pickupId:String(pickupId)});
      return res.json({success:true,order:await collection.findOne({id:order.id})});
    }catch{
      await persist(stage==='manifesting'?'manifest_review_required':'pickup_review_required').catch(()=>{});
      return res.status(502).json({success:false,error:stage==='manifesting'?'Shipment outcome needs verification in Delhivery One. Do not retry blindly.':'Shipment created; pickup was not confirmed. Check Delhivery One for an existing warehouse pickup or arrange it manually.'});
    }
  });

  app.patch('/api/orders/:id/status', requireOwner, requireClientHeader, async (req, res) => {
    try {
      const allowed = new Set(['Order Placed', 'Pending', 'Delivered', 'Cancelled']);
      const status = String(req.body?.status || '');
      if (!allowed.has(status)) return res.status(400).json({ success: false, error: 'Invalid order status.' });
      const updated = await mongoUpdateOrderStatus(req.params.id, status);
      if (!updated) return res.status(404).json({ success: false, error: 'Order not found.' });
      return res.json({ success: true, connected: true, order: updated });
    } catch (err: any) { return res.status(500).json({ success: false, error: 'Request failed. Please try again.' }); }
  });

  // 6. Settings Endpoints
  app.get('/api/settings', async (req, res) => {
    try {
      const settings = await mongoGetSettings();
      // Translate old business-name defaults without overwriting intentional custom names.
      const legacyName = /^(jerry(?:'s|s)? garden|jericasgarden)$/i;
      const displaySettings = settings
        ? { ...settings, preparationDays:preparationDaysFor(settings),standardDeliveryEnabled:settings.standardDeliveryEnabled!==false,expressDeliveryEnabled:settings.expressDeliveryEnabled!==false,customSizeFlowers: customSizeMap(settings.customSizeFlowers), storeName: legacyName.test(String(settings.storeName || '').trim())
            ? 'Jame Bouquets' : (settings.storeName || 'Jame Bouquets') }
        : null;
      return res.json({ success: true, connected: settings !== null, settings: displaySettings });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Request failed. Please try again.' });
    }
  });

  app.post('/api/settings', requireOwner, requireClientHeader, async (req, res) => {
    try {
      const settings = req.body || {};
      const storeName = String(settings.storeName || '').trim();
      const logoUrl = String(settings.logoUrl || '').trim();
      if (storeName.length < 2 || storeName.length > 60) {
        return res.status(400).json({ success: false, error: 'Business name must contain 2 to 60 characters.' });
      }
      if (logoUrl && (logoUrl.length > 1000 || !/^https:\/\/res\.cloudinary\.com\//i.test(logoUrl))) {
        return res.status(400).json({ success: false, error: 'The logo must be a secure Cloudinary image.' });
      }
      if (!validateCustomSizeFlowers(settings.customSizeFlowers)) {
        return res.status(400).json({ success: false, error: 'Set four increasing custom bouquet flower counts (25–100, multiples of five).' });
      }
      const threshold = Number(settings.freeDeliveryThreshold ?? 0);
      if (!Number.isInteger(threshold) || threshold < 0 || threshold > 1000000)
        return res.status(400).json({ success: false, error: 'Free delivery threshold must be a whole number from 0 to 1000000.' });
      const existing = await mongoGetSettings();
      const preparationDays=settings.preparationDays??preparationDaysFor(existing);
      const standardDeliveryEnabled=settings.standardDeliveryEnabled??(existing?.standardDeliveryEnabled!==false);
      const expressDeliveryEnabled=settings.expressDeliveryEnabled??(existing?.expressDeliveryEnabled!==false);
      if(!Number.isInteger(preparationDays)||preparationDays<0||preparationDays>30||typeof standardDeliveryEnabled!=='boolean'||typeof expressDeliveryEnabled!=='boolean'||(!standardDeliveryEnabled&&!expressDeliveryEnabled))return res.status(400).json({success:false,error:'Set preparation time to 0–30 whole days and enable at least one courier mode.'});
      const saved = await mongoUpdateSettings({
        ...(existing || {
          tagline: 'Everlasting, by hand.', ownerEmail: ADMIN_EMAIL, upiId: '', upiName: '',
          city: 'Berhampore', deliveryFee: 0, freeDeliveryThreshold: 0,
        }), storeName, logoUrl, freeDeliveryThreshold: threshold,preparationDays,standardDeliveryEnabled,expressDeliveryEnabled,
        customSizeFlowers: customSizeMap(settings.customSizeFlowers),
        productCategories: (() => {
          const raw = settings.productCategories;
          if (!Array.isArray(raw)) return existing?.productCategories || ['Ribbon Bouquets', 'Pipecleaner Bouquets', 'Bouquet Keychains', 'Pipecleaner Keychains', 'Gift Combos', 'Decor Items'];
          return Array.from(new Set(raw.map((item: unknown) => typeof item === 'string' ? item.trim() : '').filter((item: string) => item.length >= 2 && item.length <= 50))).slice(0, 40);
        })(),
        phone: String(settings.phone || '').slice(0, 100),
        whatsapp: String(settings.whatsapp || '').slice(0, 100),
        address: String(settings.address || '').slice(0, 300),
      });
      if (!saved) return res.status(503).json({ success: false, error: 'Unable to save settings.' });
      const cleanup = existing?.logoUrl && existing.logoUrl !== saved.logoUrl
        ? await cleanupUnreferencedCloudinaryImage(existing.logoUrl, 'jame_bouquets_branding')
        : { status: 'skipped' as const };
      return res.json({ success: true, connected: true, settings: saved, cleanupWarning: cleanup.warning });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Request failed. Please try again.' });
    }
  });

  // Vite middleware for development vs static in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
