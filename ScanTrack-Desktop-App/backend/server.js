import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import QRCode from 'qrcode';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import Joi from 'joi';

import db from './db.js';
import { requireAuth, requireRole, auth } from './auth.js';
import { bootstrapAdmin } from './bootstrap.js';
import { scheduleBackups } from './backup.js';
import winston from 'winston';
import * as Sentry from '@sentry/node';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// ─── OBSERVABILITY & SECURITY ───────────────────────────────────────────────

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [new Sentry.Integrations.Http({ tracing: true }), new Sentry.Integrations.Express({ app })],
    tracesSampleRate: 1.0,
  });
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

app.use(helmet({
  contentSecurityPolicy: false, // Required if serving React app with inline scripts/styles
}));
app.use(cors());
app.use(express.json());
app.use(morgan('combined')); // Structured HTTP request logging

// ─── SWAGGER CONFIG ─────────────────────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'ScanTrack API', version: '2.0.0', description: 'API for ScanTrack v2.0' },
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./server.js'],
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Serve static frontend files
const frontendPath = path.join(__dirname, 'public');
app.use(express.static(frontendPath));

// ─── VALIDATION SCHEMAS (Joi) ───────────────────────────────────────────────
const productSchema = Joi.object({
  name: Joi.string().required(),
  sku: Joi.string().allow('', null),
  category: Joi.string().allow('', null),
  quantity: Joi.number().integer().min(0).default(0),
  unit: Joi.string().allow('', null),
  location: Joi.string().allow('', null),
  supplier: Joi.string().allow('', null),
  low_stock_threshold: Joi.number().integer().min(0).default(5),
  description: Joi.string().allow('', null),
  cost_price: Joi.number().min(0).default(0),
  sell_price: Joi.number().min(0).default(0)
});

const stockActionSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required(),
  notes: Joi.string().allow('', null),
  supplier: Joi.string().allow('', null),
  reason: Joi.string().allow('', null)
});

// ─── HELPERS ────────────────────────────────────────────────────────────────
const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const createNotification = (title, message, type = 'INFO') => {
  const insert = db.prepare('INSERT INTO notifications (id, title, message, type) VALUES (?, ?, ?, ?)');
  insert.run(generateId('NOTIF'), title, message, type);
};

const checkAndNotifyLowStock = (product) => {
  if (product.quantity <= product.low_stock_threshold && product.quantity >= 0) {
    createNotification(
      '⚠️ Low Stock Alert',
      `"${product.name}" (SKU: ${product.sku}) has only ${product.quantity} ${product.unit} remaining.`,
      'LOW_STOCK'
    );
  }
};

const logScan = (productId, action, details, uid) => {
  const insert = db.prepare('INSERT INTO scan_history (id, product_id, action, details, scanned_by) VALUES (?, ?, ?, ?, ?)');
  insert.run(generateId('SCAN'), productId, action, details, uid);
};

// ─── REAL-TIME EVENTS (SSE) ───────────────────────────────────────────────────
const clients = new Set();
const broadcast = (event, data) => {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) client.write(payload);
};

app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  clients.add(res);
  req.on('close', () => clients.delete(res));
});

// ─── HEALTH ─────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'ScanTrack API v2.0 (Production) is running' });
});

// ─── USERS (Admin Only) ──────────────────────────────────────────────────────
app.post('/api/users', requireAuth, requireRole('admin'), async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) return res.status(400).json({ error: 'Missing required fields' });
  if (role !== 'staff') return res.status(403).json({ error: 'Cannot create new admin users. Only staff can be created.' });

  try {
    const userRecord = await auth.createUser({ email, password });
    db.prepare('INSERT INTO users (uid, email, role) VALUES (?, ?, ?)').run(userRecord.uid, email, role);
    res.status(201).json({ success: true, uid: userRecord.uid, email, role });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/me', requireAuth, (req, res) => {
  res.json({ uid: req.user.uid, email: req.user.email, role: req.user.role });
});

app.get('/api/users', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const users = db.prepare('SELECT uid, email, role FROM users ORDER BY email ASC').all();
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ─── PRODUCTS (Staff & Admin) ────────────────────────────────────────────────

app.get('/api/products', requireAuth, requireRole('staff'), (req, res) => {
  try {
    const { search, category, status } = req.query;
    let queryStr = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (search) {
      queryStr += ' AND (name LIKE ? OR sku LIKE ? OR category LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (category) {
      queryStr += ' AND category = ?';
      params.push(category);
    }
    if (status) {
      queryStr += ' AND status = ?';
      params.push(status.toUpperCase());
    }
    queryStr += ' ORDER BY created_at DESC';

    const products = db.prepare(queryStr).all(params);
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/products/:id', requireAuth, requireRole('staff'), (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (product) res.json(product);
  else res.status(404).json({ error: 'Product not found' });
});

app.post('/api/products', requireAuth, requireRole('admin'), async (req, res) => {
  const { error, value } = productSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const productId = generateId('PRD');
  const qty = value.quantity;
  const threshold = value.low_stock_threshold;
  
  let status = 'IN_STOCK';
  if (qty === 0) status = 'OUT_OF_STOCK';
  else if (qty <= threshold) status = 'LOW_STOCK';

  const sku = value.sku || `SKU-${productId}`;
  const now = new Date().toISOString();

  try {
    const insert = db.prepare(`
      INSERT INTO products (id, name, sku, category, quantity, unit, location, supplier, low_stock_threshold, description, cost_price, sell_price, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insert.run(productId, value.name, sku, value.category || 'General', qty, value.unit || 'pcs', value.location, value.supplier, threshold, value.description, value.cost_price, value.sell_price, status, now, now);

    // Generate QR
    const qrDir = path.join(frontendPath, 'qrcodes');
    if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });
    await QRCode.toFile(path.join(qrDir, `${productId}.png`), JSON.stringify({ id: productId, name: value.name, sku }), { color: { dark: '#1e293b', light: '#ffffff' }, width: 400 });

    logScan(productId, 'PRODUCT_CREATED', `${value.name} added`, req.user.uid);
    const newProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    
    if (qty <= threshold && qty > 0) checkAndNotifyLowStock(newProduct);
    
    res.status(201).json(newProduct);
  } catch (err) {
    console.error(err);
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(400).json({ error: 'SKU must be unique' });
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// QR Scan route
app.post('/api/qr/scan', requireAuth, requireRole('staff'), (req, res) => {
  const { qr_data } = req.body;
  if (!qr_data) return res.status(400).json({ error: 'Missing qr_data' });

  try {
    let productId = qr_data;
    
    // Check if it's JSON (since we encode JSON into the QR code)
    try {
      const parsed = JSON.parse(qr_data);
      if (parsed.id) productId = parsed.id;
    } catch (_) {
      // Not JSON, assume the raw string is the ID or SKU
    }

    // Try finding by ID first
    let product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
    
    // Fallback to SKU
    if (!product) {
      product = db.prepare('SELECT id FROM products WHERE sku = ?').get(productId);
    }

    if (product) {
      res.json({ product_id: product.id });
    } else {
      res.status(404).json({ error: 'Product not found in database' });
    }
  } catch (err) {
    console.error('QR Scan error:', err);
    res.status(500).json({ error: 'Internal server error during QR scan' });
  }
});

// Update product
app.put('/api/products/:id', requireAuth, requireRole('admin'), (req, res) => {
  const { error, value } = productSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const productId = req.params.id;
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!existing) return res.status(404).json({ error: 'Product not found' });

  const threshold = value.low_stock_threshold !== undefined ? value.low_stock_threshold : existing.low_stock_threshold;
  const qty = value.quantity !== undefined ? value.quantity : existing.quantity;
  
  let status = 'IN_STOCK';
  if (qty === 0) status = 'OUT_OF_STOCK';
  else if (qty <= threshold) status = 'LOW_STOCK';

  try {
    const update = db.prepare(`
      UPDATE products SET 
        name=?, sku=?, category=?, quantity=?, unit=?, location=?, supplier=?, low_stock_threshold=?, description=?, cost_price=?, sell_price=?, status=?, updated_at=?
      WHERE id=?
    `);
    
    update.run(value.name, value.sku, value.category, qty, value.unit, value.location, value.supplier, threshold, value.description, value.cost_price, value.sell_price, status, new Date().toISOString(), productId);
    
    res.json(db.prepare('SELECT * FROM products WHERE id = ?').get(productId));
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(400).json({ error: 'SKU must be unique' });
    res.status(500).json({ error: 'Update failed' });
  }
});

// Delete product
app.delete('/api/products/:id', requireAuth, requireRole('admin'), (req, res) => {
  const productId = req.params.id;
  const info = db.prepare('DELETE FROM products WHERE id = ?').run(productId);
  if (info.changes === 0) return res.status(404).json({ error: 'Product not found' });
  
  const qrPath = path.join(frontendPath, 'qrcodes', `${productId}.png`);
  if (fs.existsSync(qrPath)) fs.unlinkSync(qrPath);
  
  res.json({ success: true, message: 'Deleted' });
});

// ─── STOCK IN/OUT (Concurrency handled by WAL and DB Transactions) ──────────

app.post('/api/products/:id/stock-in', requireAuth, requireRole('staff'), (req, res) => {
  const { error, value } = stockActionSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const productId = req.params.id;
  
  // Wrap in SQLite transaction
  const stockInTx = db.transaction((id, qty, notes, supplier, uid) => {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!product) throw new Error('NOT_FOUND');

    const newQty = product.quantity + qty;
    let newStatus = 'IN_STOCK';
    if (newQty === 0) newStatus = 'OUT_OF_STOCK';
    else if (newQty <= product.low_stock_threshold) newStatus = 'LOW_STOCK';

    db.prepare('UPDATE products SET quantity=?, status=?, updated_at=?, supplier=COALESCE(?, supplier) WHERE id=?').run(newQty, newStatus, new Date().toISOString(), supplier || null, id);

    const txnId = generateId('TXN');
    db.prepare('INSERT INTO transactions (id, product_id, product_name, sku, type, quantity, quantity_before, quantity_after, notes, performed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(txnId, id, product.name, product.sku, 'STOCK_IN', qty, product.quantity, newQty, notes || '', uid);

    logScan(id, 'STOCK_IN', `+${qty} units added`, uid);
    return { product, newQty };
  });

  try {
    const { product, newQty } = stockInTx(productId, value.quantity, value.notes, value.supplier, req.user.uid);
    createNotification('📦 Stock In', `${value.quantity} added to "${product.name}".`, 'STOCK_IN');
    broadcast('stockUpdate', { id: productId, quantity: newQty });
    res.json({ success: true, new_quantity: newQty });
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Product not found' });
    console.error(err);
    res.status(500).json({ error: 'Stock-in failed' });
  }
});

app.post('/api/products/:id/stock-out', requireAuth, requireRole('staff'), (req, res) => {
  const { error, value } = stockActionSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const productId = req.params.id;

  const stockOutTx = db.transaction((id, qty, notes, reason, uid) => {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!product) throw new Error('NOT_FOUND');
    if (product.quantity < qty) throw new Error('INSUFFICIENT');

    const newQty = product.quantity - qty;
    let newStatus = 'IN_STOCK';
    if (newQty === 0) newStatus = 'OUT_OF_STOCK';
    else if (newQty <= product.low_stock_threshold) newStatus = 'LOW_STOCK';

    db.prepare('UPDATE products SET quantity=?, status=?, updated_at=? WHERE id=?').run(newQty, newStatus, new Date().toISOString(), id);

    const txnId = generateId('TXN');
    db.prepare('INSERT INTO transactions (id, product_id, product_name, sku, type, quantity, quantity_before, quantity_after, reason, notes, performed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(txnId, id, product.name, product.sku, 'STOCK_OUT', qty, product.quantity, newQty, reason || '', notes || '', uid);

    logScan(id, 'STOCK_OUT', `-${qty} units removed`, uid);
    return { product, newQty, newStatus };
  });

  try {
    const { product, newQty, newStatus } = stockOutTx(productId, value.quantity, value.notes, value.reason, req.user.uid);
    checkAndNotifyLowStock({ ...product, quantity: newQty, status: newStatus });
    if (newQty === 0) createNotification('🚨 Out of Stock', `"${product.name}" is OUT OF STOCK.`, 'OUT_OF_STOCK');
    broadcast('stockUpdate', { id: productId, quantity: newQty });
    res.json({ success: true, new_quantity: newQty });
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Product not found' });
    if (err.message === 'INSUFFICIENT') return res.status(400).json({ error: 'Insufficient stock' });
    console.error(err);
    res.status(500).json({ error: 'Stock-out failed' });
  }
});

// ─── QR ROUTES ──────────────────────────────────────────────────────────────
app.get('/api/qr/:id', (req, res) => {
  const qrPath = path.join(frontendPath, 'qrcodes', `${req.params.id}.png`);
  if (fs.existsSync(qrPath)) res.sendFile(qrPath);
  else res.status(404).json({ error: 'QR not found' });
});

app.post('/api/qr/scan', requireAuth, requireRole('staff'), (req, res) => {
  const { qr_data } = req.body;
  if (!qr_data) return res.status(400).json({ error: 'QR data required' });

  let productId = qr_data;
  try { productId = JSON.parse(qr_data).id || qr_data; } catch (_) {}

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  logScan(productId, 'QR_SCAN', 'Product scanned via app', req.user.uid);
  res.json(product);
});

// ─── TRANSACTIONS & NOTIFICATIONS ───────────────────────────────────────────
app.get('/api/transactions', requireAuth, requireRole('staff'), (req, res) => {
  const { product_id, limit: lim } = req.query;
  const n = parseInt(lim) || 100;
  
  let txns;
  if (product_id) {
    txns = db.prepare('SELECT * FROM transactions WHERE product_id = ? ORDER BY timestamp DESC LIMIT ?').all(product_id, n);
  } else {
    txns = db.prepare('SELECT * FROM transactions ORDER BY timestamp DESC LIMIT ?').all(n);
  }
  res.json(txns);
});

app.get('/api/notifications', requireAuth, requireRole('staff'), (req, res) => {
  res.json(db.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50').all());
});

app.post('/api/notifications/mark-all-read', requireAuth, requireRole('staff'), (req, res) => {
  const info = db.prepare('UPDATE notifications SET isRead = 1 WHERE isRead = 0').run();
  res.json({ success: true, marked: info.changes });
});

app.delete('/api/notifications/:id', requireAuth, requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM notifications WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ─── REPORTS ─────────────────────────────────────────────────────────────────
app.get('/api/reports/summary', requireAuth, requireRole('staff'), (req, res) => {
  const totalProducts = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
  const inStock = db.prepare("SELECT COUNT(*) as c FROM products WHERE status='IN_STOCK'").get().c;
  const lowStock = db.prepare("SELECT COUNT(*) as c FROM products WHERE status='LOW_STOCK'").get().c;
  const outOfStock = db.prepare("SELECT COUNT(*) as c FROM products WHERE status='OUT_OF_STOCK'").get().c;
  const totalQuantity = db.prepare('SELECT SUM(quantity) as s FROM products').get().s || 0;

  const stockInQty = db.prepare("SELECT SUM(quantity) as s FROM transactions WHERE type='STOCK_IN'").get().s || 0;
  const stockOutQty = db.prepare("SELECT SUM(quantity) as s FROM transactions WHERE type='STOCK_OUT'").get().s || 0;

  const categoryBreakdown = db.prepare('SELECT category as name, COUNT(*) as count FROM products GROUP BY category').all();
  
  const statusBreakdown = [
    { name: 'In Stock', count: inStock },
    { name: 'Low Stock', count: lowStock },
    { name: 'Out of Stock', count: outOfStock },
  ];

  // Daily transactions (last 7 days)
  const txns = db.prepare(`SELECT type, quantity, date(timestamp) as date FROM transactions WHERE timestamp >= date('now', '-7 days')`).all();
  const dailyMap = {};
  txns.forEach(t => {
    if (!dailyMap[t.date]) dailyMap[t.date] = { date: t.date, stockIn: 0, stockOut: 0 };
    if (t.type === 'STOCK_IN') dailyMap[t.date].stockIn += t.quantity;
    if (t.type === 'STOCK_OUT') dailyMap[t.date].stockOut += t.quantity;
  });
  const dailyTransactions = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

  res.json({
    totalProducts, inStock, lowStock, outOfStock, totalQuantity,
    stockInQty, stockOutQty, pendingOrders: 0, approvedOrders: 0, totalOrders: 0,
    categoryBreakdown, statusBreakdown, dailyTransactions, topProducts: []
  });
});

// ─── SPA FALLBACK ────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API route not found' });
  const indexFile = path.join(frontendPath, 'index.html');
  if (fs.existsSync(indexFile)) res.sendFile(indexFile);
  else res.status(503).send('<h2>Frontend not built yet. Run build in web/</h2>');
});

// ─── ERROR HANDLING ────────────────────────────────────────────────────────────
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

app.use((err, req, res, next) => {
  logger.error(err.message, { stack: err.stack, url: req.originalUrl });
  res.status(500).json({ error: 'Internal Server Error' });
});

// ─── STARTUP ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  (async () => {
    await bootstrapAdmin();
    scheduleBackups();
    app.listen(PORT, () => {
      console.log('\n🚀 ═══════════════════════════════════════════════════════');
      console.log('   ScanTrack API Server v2.0 (Production / SQLite)');
      console.log(`   📡 Running on: http://localhost:${PORT}`);
      console.log(`   📚 API Docs: http://localhost:${PORT}/api-docs`);
      console.log('   ═══════════════════════════════════════════════════════\n');
    });
  })();
}

export default app;
