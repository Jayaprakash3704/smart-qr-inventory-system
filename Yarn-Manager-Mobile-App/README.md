# 📱 ScanTrack — Mobile App

> **ScanTrack** | QR-powered Inventory Management for Android

A Flutter mobile application for **warehouse floor staff** to scan QR codes, manage item reservations, verify and dispatch items — all synced in real-time with Firebase Firestore.

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

---

## 🎯 What This App Does

The **ScanTrack Mobile App** is the **warehouse floor tool** used by workers to physically handle items. It works together with the Desktop App — the desktop admin registers items and approves orders, and the mobile app is used on the ground to:

- **Scan QR codes** on items to identify them instantly
- **Add items** from scanned QR codes into the system inventory
- **Pick reserved items** from shelves (Pick List)
- **Verify and dispatch** items to customers (Dispatch List)
- **View full details** of any item (description, weight, lot, rack, bin, status)
- **Print PDF reports** for individual items

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
  │  1. Pick List                       │
  │  2. Dispatch List                   │
  │  3. Add Item (Scan QR)              │
  └─────────────────────────────────────┘
      │
      ├──► [Pick List]
      │       │
      │       ▼
      │    Load reserved items from Firebase
      │    Scan item QR → verify match → confirm pick
      │    Item state: RESERVED → PICKED
      │
      ├──► [Dispatch List]
      │       │
      │       ▼
      │    Load picked items ready for dispatch
      │    Scan QR → verify → confirm dispatch
      │    Item state: PICKED → DISPATCHED
      │
      └──► [Add Item]
              │
              ▼
           Scan QR on physical item
           → View item details
           → Assign Rack & Bin (auto or manual)
           → Confirm → Item added to inventory as IN STOCK
```

---

## 📄 Screens & Features

### 1. 🌟 Welcome Screen
Animated splash/landing screen.

- Animated app logo
- Fade-in title: **"ScanTrack"**
- Glowing animated **"Get Started"** button
- Navigates to Home on tap

---

### 2. 🏠 Home Screen
The main menu with 3 large action cards.

| Card | Action | Icon |
|------|--------|------|
| **Pick List** | Pick reserved items from shelves | 📦 Inventory |
| **Dispatch List** | Verify and dispatch picked items | 🚚 Shipping |
| **Add Item** | Scan QR to add new item to stock | 📷 QR Scanner |

---

### 3. 📋 Pick List 
View all items **reserved** for approved orders.

**How it works:**
1. Loads all reserved items from Firebase
2. Each item shows: Item ID, Description, Weight, Rack, Bin, Order ID
3. Tap an item → opens **QR Scanner** to scan and verify the physical item
4. Scanner checks that scanned QR matches the expected item ID
5. On match → item is confirmed as **PICKED** (state updated in Firebase)

---

### 4. 🚚 Dispatch List 
View all items in **PICKED** state, ready to be dispatched.

**How it works:**
1. Loads all picked items from Firebase
2. Staff physically moves items to dispatch area
3. Tap item → scan QR to verify → confirm dispatch
4. On confirm → item state changes to **DISPATCHED**

---

### 5. 📷 QR Scanner
The camera-based QR scanner used across the app.

**Two modes:**
- **Add Mode**: Scan a new item QR to add it to inventory
- **Verify Mode**: Scan to verify an item matches expected ID

---

### 6. 📦 Item Detail Page 
Full details for a scanned item.

**Shown fields:**
| Field | Description |
|-------|-------------|
| Item ID | Unique identifier |
| Description | Item name |
| Weight | In kilograms |
| Lot Number | Batch lot code |
| Order ID | Associated order |
| State | IN STOCK / RESERVED / PICKED / DISPATCHED |
| Rack / Bin | Physical location in warehouse |

---

## 🚀 How to Use — Complete Workflow

### Adding a New Item

1. Open app → tap **"Add Item"**
2. Camera opens → point at the QR code label on the physical item
3. QR scans automatically → **Item Detail Page** opens
4. Review the item details
5. Set **Rack** and **Bin**
6. Tap **"Add to Inventory"**
7. Item is saved in Firebase as **IN STOCK** ✅

> 💡 QR codes are printed from the Desktop App. Always scan the QR printed by the desktop, not an arbitrary QR.

---

### Picking a Reserved Item (Floor Staff Workflow)

1. The desktop admin approves a customer order
2. Open app → tap **"Pick List"**
3. A list of items needed for pending orders is shown
4. Go to the physical rack/bin location shown on screen
5. Tap the item entry → camera opens
6. Scan the QR on the physical item
7. App verifies it matches → tap **"Confirm Pick"**
8. Item state changes to **PICKED** ✅

---

### Dispatching Items (Verification Before Shipping)

1. Open app → tap **"Dispatch List"**
2. All PICKED items ready for dispatch are listed
3. For each item, tap → scan QR → verify identity
4. Tap **"Confirm Dispatch"**
5. Item moves to **DISPATCHED** state ✅

---

## 🛠 Tech Stack

| Package | Version | Purpose |
|---------|---------|---------|
| `flutter` | SDK | UI framework |
| `mobile_scanner` | ^6.0.7 | Camera QR code scanning |
| `firebase_core` | ^4.3.0 | Firebase SDK initialization |
| `cloud_firestore` | ^6.1.1 | Real-time Firestore database |
| `shimmer` | ^3.0.0 | Loading skeleton animations |
| `pdf` | ^3.10.6 | PDF report generation |

---

## ⚙️ Prerequisites & Setup

### Requirements
- **Flutter SDK**: 3.x
- **Android Studio** or **VS Code** with Flutter extension
- **Firebase Project** with Firestore enabled

### Step 1 — Get dependencies
```bash
flutter pub get
```

### Step 2 — Configure Firebase
Place your `google-services.json` file in `android/app/google-services.json`.

---

## ▶️ Running the App

### Run on connected Android device or emulator
```bash
flutter run
```

---

## 📦 Building the APK

### Release APK (for distribution)
```bash
flutter build apk --release
```

---

*Built for Modern Warehouses — Smart Inventory with QR Intelligence*
