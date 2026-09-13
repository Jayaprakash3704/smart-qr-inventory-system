# Sudhan Textile ERP - Technical Stack & Features

## 💻 Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Library**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: Radix UI (Headless UI components)
- **Icons**: Lucide Icons
- **HTTP Client**: Axios (via custom `apiClient` wrapper)
- **State Management**: React Context, React Query (via QueryClient)

### Backend
- **Framework**: ASP.NET Core (.NET 10 / C#)
- **ORM**: Entity Framework Core 8
- **Micro-ORM**: Dapper (for high-performance queries)
- **Architecture**: N-Tier (Controllers, Services, DTOs, Entities)
- **Authentication**: JWT (JSON Web Tokens) with Role-Based Access Control (RBAC)

### Database
- **Development**: SQLite
- **Production**: MySQL / SQL Server
- **Migration Strategy**: EF Core Migrations with automated SQL scripts for robust scheme management

---

## 📦 Modules & Features

The ERP handles end-to-end textile production logging, inventory management, user security, and enterprise reporting. Here is the comprehensive breakdown of its modules and features:

### 1. Sizing Module
The core production pipeline managing yarn sizing, warping, and invoicing.
- **Sizing Job Card**: Create, track, and approve job cards with multi-step authorization (Draft → Prepared → Checked → GM Approved → Authorized → Completed → Invoiced).
- **Warping Job Card**: Manage warping operations and record outputs.
- **Yarn Management**: 
  - Yarn Receipt
  - Yarn Delivery
  - Yarn Return
  - Yarn Stock overview
- **Beam Management**: Track input and output beams.
- **Baby Cone**: Manage baby cone workflows.
- **Invoices**: Tax invoice generation directly mapping to authorized sizing job cards.
- **Sizing Reports**: Domain-specific analytics.

### 2. Master Data Management
Centralized repositories to maintain static & reusable system records.
- **Parties**: Manage customers, vendors, and partners.
- **Yarn Counts**: Manage standard yarn metrics.
- **Loom Types**: Loom dimensions and configurations.
- **Beams**: Master inventory of beams.
- **Vehicles**: Fleet and transport tracking.
- **Company**: Global enterprise details.
- **Financial Years**: Fiscal year configurations.
- **Document Series**: Automated numbering paradigms for invoices/receipts.

### 3. Settings & Security (RBAC)
Enterprise-grade system administration & access control.
- **Users & Roles**: Define customized user roles, permissions, and accounts.
- **Security & Admin**: Advanced security features like token validation, auto-session termination, and protected route wrappers.
- **Audit Logs**: Comprehensive tracking of created, modified, or deleted records.
- **Approval Matrix**: Configure multi-level approval workflows (e.g. GM, Checker, Preparer).
- **System & Backup**: Application rules, backup strategies, and global presets.

### 4. Reports & Analytics
Comprehensive cross-module data extraction and visualization.
- **Beam Utilization**: Deep dive into beam usage & availability.
- **Set Production**: Track yields across manufacturing settings.
- **Yarn Stock**: Historic and predictive yarn inventory trends.
- **Invoice Register**: Detailed tax, subtotal, and ledger exports.
- **Party Ledger**: Financial records segmented by party.
- **Pending Invoices**: Accounts receivable tracking for pending shipments.

### 5. Other Integrated Modules (Future/Extended scope)
- **Spinning**: Operations prior to weaving/sizing.
- **Weaving**: Primary structural phase tracking.
- **Processing**: Post-weaving treatments and processes.
- **Garments**: End-product tailoring/tracking.
- **Inventory**: Global stock beyond yarn (spares, maintenance equipment).
- **Accounts**: Internal accounting extensions.
- **Notifications**: Automated intra-system alerts across approval workflows.
