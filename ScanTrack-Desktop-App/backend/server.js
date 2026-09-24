import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './firebase.js';
import QRCode from 'qrcode';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy,
  getDoc,
  setDoc,
  deleteDoc,
  where,
  limit
} from 'firebase/firestore';

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the internal public folder
const frontendPath = path.join(__dirname, 'public');
app.use(express.static(frontendPath));

// Helper to log actions to scanHistory
async function logScan(rollId, action, details) {
  const scanId = `SCAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const scanDoc = doc(db, 'scanHistory', scanId);
  await setDoc(scanDoc, {
    rollId,
    action,
    details,
    timestamp: new Date().toISOString(),
    scannedBy: 'SYSTEM_ADMIN'
  });
}

// ─── HEALTH ────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'ScanTrack Backend is running with Firebase' });
});

// ─── ITEMS (Unified Collection) ────────────────────────────────────

// Get all active and dispatched items
app.get('/api/rolls', async (req, res) => {
  try {
    const q = query(collection(db, 'items'), orderBy('production_date', 'desc'));
    const querySnapshot = await getDocs(q);
    const rolls = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      firebaseId: doc.id
    }));
    res.json(rolls);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Get single item by ID
app.get('/api/rolls/:id', async (req, res) => {
  try {
    const rollId = req.params.id;
    const itemSnap = await getDoc(doc(db, 'items', rollId));

    if (itemSnap.exists()) {
      return res.json(itemSnap.data());
    }
    res.status(404).json({ error: 'Item not found' });
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item data' });
  }
});

// Helper to generate generic Item ID
function generateItemId() {
  const year = new Date().getFullYear();
  const random = Math.floor(100 + Math.random() * 900);
  return `ITM-${year}-${random.toString().padStart(3, '0')}`;
}

// Create new item
app.post('/api/rolls', async (req, res) => {
  try {
    const { item_type, weight, rack_id, bin, lot_number, order_id, item_count, supplier_name, quality_grade } = req.body;
    const rollId = generateItemId();
    const now = new Date().toISOString();

    const itemData = {
      id: rollId,
      last_state_change: now,
      lot_number: lot_number || `LOT-GEN-${new Date().getTime().toString().slice(-4)}`,
      order_id: order_id || 'ORD-NONE',
      production_date: now,
      quality_grade: quality_grade || 'A',
      rack_id: rack_id || '1',
      state: 'IN STOCK',
      supplier_name: supplier_name || 'Generic Supplier',
      weight: parseFloat(weight) || 25,
      item_count: item_count || 'Standard',
      item_type: item_type || 'Generic Item',
      bin: String(bin || '1').replace(/[Bb]/g, '')
    };

    // Save directly to unified 'items' collection
    await setDoc(doc(db, 'items', rollId), itemData);
    await logScan(rollId, 'CREATION', `Registered in ${itemData.rack_id} / ${itemData.bin}`);

    // Generate QR Code image
    const qrDir = path.join(frontendPath, 'qrcodes');
    if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

    const qrDataObj = {
      id: itemData.id,
      item_type: itemData.item_type,
      weight: itemData.weight,
      lot_number: itemData.lot_number,
      order_id: itemData.order_id,
      production_date: itemData.production_date,
      supplier_name: itemData.supplier_name,
      state: itemData.state
    };
    
    const qrPath = path.join(qrDir, `${rollId}.png`);
    await QRCode.toFile(qrPath, JSON.stringify(qrDataObj), {
      color: { dark: '#000000', light: '#ffffff' },
      width: 400
    });

    res.status(201).json(itemData);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Update item state (bulk operation)
app.post('/api/rolls/update-state', async (req, res) => {
  try {
    const { rollIds, state } = req.body;
    const capitalizedState = state.toUpperCase();
    const now = new Date().toISOString();

    await Promise.all(rollIds.map(async (id) => {
      try {
        const itemDoc = await getDoc(doc(db, 'items', id));
        if (itemDoc.exists()) {
          const updatedData = { state: capitalizedState, last_state_change: now };
          
          if (capitalizedState === 'DISPATCHED') {
            updatedData.delivered_at = now;
          }
          
          await updateDoc(doc(db, 'items', id), updatedData);
          await logScan(id, 'STATE_CHANGE', `State changed to ${capitalizedState}`);
        }
      } catch (err) {
        console.log(`Error processing item ${id}:`, err.message);
      }
    }));

    res.json({ success: true, message: `Updated ${rollIds.length} item(s) to ${capitalizedState}` });
  } catch (error) {
    console.error('Error updating item states:', error);
    res.status(500).json({ error: 'Failed to update item states' });
  }
});

// Get exclusively dispatched items (for Reports.jsx)
app.get('/api/dispatched', async (req, res) => {
  try {
    const q = query(collection(db, 'items'), where('state', '==', 'DISPATCHED'));
    const snap = await getDocs(q);
    const dispatched = snap.docs.map(doc => ({ ...doc.data(), firebaseId: doc.id }));
    
    dispatched.sort((a, b) => {
      const dateA = new Date(a.delivered_at || a.last_state_change || 0);
      const dateB = new Date(b.delivered_at || b.last_state_change || 0);
      return dateB - dateA;
    });

    res.json(dispatched);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dispatched items' });
  }
});

// ─── ORDERS ────────────────────────────────────────────────────────
app.post('/api/orders', async (req, res) => {
  try {
    const { customer_name, item_type, quantity, items } = req.body;
    const orderId = `ORD-${Date.now()}`;
    const now = new Date().toISOString();

    let orderItems = [];
    if (items && Array.isArray(items) && items.length > 0) {
      orderItems = items.map(item => ({
        item_type: item.item_type,
        quantity: parseInt(item.quantity) || 1
      }));
    } else {
      orderItems = [{
        item_type: item_type || 'Generic Item',
        quantity: parseInt(quantity) || 1
      }];
    }

    const orderData = {
      id: orderId,
      customer_name: customer_name || 'Anonymous Customer',
      items: orderItems,
      item_type: orderItems[0].item_type,
      quantity: orderItems[0].quantity,
      status: 'PENDING',
      createdAt: now,
      approvedAt: null
    };

    await setDoc(doc(db, 'orders', orderId), orderData);

    const notificationId = `NOTIF-${Date.now()}`;
    const itemsSummary = orderItems.map(i => `${i.quantity} x ${i.item_type}`).join(', ');

    await setDoc(doc(db, 'notifications', notificationId), {
      id: notificationId,
      userId: 'SYSTEM_ADMIN',
      title: 'New Order Received',
      message: `Customer ${orderData.customer_name} placed an order for: ${itemsSummary}.`,
      orderId: orderId,
      type: 'ORDER_PENDING',
      isRead: false,
      createdAt: now
    });

    res.status(201).json(orderData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    res.json(snap.docs.map(doc => doc.data()));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.post('/api/orders/:id/approve', async (req, res) => {
  try {
    const orderId = req.params.id;
    const orderDocRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderDocRef);

    if (!orderSnap.exists()) return res.status(404).json({ error: 'Order not found' });
    const orderData = orderSnap.data();
    if (orderData.status !== 'PENDING') return res.status(400).json({ error: `Order is already ${orderData.status}` });

    const orderItems = orderData.items || [{ item_type: orderData.item_type, quantity: orderData.quantity }];
    
    // Fetch IN STOCK items
    const invSnap = await getDocs(query(collection(db, 'items'), where('state', '==', 'IN STOCK')));
    let availablePool = invSnap.docs.map(d => d.data());

    const rollsToReserve = [];
    const missingItems = [];

    for (const item of orderItems) {
      const orderType = String(item.item_type || '').toLowerCase().trim();
      const matchingRolls = availablePool.filter(roll => {
        const rollType = String(roll.item_type || '').toLowerCase().trim();
        return rollType.includes(orderType) || orderType.includes(rollType);
      });

      if (matchingRolls.length < item.quantity) {
        missingItems.push({ type: item.item_type, required: item.quantity, available: matchingRolls.length });
      } else {
        const selected = matchingRolls.slice(0, item.quantity);
        rollsToReserve.push(...selected);
        const selectedIds = new Set(selected.map(r => r.id));
        availablePool = availablePool.filter(r => !selectedIds.has(r.id));
      }
    }

    if (missingItems.length > 0) {
      return res.status(400).json({ error: 'Insufficient stock', missing: missingItems });
    }

    const now = new Date().toISOString();
    await Promise.all(rollsToReserve.map(async (roll) => {
      await updateDoc(doc(db, 'items', roll.id), { state: 'RESERVED', order_id: orderId, last_state_change: now });
      await logScan(roll.id, 'AUTO_RESERVE', `Reserved for order ${orderId}`);
    }));

    await updateDoc(orderDocRef, {
      status: 'APPROVED',
      approvedAt: now,
      assignedItems: rollsToReserve.map(r => r.id)
    });

    res.json({ success: true, message: `Order approved and ${rollsToReserve.length} items reserved` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve order' });
  }
});

// ─── NOTIFICATIONS ──────────────────────────────────────────────────
app.get('/api/notifications', async (req, res) => {
  try {
    const snap = await getDocs(collection(db, 'notifications'));
    const notifs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    notifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(notifs);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.post('/api/notifications/mark-all-read', async (req, res) => {
  try {
    const snap = await getDocs(collection(db, 'notifications'));
    await Promise.all(snap.docs.filter(d => !d.data().isRead).map(d => updateDoc(d.ref, { isRead: true })));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to mark notifications' });
  }
});

// ─── TRANSACTIONS (Scan History) ────────────────────────────────────
app.get('/api/transactions', async (req, res) => {
  try {
    const snap = await getDocs(collection(db, 'scanHistory'));
    const txns = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    txns.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(txns.slice(0, 100));
  } catch (e) {
    res.json([]);
  }
});

// Catch-all route for React SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 ═══════════════════════════════════════════════════════');
  console.log('   ScanTrack API - Backend Server (FIREBASE)');
  console.log(`   📡 Server running on: http://localhost:${PORT}`);
  console.log('   ═══════════════════════════════════════════════════════\n');
});
