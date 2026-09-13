# Smart QR Inventory System Architecture

This document describes the system architecture, components, and data flow of the **Smart QR Inventory System**.

---

## 1. High-Level Architecture Diagram

```mermaid
graph TB
    subgraph Clients["Client Layer"]
        MobileApp["Mobile App (Flutter)<br/>- QR Code Scanner<br/>- Dispatch List<br/>- Reserved List<br/>- Yarn Details"]
        DesktopApp["Desktop ERP App (Python/Tkinter)<br/>- Yarn Roll Tracker<br/>- User Manual Generator<br/>- Sync & Report Tools"]
    end

    subgraph Backend["Backend API Layer (Node.js/Express)"]
        Server["Express API Server (server.js)<br/>- REST API Endpoints<br/>- QR Code Generation & Repair<br/>- Sync & Verification Logic"]
    end

    subgraph Storage["Data & Asset Storage"]
        StatesDB[("states.json<br/>Inventory States")]
        TestingQRs[("testing_qrs.json<br/>QR Code Registries")]
        QRCodesDir["public/qrcodes/<br/>Generated QR Images"]
    end

    MobileApp -->|"REST HTTP / JSON APIs"| Server
    DesktopApp -->|"Local File / API Sync"| Server
    Server -->|"Read/Write State"| StatesDB
    Server -->|"Read/Write QR Registry"| TestingQRs
    Server -->|"Save/Serve Images"| QRCodesDir
```

---

## 2. Component Overview

| Component | Technology | Primary Responsibilities |
| :--- | :--- | :--- |
| **Mobile App** | Flutter / Dart | Mobile QR scanner interface, managing dispatch lists, yarn reservations, and detailed roll inspection. |
| **Desktop App** | Python / PyInstaller | Desktop ERP system for yarn roll tracking, report generation, manual creation, and desktop operations. |
| **Backend API** | Node.js / Express | Centralized REST API server for state management, inventory synchronization, and QR code asset management. |
| **Storage Layer** | JSON File Store / Static Assets | Lightweight persistence for inventory states, roll tracking records, and generated QR code image files. |

---

## 3. Data Flow Sequence

### QR Code Scanning & Inventory Dispatch Flow

```mermaid
sequenceDiagram
    autonumber
    actor Operator as Warehouse Operator
    participant Mobile as Mobile App (Flutter)
    participant Server as Backend API (Node.js)
    participant Storage as JSON Storage

    Operator->>Mobile: Scan Yarn Roll QR Code
    Mobile->>Server: GET /api/yarn/:id (Request Yarn Details)
    Server->>Storage: Query states.json & testing_qrs.json
    Storage-->>Server: Return Yarn Roll Data
    Server-->>Mobile: 200 OK (Yarn Metadata & Status)
    Mobile-->>Operator: Display Yarn Details Screen

    Operator->>Mobile: Confirm Dispatch / Reservation
    Mobile->>Server: POST /api/yarn/dispatch (Update Status)
    Server->>Storage: Persist updated state to states.json
    Storage-->>Server: Write Success
    Server-->>Mobile: 200 OK (Dispatch Confirmed)
    Mobile-->>Operator: Show Success Notification
```

---

## 4. Repository Directory Structure

```
smart-qr-inventory-system/
├── README.md
├── ARCHITECTURE.md
├── .gitignore
├── Yarn-Manager-Mobile-App/         # Flutter Mobile Application
│   ├── lib/                         # App pages, widgets, and services
│   ├── android/                     # Android build configuration
│   └── pubspec.yaml                 # Dependencies and assets
└── Yarn-Tracker-Desktop-App - Copy/ # Python Desktop App & Node.js Backend
    ├── app.py                       # Python Desktop GUI Application
    ├── backend/                     # Node.js Express Backend API
    │   ├── server.js                # API server & routes
    │   ├── public/qrcodes/          # Generated QR code image assets
    │   └── states.json              # Inventory state database
    └── requirements.txt             # Python dependencies
```
