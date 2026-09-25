import express from 'express';
import crypto from 'crypto';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import {
  getMongoStatus,
  seedMongoCollections,
  buildCollections,
  buildCollectionsForCustomersAndProducts,
  setCustomMongoUri,
  getActiveMongoConfig,
  mongoGetCustomers,
  mongoSaveCustomer,
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

function requireOwner(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = parseCookies(req)[OWNER_COOKIE];
  const auth = verifyToken(token);
  if (!auth || auth.role !== 'owner') return res.status(401).json({ success: false, error: 'Owner authentication required.' });
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
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "Jerry's Garden";

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
  const applicableIds = Array.isArray(coupon.applicableProductIds) ? coupon.applicableProductIds : [];
  const applicable = items.filter(i => applicableIds.length === 0 || applicableIds.includes(String(i?.bouquet?.id || i?.productId)));
  const base = applicable.reduce((sum, i) => sum + Number(i?.bouquet?.price || 0) * Number(i?.quantity || 0), 0);
  if (base <= 0) return 0;
  const value = Number(coupon.discountValue || 0);
  const discount = coupon.discountType === 'PERCENT' ? base * value / 100 : value;
  return Math.min(Math.max(0, Math.round(discount * 100) / 100), base);
}

async function startServer() {

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Allow the Vercel frontend to call this Render backend.
  // Add FRONTEND_URL in Render Environment Variables.
  const allowedOrigins = [
    'http://localhost:5173',
    'https://jerrys-garden.vercel.app',
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

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    next();
  });

  // Body parsing for base64 uploads (up to 30mb)
  app.use(express.json({ limit: '10mb' }));

  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: "Jerry's Garden Bouquet API",
      auth: { ownerConfigured: Boolean(ADMIN_EMAIL && ADMIN_PASSWORD && AUTH_SECRET) },
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

      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: 'jerrys_garden_bouquets',
        resource_type: 'image',
      });

      console.log('Successfully uploaded image to Cloudinary:', uploadResponse.secure_url);

      return res.json({
        success: true,
        url: uploadResponse.secure_url,
        public_id: uploadResponse.public_id,
        width: uploadResponse.width,
        height: uploadResponse.height,
        format: uploadResponse.format,
      });
    } catch (error: any) {
      console.error('Cloudinary upload error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to upload image to Cloudinary',
      });
    }
  });

  // Owner authentication
  app.post('/api/admin/login', requireClientHeader, (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!allowLoginAttempt(String(req.ip || 'unknown'), 8)) return res.status(429).json({ success: false, error: 'Too many login attempts. Please try again later.' });
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !AUTH_SECRET) {
      return res.status(503).json({ success: false, error: 'Owner authentication is not configured on the server.' });
    }
    if (!email || !password || email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, error: 'Invalid owner credentials.' });
    }
    const token = signToken({ role: 'owner', email }, 60 * 60 * 12);
    setAuthCookie(res, OWNER_COOKIE, token, 60 * 60 * 12);
    return res.json({ success: true, user: { email } });
  });

  app.get('/api/admin/session', (req, res) => {
    const auth = verifyToken(parseCookies(req)[OWNER_COOKIE]);
    return res.json({ authenticated: Boolean(auth?.role === 'owner'), email: auth?.email || null });
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
                <h1 style="font-family: Georgia, serif; font-size: 26px; color: #881337; margin: 0; font-weight: bold;">JericasGarden</h1>
                <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #e11d48; margin: 6px 0 0 0; font-weight: 600;">Handcrafted Satin Ribbon Bouquets</p>
              </div>

              <div style="padding: 32px 28px;">
                <h2 style="font-size: 18px; color: #1c1917; margin: 0 0 12px 0;">Hello ${recipientName},</h2>
                <p style="font-size: 14px; line-height: 1.6; color: #57534e; margin: 0 0 20px 0;">
                  Thank you for signing up with <strong>JericasGarden</strong>. Please enter the 6-digit verification code below to confirm your email and complete your account creation:
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
                  <strong>Notice:</strong> If you did not create an account on JericasGarden, please ignore this email. Never share your verification code with anyone.
                </div>
              </div>

              <div style="padding: 20px 24px; background: #fafaf9; text-align: center; font-size: 11px; color: #a8a29e; border-top: 1px solid #f5f5f4;">
                © 2026 JericasGarden • Berhampore, Murshidabad, West Bengal<br>
                Everlasting Satin Ribbon Artistry
              </div>

            </div>
          </div>
        `,
      });

      console.log(`[JericasGarden] OTP email successfully dispatched to: ${normalizedEmail}`);

      // Crucial: do NOT return the code to the frontend!
      return res.json({
        success: true,
        message: `A 6-digit verification code has been sent to ${normalizedEmail}. Please check your inbox or spam folder.`,
      });
    } catch (error: any) {
      console.error('[JericasGarden] Failed to send OTP email:', error);
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
      console.error('[JericasGarden] Error verifying OTP:', error);
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
    catch (err: any) { return res.status(500).json({ configured: false, connected: false, error: err.message }); }
  });

  // Development/database maintenance endpoints are owner-only.
  app.post('/api/mongodb/build-collections', requireOwner, requireClientHeader, async (req, res) => {
    try {
      const results = await buildCollections(req.body || {});
      return res.json({ success: true, message: 'Collections verified successfully.', results });
    } catch (err: any) { return res.status(500).json({ success: false, error: err.message || 'Failed to build collections' }); }
  });

  app.post('/api/mongodb/build-customers-products', requireOwner, requireClientHeader, async (req, res) => {
    try {
      const results = await buildCollectionsForCustomersAndProducts(req.body || {});
      return res.json({ success: true, message: 'Collections verified successfully.', results });
    } catch (err: any) { return res.status(500).json({ success: false, error: err.message || 'Failed to build collections' }); }
  });

  app.post('/api/mongodb/config', requireOwner, requireClientHeader, async (req, res) => {
    // Intentionally retained for the existing dashboard, but now owner-only.
    try {
      const { uri, database } = req.body || {};
      if (!uri || typeof uri !== 'string' || !uri.startsWith('mongodb')) return res.status(400).json({ success: false, error: 'A valid MongoDB URI is required.' });
      setCustomMongoUri(uri, database);
      return res.json({ success: true, message: 'MongoDB configuration updated.', status: await getMongoStatus() });
    } catch (err: any) { return res.status(500).json({ success: false, error: err.message || 'Failed to update MongoDB configuration' }); }
  });

  app.post('/api/mongodb/seed', requireOwner, requireClientHeader, async (req, res) => {
    try {
      const results = await seedMongoCollections(req.body || {});
      return res.json({ success: true, message: 'Data synchronized with MongoDB.', results });
    } catch (err: any) { return res.status(500).json({ success: false, error: err.message || 'Failed to sync with MongoDB' }); }
  });

  // Customers: only owner can list customers. Registration/login are public.
  app.get('/api/customers', requireOwner, async (req, res) => {
    try {
      const customers = await mongoGetCustomers();
      if (customers === null) return res.status(503).json({ success: false, connected: false, customers: [] });
      return res.json({ success: true, connected: true, customers });
    } catch (err: any) { return res.status(500).json({ success: false, error: err.message }); }
  });

  app.post('/api/customers/register', requireClientHeader, async (req, res) => {
    try {
      const { name, email, phone, address, password, verificationToken } = req.body || {};
      if (!name || !email || !phone || !password || typeof verificationToken !== 'string') return res.status(400).json({ success: false, error: 'Name, email, phone, password and email verification are required.' });
      const otpAuth = verifyToken(verificationToken);
      const normalizedEmail = String(email).trim().toLowerCase();
      if (!otpAuth || otpAuth.role !== 'otp' || !otpAuth.verified || otpAuth.email !== normalizedEmail) return res.status(401).json({ success: false, error: 'Email verification is required before creating the account.' });
      if (String(password).length < 6) return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
      const saved = await mongoSaveCustomer({ name: String(name).trim(), email: normalizedEmail, phone: String(phone).trim(), address: String(address || '').trim(), password, isVerified: true });
      if (!saved) return res.status(503).json({ success: false, connected: false, error: 'Database is unavailable. Please try again.' });
      const token = signToken({ role: 'customer', email: normalizedEmail }, 60 * 60 * 24 * 30);
      setAuthCookie(res, CUSTOMER_COOKIE, token, 60 * 60 * 24 * 30);
      return res.json({ success: true, connected: true, user: saved });
    } catch (err: any) {
      if (err?.code === 11000) return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/customers/login', requireClientHeader, async (req, res) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      const password = String(req.body?.password || '');
      if (!allowLoginAttempt(String(req.ip || 'unknown'), 10)) return res.status(429).json({ success: false, error: 'Too many login attempts. Please try again later.' });
      if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password are required.' });
      const verification = await mongoVerifyCustomerLogin(email, password);
      if (verification === null) return res.status(503).json({ success: false, connected: false, error: 'Database is unavailable. Please try again.' });
      if (!verification.success) return res.status(401).json({ success: false, connected: true, error: verification.reason === 'NOT_FOUND' ? 'No account found with this email.' : 'Incorrect password.' });
      const token = signToken({ role: 'customer', email }, 60 * 60 * 24 * 30);
      setAuthCookie(res, CUSTOMER_COOKIE, token, 60 * 60 * 24 * 30);
      return res.json({ success: true, connected: true, user: verification.user });
    } catch (err: any) { return res.status(500).json({ success: false, error: err.message }); }
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
      return res.status(500).json({ authenticated: false, error: err.message });
    }
  });

  app.get('/api/customers/orders', requireClientHeader, async (req, res) => {
    try {
      const auth = getCustomerAuth(req);
      if (!auth || auth.role !== 'customer' || !auth.email) return res.status(401).json({ success: false, error: 'Customer authentication required.' });
      const orders = await mongoGetOrdersForCustomer(auth.email);
      if (orders === null) return res.status(503).json({ success: false, connected: false, orders: [] });
      return res.json({ success: true, connected: true, orders });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Public catalogue read; writes require owner auth.
  app.get('/api/bouquets', async (req, res) => {
    try {
      const bouquets = await mongoGetBouquets();
      if (bouquets === null) return res.status(503).json({ success: false, connected: false, bouquets: [] });
      return res.json({ success: true, connected: true, bouquets });
    } catch (err: any) { return res.status(500).json({ success: false, error: err.message }); }
  });

  app.post('/api/bouquets', requireOwner, requireClientHeader, async (req, res) => {
    try {
      const bouquet = req.body;
      if (!bouquet || !bouquet.id || !bouquet.title || typeof bouquet.price !== 'number' || bouquet.price < 0) return res.status(400).json({ success: false, error: 'Valid bouquet data is required.' });
      const saved = await mongoSaveBouquet(bouquet);
      if (!saved) return res.status(503).json({ success: false, connected: false, error: 'Database is unavailable.' });
      return res.json({ success: true, connected: true, bouquet: saved });
    } catch (err: any) { return res.status(500).json({ success: false, error: err.message }); }
  });

  app.delete('/api/bouquets/:id', requireOwner, requireClientHeader, async (req, res) => {
    try {
      const deleted = await mongoDeleteBouquet(req.params.id);
      if (deleted === null) return res.status(503).json({ success: false, connected: false, error: 'Database is unavailable.' });
      return res.json({ success: true, connected: true, deleted });
    } catch (err: any) { return res.status(500).json({ success: false, error: err.message }); }
  });

  // Owner-only full order list.
  app.get('/api/orders', requireOwner, async (req, res) => {
    try {
      const orders = await mongoGetOrders();
      if (orders === null) return res.status(503).json({ success: false, connected: false, orders: [] });
      return res.json({ success: true, connected: true, orders });
    } catch (err: any) { return res.status(500).json({ success: false, error: err.message }); }
  });

  // Coupons
  app.get('/api/coupons', requireOwner, async (req, res) => {
    try { const coupons = await mongoGetCoupons(); if (coupons === null) return res.status(503).json({ success: false, connected: false, coupons: [] }); return res.json({ success: true, connected: true, coupons }); }
    catch (err: any) { return res.status(500).json({ success: false, error: err.message }); }
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
      const coupon = { id: String(c.id || `coupon-${crypto.randomUUID()}`), code, discountType: c.discountType, discountValue: value, expiresAt: String(c.expiresAt).slice(0,10), applicableProductIds: Array.isArray(c.applicableProductIds) ? c.applicableProductIds.map(String) : [], usageLimitPerCustomer: c.usageLimitPerCustomer ? Math.max(1, Number(c.usageLimitPerCustomer)) : undefined, firstOrderOnly: Boolean(c.firstOrderOnly), active: c.active !== false, createdAt: c.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
      const saved = await mongoSaveCoupon(coupon);
      if (!saved) return res.status(503).json({ success: false, error: 'Database is unavailable.' });
      return res.json({ success: true, coupon: saved });
    } catch (err: any) { if (err?.code === 11000) return res.status(409).json({ success: false, error: 'A coupon with this code already exists.' }); return res.status(500).json({ success: false, error: err.message }); }
  });

  app.delete('/api/coupons/:id', requireOwner, requireClientHeader, async (req, res) => {
    try { const ok = await mongoDeleteCoupon(req.params.id); return ok ? res.json({ success: true }) : res.status(404).json({ success: false, error: 'Coupon not found.' }); }
    catch (err: any) { return res.status(500).json({ success: false, error: err.message }); }
  });

  app.post('/api/coupons/validate', requireClientHeader, async (req, res) => {
    try {
      const code = String(req.body?.code || '').trim().toUpperCase();
      const email = String(req.body?.email || '').trim().toLowerCase();
      const items = Array.isArray(req.body?.items) ? req.body.items : [];
      if (!code || !email) return res.status(400).json({ success: false, error: 'Coupon code and email are required.' });
      const coupon = await mongoFindCoupon(code);
      if (!coupon || coupon.active === false) return res.status(404).json({ success: false, error: 'Invalid or inactive coupon.' });
      if (String(coupon.expiresAt) < indiaTodayPlusDays(0)) return res.status(400).json({ success: false, error: 'This coupon has expired.' });
      if (coupon.firstOrderOnly && await mongoHasCustomerOrder(email)) return res.status(400).json({ success: false, error: 'This coupon is only valid on your first order.' });
      if (coupon.usageLimitPerCustomer) { const uses = await mongoCountCustomerCouponUses(code, email); if (uses === null) return res.status(503).json({ success: false, error: 'Database is unavailable.' }); if (uses >= Number(coupon.usageLimitPerCustomer)) return res.status(400).json({ success: false, error: 'You have reached the usage limit for this coupon.' }); }
      const discountAmount = calculateCouponDiscount(coupon, items);
      if (discountAmount <= 0) return res.status(400).json({ success: false, error: 'This coupon does not apply to the selected products.' });
      return res.json({ success: true, coupon, discountAmount });
    } catch (err: any) { return res.status(500).json({ success: false, error: err.message }); }
  });

  // Safe customer tracking. Guest users must provide an order number; logged-in customers may access their own orders.
  app.post('/api/orders/lookup', requireClientHeader, async (req, res) => {
    try {
      if (!allowLoginAttempt(`lookup:${String(req.ip || 'unknown')}`, 30)) return res.status(429).json({ success: false, error: 'Too many tracking requests. Please try again later.' });
      const query = String(req.body?.orderNumber || '').trim();
      if (!query) return res.status(400).json({ success: false, error: 'Order number is required.' });
      const auth = getCustomerAuth(req);
      const order = await mongoFindOrderForCustomer(query, auth?.role === 'customer' ? auth.email : undefined);
      if (!order) return res.status(404).json({ success: false, error: 'Order not found or access denied.' });
      return res.json({ success: true, order });
    } catch (err: any) { return res.status(500).json({ success: false, error: err.message }); }
  });

  // Authoritative order creation: server calculates product prices, fees and IDs.
  app.post('/api/orders', requireClientHeader, async (req, res) => {
    try {
      if (!allowLoginAttempt(`order:${String(req.ip || 'unknown')}`, 20)) return res.status(429).json({ success: false, error: 'Too many order attempts. Please try again later.' });
      const body = req.body || {};
      const rawItems = Array.isArray(body.items) ? body.items : [];
      if (!rawItems.length) return res.status(400).json({ success: false, error: 'Your cart is empty.' });
      const c = body.customer || {};
      const required = ['fullName', 'email', 'phone', 'deliveryAddress', 'city', 'pincode', 'deliveryDate'];
      for (const key of required) if (!String(c[key] || '').trim()) return res.status(400).json({ success: false, error: `Customer ${key} is required.` });
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(c.email).trim())) return res.status(400).json({ success: false, error: 'A valid customer email is required.' });
      if (!/^\d{6}$/.test(String(c.pincode).replace(/\s/g, ''))) return res.status(400).json({ success: false, error: 'A valid 6-digit pincode is required.' });
      if (String(c.deliveryDate) < indiaTodayPlusDays(7)) return res.status(400).json({ success: false, error: `Delivery date must be at least 7 days from today. Earliest available date is ${indiaTodayPlusDays(7)}.` });
      const settings = await mongoGetSettings();
      const deliveryThreshold = Number(settings?.freeDeliveryThreshold ?? 499);
      const configuredDeliveryFee = Number(settings?.deliveryFee ?? 50);
      const database = await getMongoDb();
      if (!database) return res.status(503).json({ success: false, error: 'Orders are temporarily unavailable. Please try again in a moment.' });
      const normalizedItems: any[] = [];
      for (const raw of rawItems) {
        const id = String(raw?.bouquet?.id || raw?.productId || '').trim();
        const quantity = Number(raw?.quantity);
        if (!id || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return res.status(400).json({ success: false, error: 'Invalid cart item or quantity.' });
        if (id.startsWith('custom-bouq-')) {
          normalizedItems.push({ bouquet: { ...(raw.bouquet || {}), id, price: 899 }, quantity });
          continue;
        }
        const product = await database.collection('bouquets').findOne({ id });
        if (!product) return res.status(400).json({ success: false, error: `A selected bouquet is no longer available.` });
        if (product.inStock === false) return res.status(409).json({ success: false, error: `${product.title || 'A selected bouquet'} is currently out of stock.` });
        normalizedItems.push({ bouquet: product, quantity });
      }
      const subtotal = normalizedItems.reduce((sum, item) => sum + Number(item.bouquet.price || 0) * item.quantity, 0);
      const deliveryFee = subtotal >= deliveryThreshold ? 0 : configuredDeliveryFee;
      const isCOD = body.payment?.method === 'COD';
      const codHandlingCharge = isCOD ? 7 : 0;
      let discountAmount = 0;
      const couponCode = String(body.couponCode || '').trim().toUpperCase();
      let couponDoc: any = null;
      if (couponCode) {
        couponDoc = await mongoFindCoupon(couponCode);
        if (!couponDoc || couponDoc.active === false || String(couponDoc.expiresAt) < indiaTodayPlusDays(0)) return res.status(400).json({ success: false, error: 'Coupon is invalid or expired.' });
        if (couponDoc.firstOrderOnly && await mongoHasCustomerOrder(String(c.email))) return res.status(400).json({ success: false, error: 'This coupon is only valid on your first order.' });
        if (couponDoc.usageLimitPerCustomer) { const uses = await mongoCountCustomerCouponUses(couponCode, String(c.email)); if (uses === null || uses >= Number(couponDoc.usageLimitPerCustomer)) return res.status(400).json({ success: false, error: 'Coupon usage limit reached for this customer.' }); }
        discountAmount = calculateCouponDiscount(couponDoc, normalizedItems);
        if (discountAmount <= 0) return res.status(400).json({ success: false, error: 'This coupon does not apply to the selected products.' });
      }
      const totalAmount = Math.max(0, subtotal + deliveryFee + codHandlingCharge - discountAmount);
      const now = new Date().toISOString();
      const id = `ord-${crypto.randomUUID()}`;
      const orderNumber = `JG-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
      const customerAuth = getCustomerAuth(req);
      const safeCustomer = {
        fullName: String(c.fullName).trim().slice(0, 120), email: String(c.email).trim().toLowerCase().slice(0, 254), phone: String(c.phone).trim().slice(0, 30),
        deliveryAddress: String(c.deliveryAddress).trim().slice(0, 500), city: String(c.city).trim().slice(0, 100), pincode: String(c.pincode).replace(/\s/g, ''),
        deliveryDate: String(c.deliveryDate).trim(), deliveryTimeSlot: String(c.deliveryTimeSlot || '').slice(0, 100), specialInstructions: String(c.specialInstructions || '').slice(0, 500), giftNote: String(c.giftNote || '').slice(0, 500),
      };
      const paymentMethod = isCOD ? 'COD' : 'ONLINE';
      const order = {
        id, orderNumber, createdAt: now, updatedAt: now, status: 'Order Placed', items: normalizedItems, subtotal, deliveryFee, codHandlingCharge, totalAmount,
        couponCode: couponCode || undefined, discountAmount,
        customer: safeCustomer,
        customerEmail: customerAuth?.role === 'customer' ? customerAuth.email : safeCustomer.email,
        payment: {
          method: paymentMethod,
          upiIdUsed: paymentMethod === 'ONLINE' ? String(settings?.upiId || '') : undefined,
          transactionRef: paymentMethod === 'ONLINE' ? String(body.payment?.transactionRef || '').replace(/\D/g, '').slice(0, 50) : 'Cash on Delivery (Pending)',
          paymentStatus: paymentMethod === 'COD' ? 'Pending on Delivery' : 'Awaiting Confirmation',
          paidAt: '',
        },
      };
      const saved = await mongoCreateOrder(order);
      if (!saved) return res.status(503).json({ success: false, error: 'Order could not be saved. Please try again.' });
      if (safeCustomer.email) {
        try {
          const rows = normalizedItems.map((item: any) => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${String(item.bouquet.title)}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₹${Number(item.bouquet.price) * item.quantity}</td></tr>`).join('');
          await sendEmailWithAgentMail({ to: safeCustomer.email, subject: `Jerry's Garden Order ${order.orderNumber} — Confirmed`, html: `<div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;color:#292524"><div style="padding:24px;background:#fff1f2;border-radius:16px"><h1 style="margin:0;color:#881337">Jerry's Garden</h1><p>Your order <strong>${order.orderNumber}</strong> has been received.</p></div><div style="padding:24px"><h2>Order details</h2><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:8px">Item</th><th style="padding:8px">Qty</th><th style="text-align:right;padding:8px">Amount</th></tr></thead><tbody>${rows}</tbody></table><p>Subtotal: ₹${subtotal}</p>${discountAmount > 0 ? `<p style="color:#047857">Coupon (${couponCode}): -₹${discountAmount}</p>` : ''}<p>Delivery: ${deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</p>${codHandlingCharge ? `<p>COD handling: ₹${codHandlingCharge}</p>` : ''}<h3>Total: ₹${totalAmount}</h3><p><strong>Delivery date:</strong> ${safeCustomer.deliveryDate}<br><strong>Time:</strong> ${safeCustomer.deliveryTimeSlot || 'Not specified'}<br><strong>Payment:</strong> ${paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online / UPI — Awaiting confirmation'}${paymentMethod === 'ONLINE' ? `<br><strong>UPI ID:</strong> ${String(settings?.upiId || '')}<br><strong>UTR:</strong> ${String(order.payment.transactionRef || 'Not provided')}` : ''}</p><p><strong>Delivery address:</strong> ${safeCustomer.deliveryAddress}, ${safeCustomer.city} - ${safeCustomer.pincode}</p></div></div>` });
        } catch (emailErr) { console.error("[Jerry's Garden] Order confirmation email failed:", emailErr); }
      }
      return res.status(201).json({ success: true, connected: true, order: saved });
    } catch (err: any) { console.error('Order creation error:', err); return res.status(500).json({ success: false, error: 'Could not place your order. Please try again.' }); }
  });

  app.patch('/api/orders/:id/status', requireOwner, requireClientHeader, async (req, res) => {
    try {
      const allowed = new Set(['Order Placed', 'Pending', 'Delivered', 'Cancelled']);
      const status = String(req.body?.status || '');
      if (!allowed.has(status)) return res.status(400).json({ success: false, error: 'Invalid order status.' });
      const updated = await mongoUpdateOrderStatus(req.params.id, status);
      if (!updated) return res.status(404).json({ success: false, error: 'Order not found.' });
      return res.json({ success: true, connected: true, order: updated });
    } catch (err: any) { return res.status(500).json({ success: false, error: err.message }); }
  });

  // 6. Settings Endpoints
  app.get('/api/settings', async (req, res) => {
    try {
      const settings = await mongoGetSettings();
      return res.json({ success: true, connected: settings !== null, settings });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/settings', requireOwner, requireClientHeader, async (req, res) => {
    try {
      const settings = req.body;
      const saved = await mongoUpdateSettings(settings);
      return res.json({ success: true, connected: saved !== null, settings: saved });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
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
