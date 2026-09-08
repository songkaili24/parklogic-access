# Changelog

All notable changes to ParkLogic are documented here. Dates are the release
cut dates; versions follow 0.x while the platform is pre-GA.

## v0.3.0 — 2026-09-08

Hardware monitoring, violations enforcement, billing, and production polish.

### Added

- **Hardware page** (`/hardware`): fleet health for gate controllers, ANPR
  cameras, sensor hubs, pay stations, and kiosks — uptime, firmware, last
  maintenance, error log, and a two-phase reboot command dialog with
  automatic recovery in the live store.
- **Violations page** (`/violations`): citations with ANPR evidence
  placeholders, appeal intake (minimum 50-character statement plus validated
  photo upload), and enforcement-desk resolution (uphold / dismiss / paid).
- **Billing page** (`/billing`): permit-holder invoicing by period with
  payment status tracking, late-fee line items, CSV receipt downloads, and a
  generate dialog gated on company-domain email validation.
- **Micro-interactions**: one-shot status pulse on bays that change state,
  QR reveal animation on visitor passes, slide-in for new access-log
  entries, glow on actively charging stations, and skeleton loaders during
  the dashboard handshake. All animations collapse to static states under
  `prefers-reduced-motion: reduce`.
- **Form edge cases**: duplicate-plate guard for same-day visitor
  pre-registration, driver-license scan validation, company-email
  enforcement on permit applications, and mandatory vehicle-registration
  document upload.

## v0.2.0 — 2026-09-02

Parking grid, visitor management, and EV charging operations.

### Added

- **Parking grid** (`/parking`): 120-bay visualization across three levels
  with zone fieldsets, status legend, cross-level search (bay / plate /
  holder), permit-type and vehicle-class filters, roving keyboard
  navigation, and a bay detail panel with permit holder, dwell time, and
  30-day usage history.
- **Visitor management** (`/visitors`): pass issuing with validated plates
  and duration presets, expected-arrival pre-registration with host
  notification, bulk event pass generation (2–20), QR pass printing via a
  print-only stylesheet, and the check-in/check-out history log.
- **EV charging** (`/ev`): OCPP station board with charger types and fault
  states, live session table with running cost, editable pricing (L2/DCFC
  $/kWh, session and idle fees), and a maintenance queue with resolve flow.
- **Live store expansion**: gate ANPR reads stream into `/logs`, charging
  sessions advance and complete on the tick, and operator mutators journal
  into the activity feed.

## v0.1.0 — 2026-08-25

Foundation, operational theme, and navigation shell.

### Added

- Next.js 14 App Router scaffold with TypeScript strict mode, Tailwind
  operational palette (control surfaces + status signal colors), ESLint,
  and Prettier.
- Component library: Button (primary/secondary/outline/quick-action),
  Badge, ParkingSpotCell, StatCard, VisitorPassCard with QR placeholder,
  TimePicker, LicensePlateInput, AlertBanner, GarageMapPlaceholder, and
  ActivityLog.
- Global layout: top status bar (property selector, live occupancy meter,
  connection badge, alert bell), sidebar navigation, mobile bottom tabs,
  and the alert strip.
- `RealtimeProvider` seam: simulated gate/sensor event stream behind a
  `connecting → syncing → connected` handshake, ready for a WebSocket
  swap-in without component changes.
- Live dashboard, parking allocations, permits registry, access logs, and
  reports pages with seeded Meridian Tower data.
