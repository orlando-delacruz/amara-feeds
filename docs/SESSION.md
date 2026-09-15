# SESSION.md — Session Context (for a new chat session)

This file captures the summarized context of the session that built the work described below. Use it to orient a new chat session without re-explaining the project.

## 1. Objective

- **Project:** ZAF ONE — a business management web application for the **Amara and Zeann** two-store business, mobile-primary.
- **Scope:** frontend-only for now; a centralized in-memory mock data layer stands in for the backend. No Supabase/database yet (Phase 4+).
- **Agreed constraints:** ₱10,000 budget for the initial/core version; target completion September 30, 2026; scope limited to the core version in `docs/PROJECT.md` and `docs/REQUIREMENTS.md`.

## 2. Important Details

### Stack
- React 19, Vite 8, TypeScript ~6.0, styled-components 6, react-router-dom 7, Vitest 5 + React Testing Library, npm, Node ≥20.
- Path alias `@` → `src`. `write-excel-file@4` (browser build) for Excel export. `jspdf`/`jspdf-autotable` were removed (superseded by Excel).

### Architecture & Rules
- SPA with mock services over a centralized in-memory DB: `src/services/mocks/db.ts`, seeded by `src/services/mocks/seed.ts`. The service layer is the only mutation entry point.
- Follow `AGENTS.md` operating rules; docs under `docs/` are the source of truth (see ownership table in `AGENTS.md`). Use the status vocabulary from `TEMPLATE-GUIDE.md` (Confirmed / Conditional / Confirmation Required / Reference-Only).

### Branding
- Product/system name: **ZAF ONE** (renamed from "Amara + Zeann Store Management System" / on-screen "Amara Feeds", DEC-028). Package name `zaf-one`; localStorage keys `zaf-one.session.v1`, `zaf-one:history:last-seen`; Excel filename `zaf-one-report-*`.
- Official logo: `src/assets/logo-clear.png` (2000×1414, transparent, reads "AQUATIC FEEDS" / "ZEANN FEEDS SUPPLY"). Shown full on the sign-in page; a **derived simplified mark** `src/assets/logo-mark.svg` (navy circle + cyan fish) is used in the header and as `public/favicon.svg`. The small mark is a placeholder — swap when the business supplies a proper asset.
- Store names **Amara** and **Zeann** are unchanged and are separate from the brand.

### Sale model (DEC-023)
- `Sale`/`NewSaleInput` fields: `saleDate` (YYYY-MM-DD, defaults today, backdatable; **credit due dates derive from it**), `paymentMethod` (Cash / GCash / Maya / Bank Transfer / Check / Other with free-text), `discountMinor`.
- `totalMinor = items + delivery fee − discount`. `createSale` validates discount (0 ≤ discount ≤ items+fee), non-blank payment method, and sale-date format.
- `dashboardService` filters use `sale.saleDate`; `auditService` uses `sale.createdAt`.
- `listSales` filter supports `{ storeId, date, from, to, customerId }`.

### Theme (DEC-029, logo palette)
- Brand navy `#013c68` / hover `#002b4c`; accent `#0184b2`; aqua `#4ed1f9`; slate `#515b74`; light slate `#929eb6`; light gray `#cdcdcd`; white `#ffffff`.
- Surfaces: page `#f4f7fa`, card `#ffffff`, subtle `#eef2f5`. Text: primary `#013c68`, secondary `#515b74`, muted `#6b7590`, inverse `#ffffff`. Shadows are cool-navy based.
- **Status colors kept semantic** (success/warning/danger/info) — the palette has no red/amber. Store solids: Amara `#016a91`, Zeann `#515b74` (AA-safe with white text).

## 3. Work Completed in This Session

All items below are implemented and covered by tests (verification baseline in §4).

### Sale checkout + reports + history (DEC-023, DEC-024, DEC-025, DEC-026)
- Checkout captures sale date (backdatable; drives credit due dates), mode of payment, and optional discount; catalog quantity is a manual number input.
- Staff dashboard drops the monthly sales card.
- Reports are **admin-only**; Excel export of the day's sale lines via `write-excel-file` (supersedes the jsPDF PDF export, DEC-020). Excel header text is white on navy (`textColor`, not `color`).
- Reports support a **From/To date range**; new range queries (`getSalesByStoreInRange`, `getOverallSalesInRange`, range filters on payments/received) and a Reports-only `useReportSummaries` seam.
- Reports page includes a **"Sales by mode of payment"** section; Excel adds a **Mode of Payment** column (kept the Cash/Charge "Type" column).
- History shows an unread badge (side nav + More page) until opened, and has an **admin-only store filter** (All stores / Amara / Zeann); business-wide events (product approvals) appear only under All stores.

### Rider & Vehicle full CRUD (DEC-027)
- `updateRider`/`updateVehicle` (rename + active) and `deleteRider`/`deleteVehicle`. Delete is **refused with a conflict error** if the entry is referenced by any sale, receiving, or expense — deactivate instead. Edit dialogs + ConfirmDialog delete.

### Sales catalog (third batch)
- `NewSalePage`: **search filter** (case-insensitive name) + **alphabetical sort** + empty state.

### Customers (third + later batches)
- `Customer.address` added to domain/service; `AddCustomerDialog` (shared by the Customers page and sales/cart) includes an **Address input**.
- `CustomerListPage` shows an Address column; seed customers (`cust-1..3`) have mock addresses.
- In sales/cart, **selecting an existing customer auto-shows their address** in a read-only **Address input field**; adding a new customer with an address in the cart appears automatically on the Customers page (shared mock DB).

### Brand rename (DEC-028) + logo/theme (DEC-029)
- Renamed brand/project to **ZAF ONE** across UI, package, storage keys, filename, docs, and tests.
- Adopted the official logo (sign-in: full badge, centered, aspect preserved; header/favicon: derived simplified mark) and recolored the whole token theme to the logo palette.

### This session also fixed
- Pre-existing AuditTrailPage test bug (duplicate-text assertion) — History tests now pass.
- Sign-in logo alignment/positioning (was forced into a 104×104 square; now 144px wide, `height: auto`, centered in its container).

## 4. Verification Baseline

- `typecheck`, `format:check`, `build` all pass.
- `lint`: exactly **1 pre-existing error** — `src/components/ui/DatePicker.tsx:317` (`react-hooks/set-state-in-effect`). Do not treat it as a new regression.
- `test:run`: **208 passed / 212**, with **4 pre-existing failures**: `DatePicker.test.tsx` ×3 and `SaleListPage.test.tsx` ×1 (confirmed on a pristine `develop`).
- Flake note: `SignInPage.test.tsx` and `SaleCartPage.test.tsx` occasionally fail under full parallel runs but pass in isolation / on re-run.

## 5. Next Steps / Open Items

- **Phase 3** (frontend workflow validation gate) is next; database work (Supabase/auth/persistence) is Phase 4+.
- Confirmation Required: exact report columns/formats; exact payment-method vocabulary and discount policy; exact customer fields beyond name/contact/address; the derived small logo mark (replaceable placeholder).
- The official badge PNG is ~2.4 MB and loads only on the sign-in page; an optimized copy is desirable later.

## 6. Relevant Files (navigation map)

- Domain: `src/domain/` (sale, customer, rider, vehicle, dashboard, payment, audit, store).
- Mock data: `src/services/mocks/db.ts`, `src/services/mocks/seed.ts`.
- Services: `src/services/` — saleService (createSale/listSales), creditService (due dates), dashboardService (summaries, payment-method grouping), customerService (address), riderService/vehicleService (CRUD + delete guard), auditService (history, store filter), paymentService.
- Sales: `src/features/sales/` — NewSalePage (catalog search/sort), SaleCartPage (checkout, customer address), BasketFab, cart context/provider.
- Customers: `src/features/customers/` — CustomerListPage, AddCustomerDialog.
- Delivery: `src/features/delivery/` — RidersPage, VehiclesPage, Edit dialogs.
- Reports: `src/features/reports/` — ReportsPage (From/To), SummarySections, reportRows, useReportSummaries; `src/lib/exportReportExcel.ts`.
- History: `src/features/history/` — AuditTrailPage, historySeen, useHistoryUnread.
- Session/brand: `src/features/session/` — SignInPage, sessionStorage; `src/components/navigation/TopBar.tsx`.
- Theme: `src/theme/tokens.ts`, `src/theme/GlobalStyle.ts`; `src/assets/` (logo-clear.png, logo-mark.svg); `public/favicon.svg`.
- Tests: co-located `*.test.ts(x)` per module; render helper `src/test/render.tsx`.

## 7. Recent Decision Register (one-liners)

| ID | Title | Status |
| --- | --- | --- |
| DEC-020 | Report PDF export with jsPDF | Superseded by DEC-024 |
| DEC-021 | Add-to-cart split of the sale entry flow | Accepted |
| DEC-022 | Shopee-style catalog, automatic pricing, floating basket | Accepted |
| DEC-023 | Sale checkout additions and manual quantity input | Accepted |
| DEC-024 | Admin-only reports with Excel export | Accepted |
| DEC-025 | Staff dashboard trim, history unread badge, admin customer add | Accepted |
| DEC-026 | Report date range and History store filter | Accepted |
| DEC-027 | Rider and vehicle full CRUD with reference guard | Accepted |
| DEC-028 | Rename brand and project to ZAF ONE | Accepted |
| DEC-029 | Adopt official logo and recolor theme to the logo palette | Accepted (supersedes DEC-019's palette) |

Full records and governance in `docs/DECISIONS.md`.