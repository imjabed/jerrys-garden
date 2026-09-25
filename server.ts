import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { v2 as cloudinary } from 'cloudinary';
import nodemailer from 'nodemailer';
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
  mongoCreateOrder,
  mongoUpdateOrderStatus,
  mongoGetSettings,
  mongoUpdateSettings,
} from './server/mongodb.js';

dotenv.config();

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

// Configure Nodemailer with SMTP credentials from environment variables only (no hardcoded credentials)
const SMTP_EMAIL = process.env.SMTP_EMAIL || '';
const SMTP_APP_PASSWORD = (process.env.SMTP_APP_PASSWORD || '').replace(/\s+/g, '');
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || "Jerry's Garden";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;
function getTransporter() {
  if (!SMTP_EMAIL || !SMTP_APP_PASSWORD) {
    throw new Error('SMTP email credentials are not configured. Please set SMTP_EMAIL and SMTP_APP_PASSWORD in your .env file.');
  }
  if (!transporter) {
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,

    family: 4,

    auth: {
      user: SMTP_EMAIL,
      pass: SMTP_APP_PASSWORD,
    },

    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
  });
    }
  return transporter;
}

// In-memory OTP storage (10-minute validity)
interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
}
const otpStore = new Map<string, OtpRecord>();

async function startServer() {

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Allow the Vercel frontend to call this Render backend.
  // Add FRONTEND_URL in Render Environment Variables.
  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

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
      'Content-Type, Authorization'
    );

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    next();
  });

  // Body parsing for base64 uploads (up to 30mb)
  app.use(express.json({ limit: '30mb' }));

  app.use(express.urlencoded({ extended: true, limit: '30mb' }));

  // API Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: "Jerry's Garden Bouquet API",
      cloudinary: {
        configured: Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET),
      },
    });
  });

  // Cloudinary Upload API endpoint
  app.post('/api/upload-image', async (req, res) => {
    try {
      if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        return res.status(500).json({
          success: false,
          error: 'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.',
        });
      }

      const { image, folder } = req.body;
      if (!image) {
        return res.status(400).json({ success: false, error: 'No image data provided' });
      }

      // Upload directly to Cloudinary using Cloudinary SDK
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: folder || 'jerrys_garden_bouquets',
        resource_type: 'auto',
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

  // OTP Email Verification Endpoints
  // 1. Send OTP to customer's email address
  app.post('/api/send-otp', async (req, res) => {
    try {
      if (!SMTP_EMAIL || !SMTP_APP_PASSWORD) {
        return res.status(500).json({
          success: false,
          error: 'Email verification service is not configured. Please set SMTP_EMAIL and SMTP_APP_PASSWORD in your .env file.',
        });
      }

      const { email, name } = req.body;
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ success: false, error: 'A valid email address is required.' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      
      // Generate 6-digit verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

      otpStore.set(normalizedEmail, {
        code,
        expiresAt,
        attempts: 0,
      });

      const recipientName = name ? String(name).trim() : 'Valued Customer';
      const mailer = getTransporter();

      // Send email using JericasGarden credentials via Gmail SMTP
      await mailer.sendMail({
        from: `"${SMTP_FROM_NAME}" <${SMTP_EMAIL}>`,
        to: normalizedEmail,
        subject: `${code} is your ${SMTP_FROM_NAME} Verification Code`,
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
      return res.json({
        success: true,
        message: 'Email verified successfully!',
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
  // MongoDB Atlas Database Endpoints
  // ==========================================

  // 1. Connection status & diagnostics
  app.get('/api/mongodb/status', async (req, res) => {
    try {
      const status = await getMongoStatus();
      return res.json(status);
    } catch (err: any) {
      return res.status(500).json({
        configured: false,
        connected: false,
        error: err.message,
      });
    }
  });

  // 2. Build Collections & Schema (customers, Customerinfo, products, bouquets, orders, settings)
  app.post('/api/mongodb/build-collections', async (req, res) => {
    try {
      const { customers, bouquets, orders, settings } = req.body || {};
      const results = await buildCollections({
        customers,
        bouquets,
        orders,
        settings,
      });
      return res.json({
        success: true,
        message: 'Collections (customers, Customerinfo, products, bouquets, orders, settings) built successfully.',
        results,
      });
    } catch (err: any) {
      console.error('Failed to build MongoDB collections:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to build collections',
      });
    }
  });

  // Dedicated endpoint: Build collections for Customers and Products
  app.post('/api/mongodb/build-customers-products', async (req, res) => {
    try {
      const { customers, products, bouquets } = req.body || {};
      const results = await buildCollectionsForCustomersAndProducts({
        customers,
        products,
        bouquets,
      });
      return res.json({
        success: true,
        message: 'Collections for customers and products successfully built and verified in MongoDB Atlas.',
        results,
      });
    } catch (err: any) {
      console.error('Failed to build customers and products collections:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to build customers and products collections',
      });
    }
  });

  // 3. Update MongoDB URI dynamically from Dashboard
  app.post('/api/mongodb/config', async (req, res) => {
    try {
      const { uri, database } = req.body || {};
      if (uri) {
        setCustomMongoUri(uri, database);
      }
      const status = await getMongoStatus();
      return res.json({
        success: true,
        message: 'MongoDB configuration updated.',
        status,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to update MongoDB config',
      });
    }
  });

  // 4. Seed / Sync Data (Customers, Bouquets, Orders, Settings)
  app.post('/api/mongodb/seed', async (req, res) => {
    try {
      const { customers, bouquets, orders, settings } = req.body;
      const results = await seedMongoCollections({
        customers,
        bouquets,
        orders,
        settings,
      });
      return res.json({
        success: true,
        message: 'Data successfully synchronized with MongoDB Atlas.',
        results,
      });
    } catch (err: any) {
      console.error('Failed to sync data with MongoDB Atlas:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to sync with MongoDB Atlas',
      });
    }
  });

  // 3. Customers Endpoints
  app.get('/api/customers', async (req, res) => {
    try {
      const customers = await mongoGetCustomers();
      if (customers === null) {
        return res.json({ success: false, connected: false, customers: [] });
      }
      return res.json({ success: true, connected: true, customers });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/customers/register', async (req, res) => {
    try {
      const { name, email, phone, address, password, isVerified, id } = req.body;
      if (!name || !email) {
        return res.status(400).json({ success: false, error: 'Name and email are required.' });
      }

      const saved = await mongoSaveCustomer({
        id,
        name,
        email,
        phone,
        address,
        password,
        isVerified: isVerified !== undefined ? isVerified : true,
      });

      if (!saved) {
        return res.json({
          success: true,
          connected: false,
          message: 'Saved in client session (MongoDB Atlas not configured or offline).',
          user: { id: id || `usr-${Date.now()}`, name, email, phone, address, isVerified: true },
        });
      }

      return res.json({ success: true, connected: true, user: saved });
    } catch (err: any) {
      console.error('Customer registration error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/customers/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: 'Email is required.' });
      }

      const verification = await mongoVerifyCustomerLogin(email, password);
      if (verification === null) {
        // MongoDB not connected - notify frontend to verify against client storage
        return res.json({
          success: false,
          connected: false,
          fallbackToClient: true,
        });
      }

      if (!verification.success) {
        return res.status(401).json({
          success: false,
          connected: true,
          error: verification.reason === 'NOT_FOUND' ? 'No account found with this email.' : 'Incorrect password.',
        });
      }

      return res.json({
        success: true,
        connected: true,
        user: verification.user,
      });
    } catch (err: any) {
      console.error('Customer login error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Bouquets Endpoints
  app.get('/api/bouquets', async (req, res) => {
    try {
      const bouquets = await mongoGetBouquets();
      if (bouquets === null) {
        return res.json({ success: false, connected: false, bouquets: [] });
      }
      return res.json({ success: true, connected: true, bouquets });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/bouquets', async (req, res) => {
    try {
      const bouquet = req.body;
      if (!bouquet || !bouquet.id || !bouquet.title) {
        return res.status(400).json({ success: false, error: 'Valid bouquet data is required.' });
      }

      const saved = await mongoSaveBouquet(bouquet);
      return res.json({ success: true, connected: saved !== null, bouquet: saved || bouquet });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/bouquets/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await mongoDeleteBouquet(id);
      return res.json({ success: true, connected: deleted !== null, deleted });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Orders Endpoints
  app.get('/api/orders', async (req, res) => {
    try {
      const orders = await mongoGetOrders();
      if (orders === null) {
        return res.json({ success: false, connected: false, orders: [] });
      }
      return res.json({ success: true, connected: true, orders });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/orders', async (req, res) => {
    try {
      const order = req.body;
      if (!order || !order.id || !order.customer) {
        return res.status(400).json({ success: false, error: 'Valid order data is required.' });
      }

      const saved = await mongoCreateOrder(order);
      return res.json({ success: true, connected: saved !== null, order: saved || order });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.patch('/api/orders/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ success: false, error: 'Order status is required.' });
      }

      const updated = await mongoUpdateOrderStatus(id, status);
      return res.json({ success: true, connected: updated !== null, order: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
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

  app.post('/api/settings', async (req, res) => {
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
    // Automatically build & verify collections for customers and products in MongoDB Atlas
    buildCollectionsForCustomersAndProducts()
      .then((res) => {
        console.log(`[MongoDB Atlas] Auto-initialized: ${res.message} (customers: ${res.counts.customers}, products: ${res.counts.products})`);
      })
      .catch((err) => {
        console.warn(`[MongoDB Atlas] Note on initial collection build:`, err.message);
      });
  });
}

startServer();
