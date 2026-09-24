# 🧵 Yarn Roll Tracker — Desktop App

> **S.A. Textiles** | Smart QR-powered Yarn Inventory Management for the Desktop

A full-featured **ERP-grade desktop application** for tracking yarn rolls from intake to dispatch. Built with Python (PyQt6) as a native shell wrapping a Node.js/Express backend and a modern web-based frontend — all running locally as a single packaged application.

---

## 📋 Table of Contents

1. [What This App Does](#-what-this-app-does)
2. [System Architecture](#-system-architecture)
3. [App Flow — Step by Step](#-app-flow--step-by-step)
4. [Pages & Features](#-pages--features)
5. [Roll Lifecycle & States](#-roll-lifecycle--states)
6. [How to Use — Complete Workflow](#-how-to-use--complete-workflow)
7. [Tech Stack](#-tech-stack)
8. [Prerequisites & Setup](#-prerequisites--setup)
9. [Running the App](#-running-the-app)
10. [Building the Executable](#-building-the-executable)
11. [Firebase & Data Storage](#-firebase--data-storage)
12. [Troubleshooting](#-troubleshooting)
13. [Directory Structure](#-directory-structure)

---

## 🎯 What This App Does

The **Yarn Roll Tracker Desktop App** is the operations hub for a textile warehouse. It allows staff and managers to:

- **Register yarn rolls** into the inventory with unique IDs and auto-generated QR codes
- **Track the state** of every roll (In Stock → Reserved → Picked → Dispatched)
- **Approve customer orders** from a centralized Admin panel
- **Scan and verify** rolls using QR codes printed and used in the warehouse
- **View inventory analytics** with charts, filters, and roll cards
- **Manage dispatched rolls** and delivery history

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
         │  │  QR Code Generator  │  │
         │  │  Firebase Connector │  │
         │  └─────────────────────┘  │
         └─────────────┬─────────────┘
                       │
         ┌─────────────▼─────────────┐
         │    Firebase Firestore     │
         │  (Cloud Database)         │
         │  • yarnRolls              │
         │  • inventory              │
         │  • deliveries             │
         │  • Order_collection       │
         │  • reserved_collection    │
         │  • scanHistory            │
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
[Yarn Arrives at Warehouse]
         │
         ▼
[1. INTAKE — Register Roll]
  • Open Inventory page
  • Click "Create QR" / Add Roll
  • Fill: Yarn Type, Weight, Rack, Bin, Count, Supplier
  • System generates Roll ID (e.g. YR-2026-042)
  • QR Code PNG auto-saved to /public/qrcodes/
         │
         ▼
[2. PRINT & ATTACH QR]
  • View QR from Gallery or Inventory card
  • Print and attach to physical roll in warehouse
         │
         ▼
[3. STATE: IN STOCK]
  • Roll visible in Inventory Dashboard
  • Searchable by ID, Type, Rack, Status
         │
         ▼
[4. CUSTOMER PLACES ORDER] ← (from Mobile App or Admin panel)
  • Admin receives notification on Dashboard
  • Order appears in Admin Approval panel
         │
         ▼
[5. ADMIN APPROVES ORDER]
  • Open Admin panel → Pending Orders
  • Review order: customer, yarn type, quantity
  • Click "Approve" → system auto-assigns matching rolls
  • Matched rolls → state changes to RESERVED
         │
         ▼
[6. STATE: RESERVED → PICKED]
  • Floor staff scans QR with mobile app
  • Roll moves to PICKED state (ready for dispatch)
         │
         ▼
[7. STATE: DISPATCHED]
  • Admin marks roll as Dispatched
  • Roll moves from inventory → deliveries collection
  • Appears in Dispatched Rolls page with delivery timestamp
         │
         ▼
[8. HISTORY & REPORTS]
  • Every action logged to scanHistory in Firebase
  • View all dispatched rolls in Dispatched page
  • Inventory Dashboard shows live charts & stats
```

---

## 📄 Pages & Features

### 1. 🏠 Inventory Dashboard (`index.html`)
The **main operations screen**. This is the first page loaded when the app starts.

**What you can do:**
- View all yarn rolls as cards in a filterable grid
- Filter by: **All / In Stock / Reserved / Dispatched**
- Search rolls by ID, yarn type, supplier, or rack
- Click any roll card to view full details
- See the **QR image** for each roll inline
- **Create new rolls** using the "Create QR" form
- View **notification bell** for new customer orders

**Key stats shown:**

| Metric | Description |
|--------|-------------|
| Total Rolls | All registered rolls |
| In Stock | Available for reservation |
| Reserved | Assigned to an approved order |
| Dispatched | Already delivered/sent out |

---

### 2. 📊 Analytics Dashboard (`dashboard.html`)
Visual overview of inventory health with **Chart.js powered charts**.

**Charts available:**
- Yarn type distribution (Pie/Doughnut)
- State breakdown (In Stock vs Reserved vs Dispatched)
- Stock trends over time

---

### 3. 🔑 Admin Panel (`admin.html`)
The **order management and approval hub** for managers.

**Workflow:**
1. Customer orders arrive as **PENDING** in this panel
2. Admin reviews: customer name, yarn type, quantity needed
3. Click **Approve** → system auto-matches rolls from inventory
4. Matched rolls move to **RESERVED** state
5. Approved orders saved to `approved_orders` Firestore collection
6. Notification cleared from the bell icon

**Features:**
- Notification badge shows count of pending orders
- Refresh button to pull latest orders from Firebase
- Filter between pending and approved orders

---

### 4. 📦 Dispatched Rolls (`dispatched.html`)
Complete history of all **delivered** yarn rolls.

**What's shown:**
- Roll ID, yarn type, weight, customer, delivery date
- Merges data from `deliveries` + legacy `yarnRolls` (DISPATCHED state) for complete history
- Sorted latest-first

---

### 5. 🖼 QR Gallery (`gallery.html`)
Visual gallery of **all generated QR code images**.

- Browse QR codes for all registered rolls
- Print individual QR codes directly
- Useful for batch printing before warehouse labeling

---

### 6. 📋 Roll Details (`details.html`)
Full detail view for a **single yarn roll**.

- All metadata: ID, yarn type, weight, lot number, order ID, rack/bin
- Current state with color-coded badge
- QR code image
- Scan history / audit trail

---

### 7. 📥 Bulk Intake (`bulk_intake.html`)
Register **multiple rolls at once** — ideal for large yarn deliveries.

- Enter multiple roll details in a batch form
- All rolls get auto-IDs and QR codes generated simultaneously

---

### 8. ⚙️ Settings (`settings.html`)
Application configuration and sync controls.

---

## 🔁 Roll Lifecycle & States

Every yarn roll moves through these states:

```
IN STOCK ──► RESERVED ──► PICKED ──► DISPATCHED
    ▲              │
    └──────────────┘  (can be un-reserved back to IN STOCK)
```

| State | Color | Meaning |
|-------|-------|---------|
| **IN STOCK** | 🟢 Green | Roll is available in the warehouse |
| **RESERVED** | 🔵 Blue | Assigned to an approved customer order |
| **PICKED** | 🟡 Amber | Physically picked from shelf, ready to ship |
| **DISPATCHED** | 🔴 Red | Delivered; removed from active inventory |

**Firebase Collections involved per state:**

| State | Written To | Removed From |
|-------|-----------|--------------|
| IN STOCK | `inventory`, `yarnRolls` | — |
| RESERVED | `inventory`, `reserved_collection`, `yarnRolls` | `picking_collection` |
| PICKED | `inventory`, `picking_collection` | `reserved_collection` |
| DISPATCHED | `deliveries` | `inventory`, `reserved_collection`, `picking_collection` |

---

## 🚀 How to Use — Complete Workflow

### Day 1: First Time Setup
1. Install prerequisites (see [Prerequisites](#-prerequisites--setup))
2. Run `pip install -r requirements.txt`
3. Run `cd backend && npm install`
4. Ensure `firebase.js` has your Firebase project credentials
5. Launch app: `python app.py`

---

### Adding New Yarn Rolls

1. Launch the app → Inventory page loads
2. Click **"+ Create QR"** button (top-right area)
3. Fill in the form:
   - **Yarn Type** (e.g. `Cotton 30s`)
   - **Yarn Count** (e.g. `30s`)
   - **Weight** (in kg, e.g. `25`)
   - **Supplier Name**
   - **Rack ID** (e.g. `R1`)
   - **Bin** (e.g. `1`)
   - **Lot Number** (optional, auto-generated if blank)
   - **Order ID** (optional)
4. Click **Submit** → Roll ID is generated (e.g. `YR-2026-042`)
5. QR code PNG is saved to `backend/public/qrcodes/YR-2026-042.png`
6. Roll appears in the Inventory grid with **IN STOCK** status

> 💡 **Tip:** Keep Rack and Bin consistent with physical shelf labels so staff can locate rolls by scanning QR codes.

---

### Processing an Order

1. Customer (via Mobile App) places an order
2. A **notification** appears on the bell icon in the top bar
3. Navigate to **Admin Panel** (`admin.html`)
4. Find the **PENDING** order → review details
5. Click **Approve Order**
6. System automatically:
   - Finds matching rolls by yarn type
   - Marks required quantity as **RESERVED**
   - Saves approved order to Firebase
7. Warehouse staff use the **Mobile App** to scan and pick reserved rolls
8. Once physically shipped, mark rolls as **DISPATCHED** from inventory

---

### Finding a Specific Roll

1. Go to the **Inventory Dashboard**
2. Use the **search bar** → type Roll ID, supplier, or yarn type
3. Use **state filter tabs**: All / In Stock / Reserved / Dispatched
4. Click on a roll card to open the **Details page**

---

### Printing QR Codes

1. Go to **QR Gallery** page
2. Find the roll whose QR you want to print
3. Click the QR image or the **Print** button
4. Attach printed QR label to the physical yarn roll

> ⚠️ QR codes encode: Roll ID, Yarn Type, Weight, Lot Number, Order ID, Production Date, Supplier, State. They do **not** encode Rack, Bin, or quality grade (kept server-side only).

---

### Reviewing Dispatched History

1. Navigate to **Dispatched Rolls** page
2. View complete delivery history sorted by date
3. Each record shows: Roll ID, Yarn Type, Weight, Delivered At timestamp

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Desktop Shell** | Python 3 + PyQt6 | Native window, splash screen, process management |
| **Embedded Browser** | PyQt6-WebEngine (Chromium) | Renders the web UI inside the desktop window |
| **Backend API** | Node.js + Express.js | REST API, QR generation, Firebase connector |
| **Frontend UI** | HTML5 + TailwindCSS + Chart.js | Inventory pages, forms, charts |
| **QR Generation** | `qrcode` npm package | Auto-generates PNG QR code images |
| **Database** | Firebase Firestore | Cloud-synced, real-time NoSQL database |
| **Packaging** | PyInstaller | Bundles app into a single `.exe` |
| **Fonts** | Google Fonts — Outfit | Typography |

---

## ⚙️ Prerequisites & Setup

### System Requirements
- **OS**: Windows 10/11 (primary), macOS/Linux (development only)
- **Python**: 3.10+
- **Node.js**: 18+ (must be in system PATH)
- **Firebase Project**: With Firestore enabled

### Step 1 — Install Python dependencies
```bash
pip install -r requirements.txt
```

Installs:
- `PyQt6` — Desktop window framework
- `PyQt6-WebEngine` — Chromium embedded browser
- `pyinstaller` — For building the `.exe`
- `requests` — For server health polling

### Step 2 — Install Node.js dependencies
```bash
cd backend
npm install
```

Installs: `express`, `cors`, `firebase`, `qrcode`

### Step 3 — Configure Firebase
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

### Development Mode

**Option A — Full app (recommended):**
```bash
python app.py
```
This starts the Node.js backend automatically and shows the splash screen.

**Option B — Backend only (for debugging):**
```bash
cd backend
node server.js
# Then open http://localhost:5000 in your browser
```

**Option C — Backend in watch mode (auto-restart on changes):**
```bash
cd backend
npm run dev
```

### API Health Check
Once running, verify the backend is live:
```
GET http://localhost:5000/api/health
→ { "status": "OK", "message": "Yarn Roll Tracker Backend is running with Firebase" }
```

---

## 📦 Building the Executable

To package the app into a single Windows `.exe`:

```bash
pyinstaller YarnRollTrackerApp.spec
```

Output: `dist/YarnRollTrackerApp.exe`

> ⚠️ The backend `node_modules` and `public/` folder must be included in the spec file's `datas` list for the packaged app to work.

---

## 🔥 Firebase & Data Storage

### Firestore Collections

| Collection | Purpose |
|-----------|---------|
| `yarnRolls` | Legacy + primary roll registry |
| `inventory` | Fast-lookup mirror of active rolls |
| `racks/{r}/bins/{b}/rolls/{id}` | Hierarchical physical location structure |
| `reserved_collection` | Reserved rolls |
| `picking_collection` | Picked rolls ready for dispatch |
| `deliveries` | Dispatched/delivered rolls (permanent history) |
| `Order_collection` | Customer orders (PENDING / APPROVED) |
| `approved_orders` | Orders that have been approved |
| `notifications` | In-app notifications for admin |
| `scanHistory` | Audit log of all roll state changes |

### Self-Healing Logic
The backend includes **automatic data recovery**:
- If `inventory` is empty, it queries `collectionGroup('rolls')` across all racks/bins
- Missing QR images are auto-regenerated on startup
- Rolls missing from `inventory` are re-synced from hierarchical data

---

## 🔧 Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| App stuck on splash screen | Node.js not in PATH or backend error | Run `node --version` in terminal; check backend logs |
| "Backend directory not found" error | Missing `backend/` folder in packaged app | Re-run PyInstaller with correct spec |
| Rolls not showing in inventory | Firebase credentials wrong or offline | Check `firebase.js` config and internet connection |
| QR codes not generating | `qrcodes/` folder missing | Folder is auto-created; ensure write permissions |
| Blank screen after splash | `index.html` not served by Express | Check `backend/public/index.html` exists |
| Port 5000 already in use | Old `node.exe` process still running | App auto-kills old `node.exe` on startup (Windows) |
| Orders not appearing in Admin | Firebase `Order_collection` not synced | Click Refresh in Admin panel; check Firebase Rules |

---

## 📁 Directory Structure

```
Yarn-Tracker-Desktop-App/
│
├── app.py                      # PyQt6 desktop shell (entry point)
├── requirements.txt            # Python dependencies
├── logo.png                    # App logo (shown on splash screen)
├── YarnRollTrackerApp.spec     # PyInstaller build configuration
│
├── backend/                    # Node.js/Express Backend
│   ├── server.js               # Main API server (all routes)
│   ├── firebase.js             # Firebase SDK initialization
│   ├── package.json            # Node dependencies
│   │
│   └── public/                 # Web Frontend (served by Express)
│       ├── index.html          # Main Inventory Dashboard
│       ├── dashboard.html      # Analytics & Charts
│       ├── admin.html          # Order Approval Panel
│       ├── dispatched.html     # Dispatched Rolls History
│       ├── gallery.html        # QR Code Gallery
│       ├── details.html        # Single Roll Detail View
│       ├── bulk_intake.html    # Batch Roll Registration
│       ├── settings.html       # App Settings
│       ├── navbar.js           # Shared navigation bar logic
│       ├── navbar.css          # Shared navigation styles
│       └── qrcodes/            # Generated QR Code PNGs (auto-populated)
│
├── Screenshots/                # App UI screenshots
│
├── build/                      # PyInstaller build artifacts
└── dist/                       # Packaged .exe output
```

---

## 🤝 Related Projects

| Project | Technology | Role |
|---------|-----------|------|
| **This App** | Python + Node.js | Desktop admin & inventory management |
| **Yarn-Manager-Mobile-App** | Flutter/Dart | Warehouse floor QR scanning & dispatch |
| **Firebase Firestore** | Google Cloud | Shared real-time database between both apps |

Both apps connect to the **same Firebase project** — changes made on the desktop are instantly visible on the mobile app and vice versa.

---

*Built for S.A. Textiles — Smart Yarn Inventory with QR Intelligence*
