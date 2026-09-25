import 'dotenv/config';
import { MongoClient, Db } from 'mongodb';
import crypto from 'crypto';

// User's provided MongoDB Atlas Cluster URL & Database from environment variable
export const DEFAULT_MONGODB_URI = process.env.MONGODB_URI || '';
export const DEFAULT_DB_NAME = process.env.MONGODB_DB_NAME || 'jerrysgarden';

let activeUri = DEFAULT_MONGODB_URI;
let activeDbName = DEFAULT_DB_NAME;

let client: MongoClient | null = null;
let db: Db | null = null;
let isConnecting = false;
let lastConnectionError: string | null = null;

function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, expected] = String(stored || '').split(':');
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(actual, 'hex');
  const b = Buffer.from(expected, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function sanitizeCustomer(doc: any) {
  if (!doc) return doc;
  const { password, passwordHash, _id, ...safe } = doc;
  return safe;
}


export function setCustomMongoUri(uri: string, dbName?: string) {
  if (uri && uri.trim()) {
    activeUri = uri.trim();
    if (dbName && dbName.trim()) {
      activeDbName = dbName.trim();
    }
    // Disconnect existing client so next call reconnects with new URI
    if (client) {
      try {
        client.close();
      } catch {
        // ignore
      }
      client = null;
      db = null;
    }
  }
}

export function getActiveMongoConfig() {
  const currentUri = activeUri || process.env.MONGODB_URI || '';
  // Mask connection string completely to protect cluster host and credentials from frontend exposure
  const isConfigured = Boolean(currentUri);
  return {
    uri: isConfigured ? 'mongodb+srv://[secured-cluster-configured]' : 'Not configured (Set MONGODB_URI in .env)',
    database: activeDbName,
  };
}

/**
 * Connect to MongoDB Atlas
 */
export async function getMongoDb(): Promise<Db | null> {
  const uri = activeUri;
  if (!uri) {
    return null;
  }

  if (db && client) {
    return db;
  }

  if (isConnecting) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (db) return db;
  }

  isConnecting = true;
  try {
    const mongoClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 8000,
    });

    await mongoClient.connect();
    client = mongoClient;
    db = client.db(activeDbName);
    lastConnectionError = null;

    console.log(`[MongoDB Atlas] Successfully connected to database: "${db.databaseName}"`);

    // Ensure collections and indexes
    try {
      await db.collection('customers').createIndex({ email: 1 }, { unique: true });
      await db.collection('Customerinfo').createIndex({ email: 1 });
      await db.collection('products').createIndex({ id: 1 }, { unique: true });
      await db.collection('bouquets').createIndex({ id: 1 }, { unique: true });
      await db.collection('orders').createIndex({ id: 1 }, { unique: true });
      try { await db.collection('orders').dropIndex('orderNumber_1'); } catch { /* index may not exist */ }
      await db.collection('orders').createIndex({ orderNumber: 1 }, { unique: true });
      await db.collection('coupons').createIndex({ code: 1 }, { unique: true });
    } catch (idxErr) {
      console.warn('[MongoDB Atlas] Index note:', idxErr);
    }

    return db;
  } catch (error: any) {
    const rawError = error.message || 'Failed to connect to MongoDB Atlas';
    
    // Check if error is Atlas Network Access IP Whitelist firewall block (SSL Alert 80)
    if (
      rawError.includes('SSL alert number 80') ||
      rawError.includes('tlsv1 alert internal error') ||
      rawError.includes('MongoServerSelectionError')
    ) {
      lastConnectionError =
        'IP Access Denied by Atlas Firewall: Your MongoDB Atlas cluster requires whitelisting incoming IPs. In MongoDB Atlas -> Network Access -> Add IP Address -> Select "Allow Access from Anywhere" (0.0.0.0/0).';
    } else {
      lastConnectionError = rawError;
    }

    console.error('[MongoDB Atlas] Connection Error:', lastConnectionError);
    client = null;
    db = null;
    return null;
  } finally {
    isConnecting = false;
  }
}

/**
 * Check MongoDB Atlas status & collection metrics
 */
export async function getMongoStatus() {
  const database = await getMongoDb();
  if (!database) {
    return {
      configured: true,
      connected: false,
      database: activeDbName,
      activeConfig: getActiveMongoConfig(),
      message: lastConnectionError?.includes('IP Access Denied')
        ? 'MongoDB Atlas is configured, but access was denied by your cluster IP whitelist. Please add 0.0.0.0/0 in MongoDB Atlas Network Access.'
        : 'Configured, but connection to MongoDB Atlas failed.',
      error: lastConnectionError,
      ipWhitelistRequired: lastConnectionError?.includes('IP Access Denied'),
      counts: {
        customers: 0,
        Customerinfo: 0,
        products: 0,
        bouquets: 0,
        orders: 0,
      },
    };
  }

  try {
    const [customersCount, customerInfoCount, productsCount, bouquetsCount, ordersCount] = await Promise.all([
      database.collection('customers').countDocuments().catch(() => 0),
      database.collection('Customerinfo').countDocuments().catch(() => 0),
      database.collection('products').countDocuments().catch(() => 0),
      database.collection('bouquets').countDocuments().catch(() => 0),
      database.collection('orders').countDocuments().catch(() => 0),
    ]);

    const existingCollections = await database.listCollections().toArray();

    return {
      configured: true,
      connected: true,
      database: database.databaseName,
      activeConfig: getActiveMongoConfig(),
      message: 'Connected to MongoDB Atlas cluster.',
      error: null,
      existingCollections: existingCollections.map((c) => c.name),
      counts: {
        customers: customersCount,
        Customerinfo: customerInfoCount,
        products: productsCount,
        bouquets: bouquetsCount,
        orders: ordersCount,
      },
    };
  } catch (err: any) {
    return {
      configured: true,
      connected: false,
      database: database.databaseName,
      activeConfig: getActiveMongoConfig(),
      message: 'Error querying collections.',
      error: err.message,
      counts: { customers: 0, Customerinfo: 0, products: 0, bouquets: 0, orders: 0 },
    };
  }
}

/**
 * Build & initialize Collections for Customers and Products / Bouquets, Orders & Settings
 */
export async function buildCollections(initialSeedData?: {
  customers?: any[];
  bouquets?: any[];
  orders?: any[];
  settings?: any;
}) {
  const database = await getMongoDb();
  if (!database) {
    throw new Error(lastConnectionError || 'MongoDB Atlas not connected');
  }

  const existing = await database.listCollections().toArray();
  const existingNames = new Set(existing.map((c) => c.name));

  const targetCollections = ['customers', 'Customerinfo', 'products', 'bouquets', 'orders', 'settings'];
  const created: string[] = [];

  for (const colName of targetCollections) {
    if (!existingNames.has(colName)) {
      try {
        await database.createCollection(colName);
        created.push(colName);
        console.log(`[MongoDB Atlas] Created collection: "${colName}"`);
      } catch (err: any) {
        console.warn(`[MongoDB Atlas] Note creating ${colName}:`, err.message);
      }
    }
  }

  // Create indexes
  try {
    await database.collection('customers').createIndex({ email: 1 }, { unique: true });
    await database.collection('Customerinfo').createIndex({ email: 1 });
    await database.collection('products').createIndex({ id: 1 }, { unique: true });
    await database.collection('bouquets').createIndex({ id: 1 }, { unique: true });
    await database.collection('orders').createIndex({ id: 1 }, { unique: true });
    try { await database.collection('orders').dropIndex('orderNumber_1'); } catch { /* index may not exist */ }
    await database.collection('orders').createIndex({ orderNumber: 1 }, { unique: true });
  } catch (idxErr) {
    console.warn('[MongoDB Atlas] Index setup note:', idxErr);
  }

  // Seed Data if provided
  const results: Record<string, any> = {
    collectionsCreated: created,
  };

  if (initialSeedData?.customers && initialSeedData.customers.length > 0) {
    for (const c of initialSeedData.customers) {
      const { password, passwordHash, ...rest } = c;
      const doc: any = { ...rest, email: c.email.toLowerCase().trim(), updatedAt: new Date().toISOString() };
      if (passwordHash) doc.passwordHash = passwordHash;
      else if (password) doc.passwordHash = hashPassword(password);
      await database.collection('customers').updateOne({ email: doc.email }, { $set: doc, $unset: { password: '' } }, { upsert: true });
      await database.collection('Customerinfo').updateOne({ email: doc.email }, { $set: doc, $unset: { password: '' } }, { upsert: true });
    }
  }

  if (initialSeedData?.bouquets && initialSeedData.bouquets.length > 0) {
    for (const b of initialSeedData.bouquets) {
      const doc = { ...b, updatedAt: new Date().toISOString() };
      await database.collection('bouquets').updateOne({ id: b.id }, { $set: doc }, { upsert: true });
      await database.collection('products').updateOne({ id: b.id }, { $set: doc }, { upsert: true });
    }
  }

  if (initialSeedData?.orders && initialSeedData.orders.length > 0) {
    for (const o of initialSeedData.orders) {
      const doc = { ...o, updatedAt: new Date().toISOString() };
      await database.collection('orders').updateOne({ id: o.id }, { $set: doc }, { upsert: true });
    }
  }

  if (initialSeedData?.settings) {
    await database
      .collection('settings')
      .updateOne(
        { key: 'store_settings' },
        { $set: { key: 'store_settings', data: initialSeedData.settings, updatedAt: new Date().toISOString() } },
        { upsert: true }
      );
  }

  const [cCount, ciCount, pCount, bCount, oCount] = await Promise.all([
    database.collection('customers').countDocuments().catch(() => 0),
    database.collection('Customerinfo').countDocuments().catch(() => 0),
    database.collection('products').countDocuments().catch(() => 0),
    database.collection('bouquets').countDocuments().catch(() => 0),
    database.collection('orders').countDocuments().catch(() => 0),
  ]);

  results.counts = {
    customers: cCount,
    Customerinfo: ciCount,
    products: pCount,
    bouquets: bCount,
    orders: oCount,
  };

  return results;
}

/**
 * Extra dedicated code requested by user:
 * Build collections for Customers and Products with indexes, schemas, and initial records
 */
export async function buildCollectionsForCustomersAndProducts(customSeed?: {
  customers?: any[];
  products?: any[];
  bouquets?: any[];
}) {
  const database = await getMongoDb();
  if (!database) {
    throw new Error(lastConnectionError || 'MongoDB Atlas not connected');
  }

  console.log(`[MongoDB Atlas] Building dedicated collections for customers and products on: ${database.databaseName}...`);

  // 1. Ensure 'customers', 'products', 'Customerinfo', 'bouquets', 'orders', 'settings' exist
  const existing = await database.listCollections().toArray();
  const existingNames = new Set(existing.map((c) => c.name));
  const createdCollections: string[] = [];

  const requiredCollections = ['customers', 'products', 'Customerinfo', 'bouquets', 'orders', 'settings'];
  for (const name of requiredCollections) {
    if (!existingNames.has(name)) {
      try {
        await database.createCollection(name);
        createdCollections.push(name);
        console.log(`[MongoDB Atlas] Created collection: "${name}"`);
      } catch (err: any) {
        console.warn(`[MongoDB Atlas] Note creating collection "${name}":`, err.message);
      }
    }
  }

  // 2. Build indexes for fast lookups & unique constraints
  try {
    await database.collection('customers').createIndex({ email: 1 }, { unique: true });
    await database.collection('customers').createIndex({ id: 1 });
    await database.collection('Customerinfo').createIndex({ email: 1 });
    await database.collection('products').createIndex({ id: 1 }, { unique: true });
    await database.collection('bouquets').createIndex({ id: 1 }, { unique: true });
    await database.collection('orders').createIndex({ id: 1 }, { unique: true });
    try { await database.collection('orders').dropIndex('orderNumber_1'); } catch { /* index may not exist */ }
    await database.collection('orders').createIndex({ orderNumber: 1 }, { unique: true });
  } catch (idxErr: any) {
    console.warn('[MongoDB Atlas] Index setup notice:', idxErr.message);
  }

  // 3. Seed customers if custom seed provided or if collection is empty
  const customersCount = await database.collection('customers').countDocuments();
  if (customSeed?.customers && customSeed.customers.length > 0) {
    for (const c of customSeed.customers) {
      const email = c.email?.toLowerCase().trim();
      if (email) {
        const { password, passwordHash, ...rest } = c;
        const doc: any = { ...rest, email, updatedAt: new Date().toISOString() };
        if (passwordHash) doc.passwordHash = passwordHash;
        else if (password) doc.passwordHash = hashPassword(password);
        await database.collection('customers').updateOne({ email }, { $set: doc, $unset: { password: '' } }, { upsert: true });
        await database.collection('Customerinfo').updateOne({ email }, { $set: doc, $unset: { password: '' } }, { upsert: true });
      }
    }
  }

  // 4. Seed products if custom seed provided or if collection is empty
  const productsCount = await database.collection('products').countDocuments();
  const seedProducts = customSeed?.products || customSeed?.bouquets;
  if (seedProducts && seedProducts.length > 0) {
    for (const p of seedProducts) {
      const doc = { ...p, updatedAt: new Date().toISOString() };
      await database.collection('products').updateOne({ id: p.id }, { $set: doc }, { upsert: true });
      await database.collection('bouquets').updateOne({ id: p.id }, { $set: doc }, { upsert: true });
    }
  } else if (productsCount === 0) {
    // Check if bouquets collection has items to mirror into products
    const existingBouquets = await database.collection('bouquets').find({}).toArray();
    if (existingBouquets.length > 0) {
      for (const b of existingBouquets) {
        const { _id, ...cleanDoc } = b;
        await database.collection('products').updateOne({ id: b.id }, { $set: cleanDoc }, { upsert: true });
      }
      console.log(`[MongoDB Atlas] Mirrored ${existingBouquets.length} bouquets into products collection`);
    }
  }

  const [finalCustomersCount, finalProductsCount, finalBouquetsCount, finalOrdersCount] = await Promise.all([
    database.collection('customers').countDocuments(),
    database.collection('products').countDocuments(),
    database.collection('bouquets').countDocuments(),
    database.collection('orders').countDocuments(),
  ]);

  const allCols = await database.listCollections().toArray();

  return {
    success: true,
    message: `Collections for customers and products verified & built successfully in MongoDB Atlas database "${database.databaseName}".`,
    database: database.databaseName,
    createdCollections,
    allCollections: allCols.map((c) => c.name),
    counts: {
      customers: finalCustomersCount,
      products: finalProductsCount,
      bouquets: finalBouquetsCount,
      orders: finalOrdersCount,
    },
  };
}

/**
 * Seed data into MongoDB Atlas
 */
export async function seedMongoCollections(initialData: {
  customers?: any[];
  bouquets?: any[];
  orders?: any[];
  settings?: any;
}) {
  return await buildCollections(initialData);
}

// ---------------- CUSTOMERS ----------------

export async function mongoGetCustomers() {
  const database = await getMongoDb();
  if (!database) return null;

  let docs = await database
    .collection('customers')
    .find({}, { projection: { password: 0, passwordHash: 0 } })
    .sort({ createdAt: -1 })
    .toArray();

  if (!docs || docs.length === 0) {
    // Check Customerinfo collection as fallback
    docs = await database
      .collection('Customerinfo')
      .find({}, { projection: { password: 0, passwordHash: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
  }

  return docs;
}

export async function mongoFindCustomerByEmail(email: string) {
  const database = await getMongoDb();
  if (!database) return null;

  const normalized = email.toLowerCase().trim();
  let user = await database.collection('customers').findOne({ email: normalized });
  if (!user) {
    user = await database.collection('Customerinfo').findOne({ email: normalized });
  }
  return sanitizeCustomer(user);
}

export async function mongoSaveCustomer(customerData: {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  password?: string;
  isVerified?: boolean;
}) {
  const database = await getMongoDb();
  if (!database) return null;
  const normalizedEmail = customerData.email.toLowerCase().trim();
  const now = new Date().toISOString();
  const existing =
    (await database.collection('customers').findOne({ email: normalizedEmail })) ||
    (await database.collection('Customerinfo').findOne({ email: normalizedEmail }));
  const passwordHash = customerData.password ? hashPassword(customerData.password) : undefined;

  if (existing) {
    const updateDoc: any = {
      name: customerData.name.trim(),
      phone: customerData.phone ?? existing.phone ?? '',
      address: customerData.address ?? existing.address ?? '',
      isVerified: customerData.isVerified ?? existing.isVerified ?? true,
      updatedAt: now,
    };
    if (passwordHash) updateDoc.passwordHash = passwordHash;
    // Remove legacy plaintext password whenever possible.
    await Promise.all([
      database.collection('customers').updateOne({ email: normalizedEmail }, { $set: updateDoc, $unset: { password: '' } }),
      database.collection('Customerinfo').updateOne({ email: normalizedEmail }, { $set: updateDoc, $unset: { password: '' } }),
    ]);
    const updated = await database.collection('customers').findOne({ email: normalizedEmail });
    return sanitizeCustomer(updated);
  }

  const newCustomer: any = {
    id: customerData.id || `usr-${crypto.randomUUID()}`,
    name: customerData.name.trim(), email: normalizedEmail,
    phone: customerData.phone || '', address: customerData.address || '',
    passwordHash: passwordHash || '', isVerified: customerData.isVerified ?? true,
    createdAt: now, updatedAt: now,
  };
  await Promise.all([
    database.collection('customers').insertOne({ ...newCustomer }),
    database.collection('Customerinfo').insertOne({ ...newCustomer }),
  ]);
  return sanitizeCustomer(newCustomer);
}

export async function mongoVerifyCustomerLogin(email: string, password: string) {
  const database = await getMongoDb();
  if (!database) return null;
  const normalizedEmail = email.toLowerCase().trim();
  let user: any = await database.collection('customers').findOne({ email: normalizedEmail });
  if (!user) user = await database.collection('Customerinfo').findOne({ email: normalizedEmail });
  if (!user) return { success: false, reason: 'NOT_FOUND' };

  let valid = Boolean(user.passwordHash && verifyPassword(password, user.passwordHash));
  // One-time migration for old plaintext records created by the previous version.
  if (!valid && user.password && user.password === password) {
    const passwordHash = hashPassword(password);
    await Promise.all([
      database.collection('customers').updateOne({ email: normalizedEmail }, { $set: { passwordHash }, $unset: { password: '' } }),
      database.collection('Customerinfo').updateOne({ email: normalizedEmail }, { $set: { passwordHash }, $unset: { password: '' } }),
    ]);
    valid = true;
  }
  if (!valid) return { success: false, reason: 'INVALID_PASSWORD' };
  return { success: true, user: sanitizeCustomer(user) };
}

// ---------------- PRODUCTS & BOUQUETS ----------------

export async function mongoGetBouquets() {
  const database = await getMongoDb();
  if (!database) return null;

  let docs = await database.collection('bouquets').find({}).sort({ createdAt: -1 }).toArray();
  if (!docs || docs.length === 0) {
    docs = await database.collection('products').find({}).sort({ createdAt: -1 }).toArray();
  }
  return docs;
}

export async function mongoSaveBouquet(bouquet: any) {
  const database = await getMongoDb();
  if (!database) return null;

  const now = new Date().toISOString();
  const doc = { ...bouquet, updatedAt: now };

  // Save to both collections (bouquets and products)
  await Promise.all([
    database.collection('bouquets').updateOne({ id: bouquet.id }, { $set: doc }, { upsert: true }),
    database.collection('products').updateOne({ id: bouquet.id }, { $set: doc }, { upsert: true }),
  ]);

  return await database.collection('bouquets').findOne({ id: bouquet.id });
}

export async function mongoDeleteBouquet(id: string) {
  const database = await getMongoDb();
  if (!database) return null;

  const [res1, res2] = await Promise.all([
    database.collection('bouquets').deleteOne({ id }),
    database.collection('products').deleteOne({ id }),
  ]);

  return (res1.deletedCount || 0) > 0 || (res2.deletedCount || 0) > 0;
}

// ---------------- ORDERS ----------------

export async function mongoGetOrders() {
  const database = await getMongoDb();
  if (!database) return null;

  return await database.collection('orders').find({}).sort({ createdAt: -1 }).toArray();
}

export async function mongoGetOrdersForCustomer(email: string) {
  const database = await getMongoDb();
  if (!database) return null;
  return await database.collection('orders').find({ customerEmail: String(email).trim().toLowerCase() }).sort({ createdAt: -1 }).toArray();
}

export async function mongoFindOrderForCustomer(orderNumber: string, customerEmail?: string) {
  const database = await getMongoDb();
  if (!database) return null;
  const filter: any = { orderNumber: orderNumber.toUpperCase() };
  if (customerEmail) filter.customerEmail = customerEmail.toLowerCase();
  const order = await database.collection('orders').findOne(filter);
  if (!order) return null;
  // Guest tracking is intentionally limited to order number; it does not expose the whole order unless the exact order number is known.
  return order;
}

export async function mongoCreateOrder(order: any) {
  const database = await getMongoDb();
  if (!database) return null;

  const now = new Date().toISOString();
  const newOrder = {
    ...order,
    updatedAt: now,
  };

  await database.collection('orders').updateOne({ id: order.id }, { $set: newOrder }, { upsert: true });

  return newOrder;
}

export async function mongoUpdateOrderStatus(orderId: string, status: string) {
  const database = await getMongoDb();
  if (!database) return null;

  const now = new Date().toISOString();
  await database.collection('orders').updateOne({ id: orderId }, { $set: { status, updatedAt: now } });

  return await database.collection('orders').findOne({ id: orderId });
}

// ---------------- STORE SETTINGS ----------------

export async function mongoGetSettings() {
  const database = await getMongoDb();
  if (!database) return null;

  const doc = await database.collection('settings').findOne({ key: 'store_settings' });
  return doc ? doc.data : null;
}

export async function mongoUpdateSettings(settings: any) {
  const database = await getMongoDb();
  if (!database) return null;

  const now = new Date().toISOString();
  await database.collection('settings').updateOne(
    { key: 'store_settings' },
    { $set: { key: 'store_settings', data: settings, updatedAt: now } },
    { upsert: true }
  );

  return settings;
}


export async function mongoGetCoupons() {
  const database = await getMongoDb();
  if (!database) return null;
  return await database.collection('coupons').find({}).sort({ createdAt: -1 }).toArray();
}

export async function mongoSaveCoupon(coupon: any) {
  const database = await getMongoDb();
  if (!database) return null;
  const now = new Date().toISOString();
  const doc: any = { ...coupon, code: String(coupon.code).trim().toUpperCase(), updatedAt: now, createdAt: coupon.createdAt || now };
  const update: any = { $set: doc };
  // MongoDB driver v7 rejects undefined BSON values by default. Also remove an
  // old usage limit when an owner edits a coupon and clears the field.
  if (doc.usageLimitPerCustomer === undefined) {
    delete doc.usageLimitPerCustomer;
    update.$set = doc;
    update.$unset = { usageLimitPerCustomer: '' };
  }
  await database.collection('coupons').updateOne({ id: doc.id }, update, { upsert: true });
  return await database.collection('coupons').findOne({ id: doc.id });
}

export async function mongoDeleteCoupon(id: string) {
  const database = await getMongoDb();
  if (!database) return false;
  const result = await database.collection('coupons').deleteOne({ id });
  return result.deletedCount > 0;
}

export async function mongoFindCoupon(code: string) {
  const database = await getMongoDb();
  if (!database) return null;
  return await database.collection('coupons').findOne({ code: String(code).trim().toUpperCase() });
}

export async function mongoCountCustomerCouponUses(code: string, email: string) {
  const database = await getMongoDb();
  if (!database) return null;
  return await database.collection('orders').countDocuments({ couponCode: String(code).trim().toUpperCase(), customerEmail: String(email).trim().toLowerCase(), status: { $ne: 'Cancelled' } });
}

export async function mongoHasCustomerOrder(email: string) {
  const database = await getMongoDb();
  if (!database) return null;
  return (await database.collection('orders').countDocuments({ customerEmail: String(email).trim().toLowerCase(), status: { $ne: 'Cancelled' } }, { limit: 1 })) > 0;
}
