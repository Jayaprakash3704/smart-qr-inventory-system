# 📦 ScanTrack Inventory System

> **ScanTrack** | End-to-end QR-based Inventory Management

A complete, production-grade inventory system built for modern warehouses — combining a **Flutter mobile app** for warehouse floor staff and a **Python/Node.js/React desktop ERP app** for managers and admins. Both apps share a single **Firebase Firestore** database for real-time sync.

---

## 📦 Projects in this Repository

| Project | Platform | Tech | Role |
|---------|----------|------|------|
| [`Yarn-Manager-Mobile-App/`](./Yarn-Manager-Mobile-App/) | Android | Flutter / Dart | Warehouse floor — QR scanning, picking, dispatching |
| [`Yarn-Tracker-Desktop-App/`](./Yarn-Tracker-Desktop-App%20-%20Copy/) | Windows | Python + Node.js + React | Admin desk — inventory management, orders, analytics |

---

## 🎯 System Purpose

This system solves the problem of **tracking physical items** in a warehouse:

1. **Admin (Desktop)** registers items → auto-generates QR codes
2. **Staff (Mobile)** scans QR labels on physical items → picks and dispatches
3. **Firebase** keeps both apps in sync in real-time

Every item goes through a tracked lifecycle: `IN STOCK → RESERVED → PICKED → DISPATCHED`

---

## 🏗 High-Level Architecture

```
┌──────────────────────┐        ┌────────────────────────────┐
│  Mobile App (Flutter)│        │ Desktop App (Python/React) │
│  ─────────────────── │        │  ──────────────────────────│
│  • QR Code Scanner   │        │  • Inventory Dashboard     │
│  • Pick List         │        │  • Admin Order Approval    │
│  • Dispatch List     │        │  • QR Code Generation      │
│  • Add Item to Stock │        │  • Analytics & Reports     │
└──────────┬───────────┘        └────────────┬───────────────┘
           │                                 │
           │    Firebase Firestore (Cloud)   │
           └────────────┬────────────────────┘
                        │
          ┌─────────────▼──────────────┐
          │     Shared Collections     │
          │  • inventory               │
          │  • transactions            │
          │  • orders                  │
          │  • notifications           │
          └────────────────────────────┘
```

---

## 🔄 Complete System Flow

```
[New Item Arrives]
       │
       ▼
[Desktop: Register Item]          [Mobile: Scan & Add]
  Fill form → Submit         OR     Scan QR label → Add
  Auto-generates Item ID            Assigns Rack/Bin
  QR PNG saved to disk
       │
       ▼
[State: IN STOCK — visible in both apps]
       │
       ▼
[Customer places order]
       │
       ▼
[Desktop Admin: Approve Order]
  Reviews pending orders
  Clicks Approve → system auto-assigns matching items
       │
       ▼
[State: RESERVED — appears in Mobile Pick List]
       │
       ▼
[Mobile: Floor staff opens Pick List]
  Navigates to shelf location
  Scans QR on physical item → verified ✓
  Taps Confirm Pick
       │
       ▼
[State: PICKED — appears in Mobile Dispatch List]
       │
       ▼
[Mobile: Staff confirms dispatch]
  Scans QR → verifies item identity
  Taps Confirm Dispatch
       │
       ▼
[State: DISPATCHED — permanent delivery record in Firebase]
  Visible in Desktop Dispatched history
```

---

## 🛠 Tech Stack Overview

| Layer | Mobile App | Desktop App |
|-------|-----------|-------------|
| **Language** | Dart | Python + JavaScript/JSX |
| **Framework** | Flutter | PyQt6 + Node.js/Express + React |
| **UI** | Material 3 | React/TailwindCSS |
| **Database** | Firebase Firestore | Firebase Firestore |
| **QR Scanning** | mobile_scanner | — |
| **QR Generation** | — | qrcode (npm) |
| **Build Output** | Android APK | Windows .exe |

---

## 🚀 Quick Start

### Mobile App
```bash
cd Yarn-Manager-Mobile-App
flutter pub get
# Add android/app/google-services.json from Firebase Console
flutter run
```

---

### Desktop App
```bash
cd "Yarn-Tracker-Desktop-App - Copy/backend"
npm install
npm run build
cd ..
pip install -r requirements.txt
python app.py
```

---

## 🔥 Firebase Setup (Required for Both Apps)

Both apps connect to the **same Firebase project**.

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create or open your project
3. Enable **Cloud Firestore**
4. For mobile: download `google-services.json` → place in `android/app/`
5. For desktop: edit `backend/firebase.js` with your web app config

---

*Built for Modern Warehouses — Smart Inventory with QR Intelligence*
