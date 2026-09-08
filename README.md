# ParkLogic — Access & Operations

Operational control-room dashboard for commercial-property parking: live bay
status, allocations, visitor passes, EV charging, permit registry, gate and
sensor hardware health, violation enforcement, billing, and access logs.

## Tech stack

- **Next.js 14 (App Router)** · React 18 · TypeScript (strict + `noUncheckedIndexedAccess`)
- **Tailwind CSS** with the operational palette (`control` surfaces, `status` signal colors)
- **ESLint** (`next/core-web-vitals` + `next/typescript`) · **Prettier** (`prettier-plugin-tailwindcss`)
- Fonts: **Chakra Petch** (display/HUD) and **Inter** (body) via `next/font`
- Zero runtime UI dependencies — icons and the QR placeholder are hand-rolled

## Setup

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

## Real-time architecture

All live state flows through a single `RealtimeProvider`
(`src/lib/realtime.tsx`) at the app-shell level. Pages are server components
with metadata; only leaves below the provider are client components.

Today the provider **simulates** the upstream event stream on a 5-second tick
with a `connecting → syncing → connected` handshake, so the UI behaves
exactly like a live feed out of the box. The simulation drives the same
state mutators a real transport would:

- `spots` + `recentlyChanged` — bay occupancy from gate ANPR and ultrasonic
  bay sensors (feeds the grid's state-change pulse)
- `gateEvents` — ANPR reads, denials, and gate holds from lane controllers
- `sessions` — OCPP 2.0.1 charging sessions; kWh accrues per port rating and
  completions release the bay
- `devices` — gate/camera/sensor fleet health with reboot recovery

**Swapping in a WebSocket** means replacing the simulation effect with a
socket subscription that dispatches the same setters (`setSpots`,
`pushActivity`, `setGateEvents`, `setSessions`, …). The component tree, the
seeds, and every page stay untouched. For a production deployment:

1. Terminate WSS at a gateway that publishes per-property channels
   (`property/{id}/spots`, `property/{id}/gate-events`, …).
2. Reconnect with exponential backoff and surface the state through the
   existing `connection` badge (`connecting` / `syncing` / `connected` /
   `offline`).
3. Reconcile on reconnect by replaying the last event id per channel — the
   store already treats every entity as idempotent-by-id.

## Access control security approach

ParkLogic's operating assumption is that **the garage is the security
boundary**, and the dashboard reflects what the hardware reports:

- **ANPR-first identity.** Vehicles are identified by plate at the lane; the
  permit registry (`holders`) and visitor ledger (`passes`) are the only
  sources of authorized plates. Gate events carry the raw read plus the
  grant/deny decision and violation kind, so nothing is trusted implicitly.
- **Deny-by-default enforcement.** Zones carry permit restrictions
  (`zonePermit`); anything not matching the registry or an active visitor
  window is a violation with an ANPR evidence reference.
- **Operator actions are audited.** Every mutator that changes state —
  permit issue, bay hold/release, gate override, reboot, citation
  resolution, invoice generation — writes a journal entry into the activity
  feed with the acting desk (`Control Room`, `Permits Desk`, …).
- **Two-phase destructive commands.** Hardware reboots show the exact CLI
  command and require confirmation; citations require a 50+ character
  statement plus evidence before an appeal is accepted.
- **Server-side hardening (when the API lands).** Sessions for the
  dashboard, per-desk RBAC (control room vs. permits desk vs. billing),
  and request signing on the reboot/billing endpoints. The current mock
  layer keeps all authorization decisions behind the provider seam so the
  transport swap doesn't move the security model.

## Pages

| Route | Purpose |
| --- | --- |
| `/dashboard` | Live KPIs, occupancy gauge with peak prediction, parking grid hero, activity, alerts |
| `/parking` | Allocations, cross-level search/filters, keyboard-navigable grid |
| `/visitors` | Pass issuing, pre-registration, bulk event passes, QR printing, history |
| `/ev` | OCPP charge banks, live sessions, pricing, maintenance queue |
| `/hardware` | Gate/ANPR/sensor fleet health, error log, reboot control |
| `/permits` | Permit registry, renewals, applications, waitlist, CSV export |
| `/billing` | Invoices, payment status, receipts |
| `/violations` | Citations with ANPR evidence, appeals, resolution |
| `/logs` | Gate event tail with filters and violation flagging |
| `/reports` | Occupancy/turnover analytics and scheduled exports |

## Design tokens

| Token | Value | Use |
| --- | --- | --- |
| `control` | `#0F172A` | App background / control displays |
| `control-raised` | `#1E293B` | Panels and cards |
| `status-available` | `#22C55E` | Available bays, live indicators |
| `status-occupied` | `#EF4444` | Occupied, critical alerts |
| `status-reserved` | `#F59E0B` | Reserved holds, warnings |
| `status-charging` | `#3B82F6` | EV charging sessions |

Micro-interactions (bay state pulse, QR reveal, log slide-in, EV glow,
skeleton shimmer) are plain CSS keyframes in `globals.css` and all collapse
to static states under `prefers-reduced-motion: reduce`.

See [CHANGELOG.md](CHANGELOG.md) for release history.
