# Vehicle Tracker

A React Native (Expo) app for tracking maintenance, fuel, and renewals across
more than one vehicle, with shared household access.

## Stack

- **Expo (managed workflow) + TypeScript**
- **Local persistence: `expo-sqlite`.** Chosen over WatermelonDB for v1
  because the data model is small and relational (a handful of tables, no
  offline-first conflict resolution needed yet) — SQLite's plain SQL is
  simpler to reason about and to eventually mirror in a Postgres-backed
  Supabase schema than WatermelonDB's sync-oriented model layer, which pays
  off once there's real multi-device sync to design for, not before.
- **Navigation:** React Navigation — native-stack (root) + bottom-tabs
  (Dashboard/Settings) + material-top-tabs (vehicle detail's
  Overview/Service/Fuel).
- **State:** Zustand (`src/state/store.ts`) — one small store wrapping the
  repository, no Redux.
- **Data layer:** repository pattern (`src/data/repository.ts` interface,
  `src/data/sqlite/SqliteRepository.ts` implementation). Screens and the
  Zustand store only ever talk to the `Repository` interface, so swapping in
  a Supabase- or Firebase-backed implementation later is a change to
  `src/data/index.ts` alone.

## Getting started

```bash
npm install
npm start        # then press i / a / w, or scan the QR code in Expo Go
```

Mock data (3 vehicles, service history, fuel history) seeds automatically on
first launch (`src/data/seed.ts`) so every screen is testable immediately —
no manual data entry required to explore the app.

## Building an installable app (EAS)

For a real `.apk`/`.ipa` outside Expo Go — e.g. to hand to household members
who'll use the app day-to-day:

```bash
npm install -g eas-cli
eas login
eas init                # links this project to your Expo account, one-time
eas build --platform android --profile preview   # or ios
```

`eas.json` defines three profiles:
- `development` — dev client build, only needed if you outgrow Expo Go
  (custom native modules)
- `preview` — internal-distribution `.apk`, the one to use for testing on
  your own device
- `production` — store-ready build (auto-increments version, no `buildType`
  override so it produces an `.aab` for Play Store submission)

`eas build` runs in Expo's cloud and gives you a QR code / download link for
the finished binary — no local Android Studio or Xcode needed for Android;
iOS still needs an Apple Developer account on file with EAS.

## Project structure

```
App.tsx                        Font loading, NavigationContainer root
src/
  types/models.ts               Vehicle, ServiceLogEntry, FuelLogEntry, Group, GroupMember
  data/
    repository.ts                Storage-agnostic interface
    sqlite/                       SQLite implementation + schema
    seed.ts                       Mock data seeding
    index.ts                      Repository factory (swap point for a future backend)
  state/store.ts                 Zustand store wrapping the repository
  utils/
    urgency.ts                    Centralized overdue/due-soon/ok logic
    fuelEfficiency.ts              Derived km/L computation
    format.ts                      ₱, km, date formatting
  theme/theme.ts                 Colors, fonts, spacing, urgency color/label helpers
  navigation/                    Stack + tab navigators, param types
  components/                    Shared UI: VehicleCard, StatusRow, UrgencyBadge/Dot, form fields
  screens/
    DashboardScreen.tsx
    VehicleDetailScreen.tsx       Hosts the Overview/Service/Fuel top tabs
    vehicleDetail/                Overview/Service/Fuel tabs, QuickAddSheet, VehicleContext
    AddEditVehicleScreen.tsx
    SettingsScreen.tsx            Group member list + invite-code stub
```

## Design reference

Adapted from a web prototype (Tailwind/lucide-react) rather than copied
directly: warm paper background `#F3EFE7`, ink `#22262B` text, status colors
teal/amber/red for ok/due-soon/overdue, Oswald for display headings,
JetBrains Mono for numeric data (odometer, currency, dates), Inter for body
text. All currency is PHP (₱) throughout.

## Urgency logic

Centralized in `src/utils/urgency.ts` — `dateUrgency` for registration and
insurance (30-day window), `pmsUrgency` for PMS which combines a date
threshold and an optional km threshold and returns whichever is more urgent.
Both the Dashboard's status dots and the Vehicle Detail Overview badges call
these same functions.

## Decisions flagged for review

See `DECISIONS.md` — in particular the permission model (simplified to
"everyone can edit" for v1, per the brief's own fallback offer) and the
local-only group-invite stub.

## Explicitly out of scope for v1

Push/local notifications, OBD-II/telematics, receipt OCR, multi-currency,
and real authentication — see `DECISIONS.md` for details on each.
