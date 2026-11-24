# full-Stack_Project
Welcome to **FleetDrive **, the complete, professional, real-world vehicle rental and fleet business management application built using **FRONTEND TECHNOLOGIES ONLY** (HTML5, CSS3, Vanilla JavaScript, LocalStorage, and Browser APIs).

FleetDrive delivers a zero-backend, zero-dependency, production-grade operational suite designed to manage vehicle inventory, verified customer KYC records, conflict-free bookings, vehicle dispatches, on-road returns with automatic late-fee calculations, maintenance workflows, invoice payments, and printable receipts—backed by an immutable audit trail and comprehensive JSON/CSV data backup & restore capabilities.

---

## 👥 Four-Member Architecture & Shared Layer

FleetDrive preserves the modular four-member team structure while introducing a centralized, single-source-of-truth data management and UI layer under `common/`:

```
FleetDrive-Functional/
├── common/
│   ├── data-manager.js        # Centralized Single Source of Truth (`window.FleetData`)
│   └── ui-components.js       # Reusable Toasts, Modals, Printable Receipts, Backup UI (`window.FleetUI`)
├── css/
│   └── style.css              # Unified theme variables, components, responsive grid & @media print
├── images/                    # Fleet vehicle imagery & logos
├── Member-1-Home/
│   ├── index.html             # 10 Dynamic Metric Cards, Return Monitoring, Feeds & Featured Catalog
│   └── home.js                # Live Dashboard Controller & Global Activity Filter
├── Member-2-Vehicles-Customers/
│   ├── vehicles.html          # 45-Vehicle Fleet Catalog, Category Tabs & Add Vehicle Modal
│   ├── customers.html         # Verified Driver Profiles, 10-digit Indian Mobile Validation & Rental History
│   ├── suvs.html              # Dedicated SUV & 4x4 Fleet (14 Vehicles)
│   ├── sedans.html            # Dedicated Luxury & Executive Sedans (12 Vehicles)
│   ├── hatchbacks.html        # Dedicated Economy City Hatchbacks (11 Vehicles)
│   ├── two-wheelers.html      # Dedicated Cruisers & Commuter Bikes (8 Vehicles)
│   └── vehicles.js            # Vehicle Add/Edit/Archive, Specs Dossier & Customer Management
├── Member-3-Bookings-Rentals/
│   ├── bookings.html          # Reservation Engine, Fare Breakdown, Date Conflict Detection
│   ├── rentals.html           # Handover Gate, Dispatch Odometer Inspection & Return Workflow
│   └── bookings.js            # Strict 2-State Booking Controller & Late Fee Return Engine
├── Member-4-Maintenance-Payments/
│   ├── payments.html          # Booking-ID Payment Verification & Printable Receipt Generator
│   ├── maintenance.html       # Workshop Scheduling, Defect Tracking & Availability Locking
│   └── operations.js          # Payment Confirmation Bridge & Service Transitions
├── test_workflows.js          # Automated 12-Suite End-to-End Test Harness
├── index.html                 # Root Auto-Redirect to Member-1-Home
└── README.md                  # Comprehensive Documentation & Run Guide
```

---

## 🔑 Key Engineering Innovations in 

### 1. Centralized Single Source of Truth (`window.FleetData`)
- All modules query and update one centralized data engine (`fleetdrive_v3_master_data`).
- **Never trusts static status strings**: `FleetData.calculateVehicleStatus()` computes vehicle availability dynamically by cross-referencing active maintenance, on-road dispatches, and confirmed reservations.
- **Date Conflict Prevention**: `FleetData.checkVehicleAvailabilityForDates()` checks maintenance schedules and overlapping booking dates (`!(b.ret < pickup || b.pickup > ret)`), blocking double-booking of any vehicle.
- **Cross-Tab Real-Time Sync**: Open multiple browser tabs side-by-side. Updating a record in one tab instantly broadcasts `storage` events and `fleetdrive:data-changed` events, immediately refreshing all open tabs without a manual page reload.
- **Automated V2 Migration**: Existing `fleetdrive_records_v2` data is automatically detected and migrated seamlessly without data loss.

### 2. Strict 2-State Booking Invariant
- **Strictly Two Statuses**:
  - `Pending Payment` (Orange Pill)
  - `Confirmed` (Green Pill)
- On creation, any reservation is strictly initialized as **Pending Payment**.
- **Payment confirmation is the SOLE action** that activates **Confirmed** status.
- Statuses like `Cancelled` or `Returned` do not exist in the Booking module.
- Completing a vehicle return or finishing maintenance **never alters or overwrites the booking status**.

### 3. Vehicle Handover Authorization Gate
- On `rentals.html`, entering a Booking ID automatically looks up customer and vehicle information.
- **Handover Gate Rule**: Handover is strictly locked if booking status is `Pending Payment` or if the vehicle is currently undergoing maintenance.
- Once payment is confirmed, handover is authorized. Dispatch records handover odometer, fuel level, and security deposit, updating vehicle status to **Rented** ("On Road").

### 4. Vehicle Return Workflow & Automatic Late Fees
- Enter Booking ID or Rental ID to pull up active on-road vehicles.
- Allows recording `actualReturnDate`, final odometer reading, fuel inspection, and deposit refund status.
- **Automated Late Fee Calculation**: If `actualReturnDate > scheduledReturnDate`, the system calculates late days and applies standard penalty (`1.5x` daily rate per overdue day).
- Finalizing return sets rental status to `Returned` and immediately restores vehicle availability to `Available`.

### 5. Maintenance Lifecycle & Availability Locking
- Schedule servicing, repairs, and diagnostics.
- Marking maintenance **In Progress** locks the vehicle as **Under Maintenance**, preventing new bookings and blocking rental dispatches.
- Marking maintenance **Completed** restores vehicle availability (unless on an active dispatch).
- Allows editing existing service records directly without creating duplicate entries.

### 6. Vehicle Dossier, Insurance Expiry Tracking & Add Vehicle Modal
- Catalog of all 45 vehicles categorized into SUVs, Sedans, Hatchbacks, and Two-Wheelers.
- Add new vehicles with unique Indian registration plate enforcement (`UP-85-XX-XXXX`) and positive daily rate validation.
- Vehicle Dossier modal displays complete specifications, operational history, and **Insurance / RC Registration expiry badges** (with warning alerts if expiring within 30 days).
- Archive / Unarchive vehicles safely.

### 7. Customer KYC & Rental History Profiles
- Register driver profiles with 10-digit Indian mobile number validation (`/^[6-9]\d{9}$/`), unique email checks, and driving license records.
- "History" modal allows viewing the complete reservation and dispatch trail for any customer profile.

### 8. Printable Payment Receipts (`@media print`)
- Confirming payment generates a professional, printable Tax Invoice Receipt with vehicle details, GST breakdown, UTR transaction reference, timestamp, and print stylesheet.

### 9. JSON Backup / Restore & CSV Data Export
- Export complete database as a timestamped, versioned JSON backup (`FleetDrive_Backup_YYYY-MM-DD.json`).
- Restore database from JSON with structural integrity validation and automatic pre-restore emergency snapshot.
- One-click CSV exports for Bookings, Payments, Rentals, Vehicles, Customers, and Maintenance.

### 10. Light & Dark Mode Engine + Full Mobile Responsiveness
- Automatically detects device preference via `prefers-color-scheme`.
- Top-right toggle button (`🌙 Dark` / `☀️ Light`) on every page with LocalStorage persistence and cross-tab synchronization.
- Fully responsive across mobile (320px+), tablet, and desktop with off-canvas hamburger navigation and horizontal table scrolling.

---

## 🧪 Automated Verification Suite

FleetDrive  includes a comprehensive 12-suite automated test harness (`test_workflows.js`) testing all business logic and invariants end-to-end:

```bash
node test_workflows.js
```

### Test Suite Execution Output:
```
=======================================================
   FLEETDRIVE COMPREHENSIVE VERIFICATION SUITE      
=======================================================

--- TEST SUITE 1: Single Source of Truth & Initialization ---
✔ Test 1.1: Master data initialized with 45 vehicles & synced to V2 key.

--- TEST SUITE 2: Vehicle Management & Uniqueness ---
✔ Test 2.1: Vehicle uniqueness enforced & new vehicle VH-46 saved.

--- TEST SUITE 3: Customer Registration & Validation ---
✔ Test 3.1: Customer validation enforced & customer CUST-xxxxxxxxx registered.

--- TEST SUITE 4: Booking Logic (Pending Payment & Confirmed) ---
✔ Test 4.1: Booking BK-xxxxxxxxx created with strict 'Pending Payment' status.
✔ Test 4.2: Date overlap conflict successfully detected and blocked.

--- TEST SUITE 5: Payment Confirmation & Booking Status Activation ---
✔ Test 5.1: Payment PAY-xxxxxxxxx confirmed. Booking transitioned to Confirmed.
✔ Test 5.2: Duplicate payment confirmation blocked.

--- TEST SUITE 6: Handover Authorization Gate ---
✔ Test 6.1: Handover gate successfully blocked unpaid reservation.
✔ Test 6.2: Confirmed booking dispatched as Rental. Vehicle status is Rented (On Road).

--- TEST SUITE 7: Vehicle Return & Late Fees ---
✔ Test 7.1: Rental returned with late fee. Vehicle is Available. Booking status remains Confirmed.

--- TEST SUITE 8: Maintenance Lifecycle & Availability Locking ---
✔ Test 8.1: Maintenance locked vehicle as 'Under Maintenance'. New booking blocked.
✔ Test 8.2: Maintenance marked Completed. Vehicle availability restored.

--- TEST SUITE 9: Backup JSON Export & Import ---
✔ Test 9.1: JSON Backup export and validation/import verified.

--- TEST SUITE 10: CSV Export Engine ---
✔ Test 10.1: CSV exports for all business modules verified.

--- TEST SUITE 11: Dynamic Dashboard Metrics Calculation ---
✔ Test 11.1: System metrics verified: Vehicles=46, Available=41, Bookings=9, Revenue=Rs. 67,410.

--- TEST SUITE 12: HTML Pages Integrity & Script References ---
✔ Test 12.1: All 11 HTML files verified with common data-manager & ui-components scripts.

=======================================================
   ALL 12 TEST SUITES PASSED (100% SUCCESSFUL!)        
=======================================================
```

---

## 💻 How to Run the Application

Because FleetDrive is built purely with **Frontend Technologies**:
1. Open the project folder in **VS Code** (or any text editor).
2. Right-click `index.html` and select **"Open with Live Server"** (or double-click `index.html` in Windows Explorer to open directly in Google Chrome, Microsoft Edge, or Mozilla Firefox).
3. The root `index.html` immediately directs you to the Home Dashboard (`Member-1-Home/index.html`).
4. Open two browser tabs side-by-side to watch live operational updates synchronize across tabs instantaneously without page refreshing!

