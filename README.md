# 🧵 Smart QR Inventory System

> **S.A. Textiles** | End-to-end QR-based Yarn Inventory Management

A complete, production-grade yarn inventory system built for textile warehouses — combining a **Flutter mobile app** for warehouse floor staff and a **Python/Node.js desktop ERP app** for managers and admins. Both apps share a single **Firebase Firestore** database for real-time sync.

---

## 📦 Projects in this Repository

| Project | Platform | Tech | Role |
|---------|----------|------|------|
| [`Yarn-Manager-Mobile-App/`](./Yarn-Manager-Mobile-App/) | Android | Flutter / Dart | Warehouse floor — QR scanning, picking, dispatching |
| [`Yarn-Tracker-Desktop-App/`](./Yarn-Tracker-Desktop-App%20-%20Copy/) | Windows | Python + Node.js | Admin desk — inventory management, orders, analytics |

---

## 🎯 System Purpose

This system solves the problem of **tracking physical yarn rolls** in a textile warehouse:

1. **Admin (Desktop)** registers yarn rolls → auto-generates QR codes
2. **Staff (Mobile)** scans QR labels on physical rolls → picks and dispatches
3. **Firebase** keeps both apps in sync in real-time

Every yarn roll goes through a tracked lifecycle: `IN STOCK → RESERVED → PICKED → DISPATCHED`

---

## 🏗 High-Level Architecture

```
┌──────────────────────┐        ┌────────────────────────────┐
│  Mobile App (Flutter)│        │  Desktop App (Python/Node) │
│  ─────────────────── │        │  ──────────────────────────│
│  • QR Code Scanner   │        │  • Inventory Dashboard     │
│  • Reserved List     │        │  • Admin Order Approval    │
│  • Dispatch List     │        │  • QR Code Generation      │
│  • Add Yarn to Stock │        │  • Analytics & Reports     │
└──────────┬───────────┘        └────────────┬───────────────┘
           │                                 │
           │    Firebase Firestore (Cloud)   │
           └────────────┬────────────────────┘
                        │
          ┌─────────────▼──────────────┐
          │     Shared Collections     │
          │  • inventory               │
          │  • yarnRolls               │
          │  • reserved_collection     │
          │  • picking_collection      │
          │  • deliveries              │
          │  • Order_collection        │
          │  • scanHistory             │
          └────────────────────────────┘
```

---

## 🔄 Complete System Flow

```
[New Yarn Arrives]
       │
       ▼
[Desktop: Register Roll]          [Mobile: Scan & Add]
  Fill form → Submit         OR     Scan QR label → Add
  Auto-generates Roll ID            Assigns Rack/Bin
  QR PNG saved to disk
       │
       ▼
[State: IN STOCK — visible in both apps]
       │
       ▼
[Customer places order via Mobile or Admin panel]
       │
       ▼
[Desktop Admin: Approve Order]
  Reviews pending orders
  Clicks Approve → system auto-assigns matching rolls
       │
       ▼
[State: RESERVED — appears in Mobile Reserved List]
       │
       ▼
[Mobile: Floor staff opens Reserved List]
  Navigates to shelf location
  Scans QR on physical roll → verified ✓
  Taps Confirm Pick
       │
       ▼
[State: PICKED — appears in Mobile Dispatch List]
       │
       ▼
[Mobile: Staff confirms dispatch]
  Scans QR → verifies roll identity
  Taps Confirm Dispatch
       │
       ▼
[State: DISPATCHED — permanent delivery record in Firebase]
  Visible in Desktop Dispatched Rolls history
```

---

## 🛠 Tech Stack Overview

| Layer | Mobile App | Desktop App |
|-------|-----------|-------------|
| **Language** | Dart | Python + JavaScript |
| **Framework** | Flutter | PyQt6 + Node.js/Express |
| **UI** | Material 3 | HTML/TailwindCSS/Chart.js |
| **Database** | Firebase Firestore | Firebase Firestore |
| **QR Scanning** | mobile_scanner | — |
| **QR Generation** | — | qrcode (npm) |
| **Build Output** | Android APK | Windows .exe |

---

## 📂 Repository Structure

```
smart-qr-inventory-system/
│
├── README.md                           ← You are here
├── ARCHITECTURE.md                     ← Detailed system architecture diagrams
├── .firebaserc                         ← Firebase project binding
├── firebase.json                       ← Firebase hosting config
├── firestore.rules                     ← Firestore security rules
│
├── Yarn-Manager-Mobile-App/            ← Flutter Mobile App
│   ├── lib/
│   │   ├── main.dart                   # Entry point & routes
│   │   ├── pages/                      # All screen files
│   │   └── services/yarn_service.dart  # Firebase & business logic
│   ├── assets/icon/                    # App icon
│   ├── android/                        # Android build config
│   └── pubspec.yaml                    # Flutter dependencies
│
└── Yarn-Tracker-Desktop-App - Copy/    ← Desktop ERP App
    ├── app.py                          # PyQt6 desktop shell
    ├── requirements.txt                # Python dependencies
    ├── backend/
    │   ├── server.js                   # Node.js/Express API server
    │   ├── firebase.js                 # Firebase config
    │   └── public/                     # Web UI (HTML pages)
    └── YarnRollTrackerApp.spec         # PyInstaller build spec
```

---

## 🚀 Quick Start

### Mobile App
```bash
cd Yarn-Manager-Mobile-App
flutter pub get
# Add android/app/google-services.json from Firebase Console
flutter run
```
👉 See [`Yarn-Manager-Mobile-App/README.md`](./Yarn-Manager-Mobile-App/README.md) for full setup guide.

---

### Desktop App
```bash
cd "Yarn-Tracker-Desktop-App - Copy"
pip install -r requirements.txt
cd backend && npm install && cd ..
python app.py
```
👉 See [`Yarn-Tracker-Desktop-App/README.md`](./Yarn-Tracker-Desktop-App%20-%20Copy/README.md) for full setup guide.

---

## 🔥 Firebase Setup (Required for Both Apps)

Both apps connect to the **same Firebase project**.

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create or open your project
3. Enable **Cloud Firestore**
4. For mobile: download `google-services.json` → place in `android/app/`
5. For desktop: edit `backend/firebase.js` with your web app config

---

## 📖 Further Documentation

| Document | Description |
|---------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture, component diagrams, data flow sequences |
| [Mobile App README](./Yarn-Manager-Mobile-App/README.md) | Full mobile app setup, screens, and workflow |
| [Desktop App README](./Yarn-Tracker-Desktop-App%20-%20Copy/README.md) | Full desktop app setup, pages, and workflow |

---

*Built for S.A. Textiles — Smart Yarn Inventory with QR Intelligence*
