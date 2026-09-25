import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'scantrack.db'));

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    uid TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'staff')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    category TEXT,
    quantity INTEGER DEFAULT 0,
    unit TEXT DEFAULT 'pcs',
    location TEXT,
    supplier TEXT,
    low_stock_threshold INTEGER DEFAULT 5,
    description TEXT,
    cost_price REAL DEFAULT 0,
    sell_price REAL DEFAULT 0,
    status TEXT,
    created_at DATETIME,
    updated_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    product_id TEXT,
    product_name TEXT,
    sku TEXT,
    type TEXT CHECK(type IN ('STOCK_IN', 'STOCK_OUT')),
    quantity INTEGER,
    quantity_before INTEGER,
    quantity_after INTEGER,
    reason TEXT,
    notes TEXT,
    performed_by TEXT, -- Firebase UID
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(product_id) REFERENCES products(id),
    FOREIGN KEY(performed_by) REFERENCES users(uid)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT,
    items TEXT, -- JSON string
    notes TEXT,
    status TEXT CHECK(status IN ('PENDING', 'APPROVED', 'CANCELLED')),
    created_at DATETIME,
    updated_at DATETIME,
    approved_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    title TEXT,
    message TEXT,
    type TEXT,
    isRead BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS scan_history (
    id TEXT PRIMARY KEY,
    product_id TEXT,
    action TEXT,
    details TEXT,
    scanned_by TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export default db;
