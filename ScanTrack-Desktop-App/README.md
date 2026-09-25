# 📦 ScanTrack Desktop App

> **ScanTrack** | Smart QR-powered Inventory Management for the Desktop

A full-featured **ERP-grade desktop application** for tracking inventory items from intake to dispatch. Built with Python (PyQt6) as a native shell wrapping a Node.js/Express backend and a modern React web frontend — all running locally as a single packaged application.

---

## 📋 Table of Contents

1. [What This App Does](#-what-this-app-does)
2. [System Architecture](#-system-architecture)
3. [App Flow — Step by Step](#-app-flow--step-by-step)
4. [Pages & Features](#-pages--features)
5. [Item Lifecycle & States](#-item-lifecycle--states)
6. [How to Use — Complete Workflow](#-how-to-use--complete-workflow)
7. [Tech Stack](#-tech-stack)
8. [Prerequisites & Setup](#-prerequisites--setup)
9. [Running the App](#-running-the-app)

---

## 🎯 What This App Does

The **ScanTrack Desktop App** is the operations hub for a warehouse. It allows staff and managers to:

- **Register items** into the inventory with unique IDs and auto-generated QR codes
- **Track the state** of every item (In Stock → Reserved → Picked → Dispatched)
- **Approve customer orders** from a centralized Admin panel
- **View inventory analytics** with charts, filters, and cards
- **Manage dispatched items** and delivery history

This desktop app is the **admin/operations counterpart** to the mobile Flutter app used by warehouse staff on the floor.

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────┐
│              Desktop App (PyQt6 Shell)               │
│   ┌─────────────────────────────────────────────┐   │
│   │         Splash Screen (Loading)             │   │
│   └──────────────────┬──────────────────────────┘   │
│                      │ (server ready)                │
│   ┌──────────────────▼──────────────────────────┐   │
│   │     QWebEngineView (Embedded Browser)        │   │
│   │     → http://localhost:5000                 │   │
│   └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                       │
         ┌─────────────▼─────────────┐
         │  Node.js/Express Backend  │
         │  (server.js — Port 5000)  │
         │  ┌─────────────────────┐  │
         │  │  REST API Endpoints │  │
         │  │  React Frontend     │  │
         │  │  Firebase Connector │  │
         │  └─────────────────────┘  │
         └─────────────┬─────────────┘
                       │
         ┌─────────────▼─────────────┐
         │    Firebase Firestore     │
         │  (Cloud Database)         │
         │  • inventory              │
         │  • orders                 │
         │  • transactions           │
         │  • notifications          │
         └───────────────────────────┘
```

**How it starts up:**
1. `app.py` (PyQt6) launches and shows a branded splash screen
2. In a background thread, it starts the Node.js `server.js`
3. It polls `http://localhost:5000/api/health` every second
4. Once the backend responds `200 OK`, the embedded browser loads the web UI
5. When the page finishes rendering, the splash screen fades out

---

## 🔄 App Flow — Step by Step

### Complete Operational Flow

```
[Item Arrives at Warehouse]
         │
         ▼
[1. INTAKE — Register Item]
  • Open Stock In page
  • Fill: Description, Quantity, Location
  • System generates Item ID
  • QR Code PNG auto-generated
         │
         ▼
[2. PRINT & ATTACH QR]
  • View QR from Generator
  • Print and attach to physical item in warehouse
         │
         ▼
[3. STATE: IN STOCK]
  • Item visible in Inventory Grid
         │
         ▼
[4. CUSTOMER PLACES ORDER]
  • Admin receives notification
         │
         ▼
[5. ADMIN APPROVES ORDER]
  • Open Orders panel
  • Review order details
  • Click "Approve" → system auto-assigns matching items
  • Matched items → state changes to RESERVED
         │
         ▼
[6. STATE: RESERVED → PICKED]
  • Floor staff scans QR with mobile app
  • Item moves to PICKED state (ready for dispatch)
         │
         ▼
[7. STATE: DISPATCHED]
  • Admin marks item as Dispatched or Mobile App confirms
  • Item recorded as dispatched in history
```

---

## 📄 Pages & Features

### 1. 🏠 Inventory Dashboard
The **main operations screen**. This is the first page loaded when the app starts.

**What you can do:**
- View inventory health via beautiful charts and metrics.
- See total items, low stock warnings, and recent activity.

---

### 2. 📊 Inventory Grid
View all registered items in a detailed data grid.

**Features:**
- Sort and filter items by location, status, or search query.
- View individual item details.

---

### 3. 📥 Stock In & Out
Manage stock levels manually.
- Add new items or increment quantities for existing items.
- Remove stock that is defective or unaccounted for.

---

### 4. 🔑 Orders
The **order management and approval hub** for managers.
- Approve or reject pending orders.
- View order status (Pending, Approved, Fulfilled).

---

### 5. 🖼 QR Generator
Visual gallery of **all generated QR code images**.
- Browse QR codes for all registered items.
- Print individual QR codes directly.

---

## 🔁 Item Lifecycle & States

Every item moves through these states:

```
IN STOCK ──► RESERVED ──► PICKED ──► DISPATCHED
```

| State | Color | Meaning |
|-------|-------|---------|
| **IN STOCK** | 🟢 Green | Item is available in the warehouse |
| **RESERVED** | 🔵 Blue | Assigned to an approved customer order |
| **PICKED** | 🟡 Amber | Physically picked from shelf, ready to ship |
| **DISPATCHED** | 🔴 Red | Delivered; removed from active inventory |

---

## 🚀 How to Use — Complete Workflow

### Day 1: First Time Setup
1. Edit `backend/firebase.js` with your Firebase project credentials.
2. Build the React frontend: `cd web && npm install && npm run build`
3. Install backend dependencies: `cd backend && npm install`
4. Install Python dependencies: `pip install -r requirements.txt`
5. Launch app: `python app.py`

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Desktop Shell** | Python 3 + PyQt6 | Native window, splash screen, process management |
| **Embedded Browser** | PyQt6-WebEngine (Chromium) | Renders the web UI inside the desktop window |
| **Backend API** | Node.js + Express.js | REST API, QR generation, Firebase connector |
| **Frontend UI** | React + Vite + TailwindCSS | Modern Single Page Application UI |
| **Database** | Firebase Firestore | Cloud-synced, real-time NoSQL database |
| **Packaging** | PyInstaller | Bundles app into a single `.exe` |

---

## ⚙️ Prerequisites & Setup

### System Requirements
- **OS**: Windows 10/11 (primary), macOS/Linux (development only)
- **Python**: 3.10+
- **Node.js**: 18+ (must be in system PATH)
- **Firebase Project**: With Firestore enabled

### Step 1 — Build the React App
```bash
cd web
npm install
npm run build
```
This bundles the React app into the `backend/public` directory.

### Step 2 — Install Node.js dependencies
```bash
cd backend
npm install
```

### Step 3 — Install Python dependencies
```bash
cd ..
pip install -r requirements.txt
```

### Step 4 — Configure Firebase
Edit `backend/firebase.js` and replace with your Firebase project config:
```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  // ...
};
```

---

## ▶️ Running the App

### Full Desktop App
```bash
python app.py
```
This starts the Node.js backend automatically, serves the React app, and shows the splash screen.

### Development Mode (Web Only)
```bash
# Terminal 1 (Backend API)
cd backend
node server.js

# Terminal 2 (React Frontend)
cd web
npm run dev
```
Open `http://localhost:5173` in your browser.

---

*Built for Modern Warehouses — Smart Inventory with QR Intelligence*

## 🛠️ Troubleshooting

- **Scan Failures (Mobile)**: If the app says "Product not found", ensure your QR code contains exactly the `product_id` string or valid JSON with a `id` field.
- **Sync Failures (Mobile)**: If stock changes aren't reaching the server, verify the mobile app has internet access. The `OfflineSyncService` will queue actions and retry them in the background automatically when the network restores.
- **Firebase Auth Errors**: If you get a 401 Unauthorized, ensure your Google Services JSON/plist is configured in the Flutter app and `GOOGLE_APPLICATION_CREDENTIALS` is set in the backend `.env`.
- **Database Locks (SQLite)**: SQLite operates in WAL mode ensuring concurrent reads and writes, but if you hit `SQLITE_BUSY`, the server will retry automatically.

## 📦 QR Code Payload Format

The mobile app's scanner handles either raw UUIDs or JSON payloads.
1. **Raw UUID:** `PRD-2d4e8c11` (Preferred, automatically generated by Dashboard)
2. **JSON Payload:** `{"id": "PRD-2d4e8c11", "sku": "SKU-PRD-2d4e8c11"}`

Any QR code generated outside the Dashboard *must* encode one of these formats.
