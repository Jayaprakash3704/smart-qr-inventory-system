# 📦 ScanTrack Inventory System v2.0

> **ScanTrack** | End-to-end QR-based Inventory Management

A complete, production-grade inventory system built for modern warehouses. ScanTrack V2 is a completely rebuilt REST-based system comprising a **Flutter mobile app** for warehouse floor staff (QR scanning, stock in/out) and a **React/Node.js web application** for managers and admins. 

Unlike V1 (which relied on Firebase and Desktop UI clients), V2 runs on a centralized **Node.js Express** backend with a unified REST API, perfect for scalable cloud deployments like AWS EC2.

---

## 📦 Projects in this Repository

| Project | Platform | Tech | Role |
|---------|----------|------|------|
| [`ScanTrack-Mobile-App/`](./ScanTrack-Mobile-App/) | Android / iOS | Flutter / Dart | Warehouse floor — QR scanning, real-time stock in/out |
| [`ScanTrack-Desktop-App/`](./ScanTrack-Desktop-App/) | Web / Cloud | Node.js + React | Admin portal & API Server — inventory management, analytics, QR generation |

---

## 🎯 System Purpose

This system solves the problem of **tracking physical items** in a warehouse or store:

1. **Admin (Web Dashboard)** registers items → auto-generates QR codes for printing.
2. **Staff (Mobile App)** scans physical QR labels → instantly processes Stock-In / Stock-Out.
3. **Node.js Cloud Server** keeps everything perfectly synced via REST API.

---

## 🏗 High-Level Architecture

```
┌──────────────────────┐        ┌────────────────────────────┐
│  Mobile App (Flutter)│        │  Web App (React Dashboard) │
│  ─────────────────── │        │  ──────────────────────────│
│  • QR Code Scanner   │        │  • Inventory Dashboard     │
│  • Stock In Form     │        │  • Analytics & Charts      │
│  • Stock Out Form    │        │  • QR Code Generation      │
│  • Live Notifications│        │  • System Settings         │
└──────────┬───────────┘        └────────────┬───────────────┘
           │                                 │
           │       HTTP / REST API           │
           └────────────┬────────────────────┘
                        │
          ┌─────────────▼──────────────┐
          │ Node.js Server (Express)   │
          │ ────────────────────────── │
          │ • API Routes               │
          │ • Business Logic           │
          │ • JSON/SQLite Storage      │
          │ • Serves Web Frontend      │
          └────────────────────────────┘
                        │
                  Deployed on AWS EC2
```

---

## 🔄 Complete System Flow

```
[New Item Arrives]
       │
       ▼
[Web Dashboard: Register Item]
  Admin fills form → Submit
  Auto-generates Item ID
  Downloads QR PNG for printing
       │
       ▼
[State: IN STOCK — visible globally]
       │
       ▼
[Physical Action: Affix QR]
  Admin sticks printed QR code to physical shelf/box
       │
       ▼
[Mobile App: Warehouse Staff action]
  Worker taps "Scan QR"
  Camera scans physical shelf label
       │
       ▼
[Mobile App: Stock Out]
  Worker enters quantity (-10 units)
  App posts to REST API
       │
       ▼
[State: UPDATED — Stock decreases by 10]
  Web Dashboard live charts update instantly.
  If stock drops below threshold, a Low Stock Notification is triggered.
```

---

## 🛠 Tech Stack Overview

| Layer | Mobile App | Web Dashboard | API Server |
|-------|-----------|-------------|------------|
| **Language** | Dart | JavaScript/JSX | JavaScript |
| **Framework** | Flutter | React / Vite | Node.js / Express |
| **Styling** | Material 3 | TailwindCSS | — |
| **Network** | REST (http package) | REST (Axios) | Express Router |
| **QR Handling** | mobile_scanner | — | qrcode (npm) |

---

## 🚀 Quick Start / Deployment

### 1. The Cloud Server (Backend + Web)
The system is designed to be hosted on an Ubuntu server (like AWS EC2).

```bash
cd ScanTrack-Desktop-App/web
npm install
npm run build      # Builds the React frontend into backend/public

cd ../backend
npm install
npm start          # Starts Node.js on port 5000 serving both API & Web
```
*(For production, we recommend using PM2 to keep the server running and Nginx to proxy port 80 to port 5000).*

### 2. The Mobile App
Make sure your server is running and you know its IP address.

1. Create a `.env` file in `ScanTrack-Mobile-App/`:
   ```bash
   API_URL=http://your-ec2-ip:5000/api
   ```
2. Run the app:
   ```bash
   cd ScanTrack-Mobile-App
   flutter pub get
   flutter run
   ```
---

*Built for Modern Warehouses — Smart Inventory with QR Intelligence*
