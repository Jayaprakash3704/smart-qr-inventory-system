# 📱 Yarn Scanner — Mobile App

> **S.A. Textiles** | QR-powered Yarn Inventory Management for Android

A Flutter mobile application for **warehouse floor staff** to scan QR codes, manage yarn roll reservations, verify and dispatch rolls — all synced in real-time with Firebase Firestore.

---

## 📋 Table of Contents

1. [What This App Does](#-what-this-app-does)
2. [App Flow — Step by Step](#-app-flow--step-by-step)
3. [Screens & Features](#-screens--features)
4. [How to Use — Complete Workflow](#-how-to-use--complete-workflow)
5. [Tech Stack](#-tech-stack)
6. [Prerequisites & Setup](#-prerequisites--setup)
7. [Running the App](#-running-the-app)
8. [Building the APK](#-building-the-apk)
9. [Firebase Configuration](#-firebase-configuration)
10. [Directory Structure](#-directory-structure)

---

## 🎯 What This App Does

The **Yarn Scanner Mobile App** is the **warehouse floor tool** used by workers to physically handle yarn rolls. It works together with the Desktop ERP App — the desktop admin registers rolls and approves orders, and the mobile app is used on the ground to:

- **Scan QR codes** on yarn rolls to identify them instantly
- **Add yarn** from scanned QR codes into the system inventory
- **Pick reserved rolls** from shelves (Reserved List)
- **Verify and dispatch** rolls to customers (Dispatch List)
- **View full details** of any yarn roll (type, weight, lot, rack, bin, status)
- **Print PDF reports** for individual rolls

This app is used **on the warehouse floor**, while the Desktop App is used **at the manager's desk**.

---

## 🔄 App Flow — Step by Step

```
[Open App]
      │
      ▼
[Welcome Screen]
  • Animated splash with logo
  • Tap "Get Started" to enter
      │
      ▼
[Home Screen — 3 Action Cards]
  ┌─────────────────────────────────────┐
  │  1. Reserved List                   │
  │  2. Dispatch List                   │
  │  3. Add Yarn (Scan QR)              │
  └─────────────────────────────────────┘
      │
      ├──► [Reserved List]
      │       │
      │       ▼
      │    Load reserved rolls from Firebase
      │    Scan roll QR → verify match → confirm pick
      │    Roll state: RESERVED → PICKED
      │
      ├──► [Dispatch List]
      │       │
      │       ▼
      │    Load picked rolls ready for dispatch
      │    Scan QR → verify → confirm dispatch
      │    Roll state: PICKED → DISPATCHED
      │
      └──► [Add Yarn]
              │
              ▼
           Scan QR on physical roll
           → View roll details
           → Assign Rack & Bin (auto or manual)
           → Confirm → Roll added to inventory as IN STOCK
```

---

## 📄 Screens & Features

### 1. 🌟 Welcome Screen (`welcome_page.dart`)
Animated splash/landing screen.

- Bouncing + rotating animated app logo
- Fade-in title: **"Yarn Scanner"**
- Glowing animated **"Get Started"** button
- Navigates to Home on tap

---

### 2. 🏠 Home Screen (`main_page.dart`)
The main menu with 3 large action cards.

| Card | Action | Icon |
|------|--------|------|
| **Reserved List** | Pick reserved rolls from shelves | 📦 Inventory |
| **Dispatch List** | Verify and dispatch picked rolls | 🚚 Shipping |
| **Add Yarn** | Scan QR to add new roll to stock | 📷 QR Scanner |

- Shimmer loading animation while cards load
- Diagonal cut card design with gradient backgrounds
- Settings icon (top-right) for app configuration

---

### 3. 📋 Reserved List (`reserved_list_page.dart`)
View all rolls **reserved** for approved orders.

**How it works:**
1. Loads all reserved rolls from Firebase `reserved_collection`
2. Each roll shows: Roll ID, Yarn Type, Weight, Rack, Bin, Order ID
3. Tap a roll → opens **QR Scanner** to scan and verify the physical roll
4. Scanner checks that scanned QR matches the expected roll ID
5. On match → roll is confirmed as **PICKED** (state updated in Firebase)

**Key behaviour:**
- Auto-validates QR match before allowing pick confirmation
- Shows error if wrong roll is scanned
- Real-time Firebase sync — newly reserved rolls appear immediately

---

### 4. 🚚 Dispatch List (`dispatch_list_page.dart`)
View all rolls in **PICKED** state, ready to be dispatched.

**How it works:**
1. Loads all picked rolls from Firebase `picking_collection`
2. Staff physically moves rolls to dispatch area
3. Tap roll → scan QR to verify → confirm dispatch
4. On confirm → roll state changes to **DISPATCHED**
5. Roll moves from `inventory` to `deliveries` collection

---

### 5. 📷 QR Scanner (`qr_code.dart`)
The camera-based QR scanner used across the app.

**Two modes:**
- **Add Mode** (`isAddMode: true`): Scan a new roll QR to add it to inventory
- **Verify Mode** (default): Scan to verify a roll matches expected ID

**Features:**
- Live camera with `mobile_scanner` package
- Instant QR decode and JSON parse
- Switches between front/back camera
- Toggle flash/torch
- Handles malformed QR data gracefully

---

### 6. 📦 Yarn Detail Page (`yarn_detail_page.dart`)
Full details for a scanned yarn roll.

**Shown fields:**
| Field | Description |
|-------|-------------|
| Roll ID | Unique identifier (e.g. YR-2026-042) |
| Yarn Type | Cotton 30s, etc. |
| Weight | In kilograms |
| Lot Number | Batch lot code |
| Order ID | Associated order |
| Production Date | When the roll was created |
| Supplier | Supplier name |
| State | IN STOCK / RESERVED / PICKED / DISPATCHED |
| Rack / Bin | Physical location in warehouse |

**Actions available:**
- **Add to Inventory** (Add Mode): Assign rack/bin → save to Firebase
- **Auto-allocate**: System finds the next available rack/bin automatically
- **Confirm Pick** (Reserved Mode): Verifies and marks roll as PICKED
- **Confirm Dispatch** (Dispatch Mode): Marks roll as DISPATCHED
- **Print PDF**: Generates and prints a roll detail report

---

### 7. ⚙️ Settings Page (`settings_page.dart`)
Configure app-level settings.

- API base URL (for connecting to local or remote backend)
- Default rack/bin preferences
- Other operational preferences

---

## 🚀 How to Use — Complete Workflow

### Adding a New Yarn Roll

1. Open app → tap **"Add Yarn"**
2. Camera opens → point at the QR code label on the physical roll
3. QR scans automatically → **Yarn Detail Page** opens
4. Review the roll details
5. Set **Rack** and **Bin** (or tap **Auto-Allocate** to let the system assign)
6. Tap **"Add to Inventory"**
7. Roll is saved in Firebase as **IN STOCK** ✅

> 💡 QR codes are printed from the Desktop App. Always scan the QR printed by the desktop, not an arbitrary QR.

---

### Picking a Reserved Roll (Floor Staff Workflow)

1. The desktop admin approves a customer order
2. Open app → tap **"Reserved List"**
3. A list of rolls needed for pending orders is shown
4. Go to the physical rack/bin location shown on screen
5. Tap the roll entry → camera opens
6. Scan the QR on the physical roll
7. App verifies it matches → tap **"Confirm Pick"**
8. Roll state changes to **PICKED** ✅

> ⚠️ If the wrong roll is scanned, the app shows a mismatch error. Only the correct roll will be accepted.

---

### Dispatching Rolls (Verification Before Shipping)

1. Open app → tap **"Dispatch List"**
2. All PICKED rolls ready for dispatch are listed
3. For each roll, tap → scan QR → verify identity
4. Tap **"Confirm Dispatch"**
5. Roll moves to **DISPATCHED** state ✅
6. Roll is removed from inventory and logged in `deliveries` with timestamp

---

### Printing a Roll Report

1. Scan any roll QR (via Add Yarn)
2. On the **Yarn Detail Page**, tap the **Print** icon
3. A PDF is generated with all roll metadata
4. Print via connected printer or share the PDF

---

## 🛠 Tech Stack

| Package | Version | Purpose |
|---------|---------|---------|
| `flutter` | SDK | UI framework |
| `mobile_scanner` | ^6.0.7 | Camera QR code scanning |
| `pretty_qr_code` | ^3.3.0 | QR code display widget |
| `firebase_core` | ^4.3.0 | Firebase SDK initialization |
| `cloud_firestore` | ^6.1.1 | Real-time Firestore database |
| `http` | ^1.3.0 | HTTP requests to backend API |
| `crypto` | ^3.0.6 | SHA-256 hashing for QR IDs |
| `shimmer` | ^3.0.0 | Loading skeleton animations |
| `pdf` | ^3.10.6 | PDF report generation |
| `printing` | ^5.12.0 | Print PDF to device printer |
| `path_provider` | ^2.1.2 | Local file system access |
| `url_launcher` | ^6.3.1 | Open URLs in browser |
| `fluttertoast` | ^8.2.4 | Toast notifications |

---

## ⚙️ Prerequisites & Setup

### Requirements
- **Flutter SDK**: 3.x (Dart SDK ^3.9.2)
- **Android Studio** or **VS Code** with Flutter extension
- **Android device** or emulator (min SDK 21 / Android 5.0)
- **Firebase Project** with Firestore enabled

### Step 1 — Get dependencies
```bash
flutter pub get
```

### Step 2 — Configure Firebase
Place your `google-services.json` file in:
```
android/app/google-services.json
```

Get this file from the **Firebase Console → Project Settings → Your Apps → Android App**.

### Step 3 — Generate launcher icons
```bash
flutter pub run flutter_launcher_icons
```

---

## ▶️ Running the App

### Run on connected Android device or emulator
```bash
flutter run
```

### Run in release mode (for performance testing)
```bash
flutter run --release
```

### Check for issues
```bash
flutter doctor
flutter analyze
```

---

## 📦 Building the APK

### Debug APK (for testing)
```bash
flutter build apk --debug
```
Output: `build/app/outputs/flutter-apk/app-debug.apk`

### Release APK (for distribution)
```bash
flutter build apk --release
```
Output: `build/app/outputs/flutter-apk/app-release.apk`

### Install directly to connected device
```bash
flutter install
```

---

## 🔥 Firebase Configuration

### Required Firestore Collections

| Collection | Used By | Purpose |
|-----------|---------|---------|
| `yarnRolls` | Read/Write | Primary roll registry |
| `inventory` | Read/Write | Active stock lookup |
| `reserved_collection` | Read | Reserved rolls to be picked |
| `picking_collection` | Read/Write | Rolls in PICKED state |
| `deliveries` | Write | Dispatched roll records |
| `racks` | Read/Write | Rack structure |
| `bins` | Read/Write | Bin structure and rack links |
| `config/inventory_rules` | Read | Auto-allocation rules |
| `scanHistory` | Write | Audit log |

### Auto-Allocation Rules (Firestore Config)
In `config/inventory_rules` document, set:
```json
{
  "bin_capacity": 10,
  "max_bin_weight": 500.0,
  "max_bins": 50
}
```
These control how many rolls/weight per bin before the system moves to the next available bin.

---

## 📁 Directory Structure

```
Yarn-Manager-Mobile-App/
│
├── lib/
│   ├── main.dart                   # App entry point, routes, theme
│   │
│   ├── pages/
│   │   ├── welcome_page.dart       # Animated splash/landing screen
│   │   ├── main_page.dart          # Home screen with 3 action cards
│   │   ├── reserved_list_page.dart # Reserved rolls list + pick flow
│   │   ├── dispatch_list_page.dart # Dispatch list + verify/dispatch flow
│   │   ├── qr_code.dart            # QR camera scanner (add & verify modes)
│   │   ├── yarn_detail_page.dart   # Full roll detail view + actions
│   │   └── settings_page.dart      # App settings
│   │
│   └── services/
│       └── yarn_service.dart       # Firebase CRUD, auto-allocation logic
│
├── assets/
│   └── icon/
│       └── app_icon.png            # App launcher icon
│
├── android/                        # Android build configuration
├── pubspec.yaml                    # Flutter dependencies
└── analysis_options.yaml           # Dart lint rules
```

---

## 🤝 Related Projects

| Project | Technology | Role |
|---------|-----------|------|
| **This App** | Flutter/Dart | Warehouse floor QR scanning & dispatch |
| **Yarn-Tracker-Desktop-App** | Python + Node.js | Desktop admin & inventory management |
| **Firebase Firestore** | Google Cloud | Shared real-time database between both apps |

Both apps connect to the **same Firebase project** — rolls registered on the desktop appear instantly in this app, and picks/dispatches made here update the desktop in real-time.

---

*Built for S.A. Textiles — Smart Yarn Inventory with QR Intelligence*
