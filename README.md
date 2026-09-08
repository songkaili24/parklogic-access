# ParkLogic — Access & Operations

Operational control-room dashboard for commercial-property parking: live bay
status, allocations, visitor passes, EV charging, permit registry, and access
logs.

## Stack

- **Next.js 14 (App Router)** · React 18 · TypeScript (strict + `noUncheckedIndexedAccess`)
- **Tailwind CSS** with the operational palette (`control` surfaces, `status` signal colors)
- **ESLint** (`next/core-web-vitals` + `next/typescript`) · **Prettier** (`prettier-plugin-tailwindcss`)
- Fonts: **Chakra Petch** (display/HUD) and **Inter** (body) via `next/font`

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run format     # prettier --write .
```

## Architecture

```
src/
├── app/                        # App Router pages (server components + metadata)
│   ├── page.tsx                # Live Dashboard (hero parking grid, KPIs, feeds)
│   ├── parking/                # Parking Allocations
│   ├── visitors/               # Visitor Management (pass issuing)
│   ├── ev-charging/            # EV Charging Stations
│   ├── permits/                # Permit Holders registry
│   ├── access-logs/            # Access Logs (live tail + filters)
│   └── reports/                # Reports & scheduled exports
├── components/
│   ├── ui/                     # Reusable component library (barrel: index.ts)
│   ├── layout/                 # TopStatusBar, Sidebar, MobileNav, AppShell
│   └── dashboard/              # Page-level composites (grid, feeds, actions)
└── lib/
    ├── realtime.tsx            # RealtimeProvider — WebSocket swap-in seam
    ├── seed.ts                 # Deterministic garage snapshot + event seeds
    ├── types.ts                # Domain model (spots, permits, passes, alerts)
    ├── validation.ts           # License-plate normalization & validation
    └── constants.ts            # Properties, tenants, duration presets
```

### Component library (`@/components/ui`)

| Component                           | Purpose                                                                             |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| `Button`                            | `primary` / `secondary` / `outline` / `quickAction` variants, `href` renders a Link |
| `ParkingSpotCell`                   | One bay in the lot grid; status-driven color, EV sweep animation                    |
| `Badge`                             | Spot statuses and permit types (`tone` union covers both)                           |
| `StatCard` / `StatsRow`             | KPI tiles with live pulse indicator                                                 |
| `VisitorPassCard` + `QrPlaceholder` | Guest pass with deterministic pseudo-QR from the pass code                          |
| `TimePicker`                        | Reservation-duration radio group + custom stepper                                   |
| `LicensePlateInput`                 | Uppercase gate-side plate entry with live validation                                |
| `AlertBanner`                       | `info` / `warning` / `critical` system alerts with acknowledgment                   |
| `GarageMapPlaceholder`              | Level schematic with zone occupancy bars (camera-overlay ready)                     |
| `ActivityLog`                       | Timeline of gate/kiosk/EV events                                                    |

### Realtime seam

All live state flows through `RealtimeProvider` (`src/lib/realtime.tsx`). It
currently **simulates** the gate/spot event stream on a 5-second tick, with a
`connecting → syncing → connected` handshake. To go live, replace the
simulation effect with a WebSocket subscription that drives the same state
mutators (`setSpots`, `pushActivity`, `setAlerts`) — no component changes
required. `ParkingSpotCell` and `ActivityLog` are already purely
status/prop-driven.

### Mobile experience

Below the `md` breakpoint the sidebar becomes a drawer and a bottom tab bar
appears; the dashboard grid stacks to a simplified status overview, and the
Visitor page keeps the pass-issuing form front-and-center for gate-side use.
Alert banners render in a strip under the status bar with one-tap
acknowledgment.

## Design tokens

| Token              | Value     | Use                               |
| ------------------ | --------- | --------------------------------- |
| `control`          | `#0F172A` | App background / control displays |
| `control-raised`   | `#1E293B` | Panels and cards                  |
| `status-available` | `#22C55E` | Available bays, live indicators   |
| `status-occupied`  | `#EF4444` | Occupied, critical alerts         |
| `status-reserved`  | `#F59E0B` | Reserved holds, warnings          |
| `status-charging`  | `#3B82F6` | EV charging sessions              |
