# Product decisions made without explicit sign-off

Built the full v1 in one pass rather than stopping after each screen (this
session had no interactive back-and-forth available), so flagging every
place a call was made on your behalf here instead — please review.

## Permission model: simplified to "everyone can edit"

The spec offered an owner/member split (owners edit vehicle details and
delete entries; members can only add fuel/service entries) but explicitly
invited a simpler "everyone can edit everything" model if it was faster to
ship. I took that offer for v1:

- `Role` (`owner` | `member`) still exists in the data model and is shown
  in Settings, so the concept isn't lost.
- No screen currently gates actions by role — any group member can edit
  vehicle details, add entries, or delete a vehicle.
- **Reversible later**: enforcing the owner/member split just means
  checking `role` before rendering the Edit/Delete affordances and before
  the repository calls that mutate a vehicle. Nothing in the data layer
  blocks adding that check.

If you want the stricter model for v1 instead, say so and I'll wire it in —
it's a small change now, before habits form around the open model.

## Group invites are a local stub

No backend exists yet, so "inviting a member" (Settings screen) generates a
random 6-character code and immediately adds a placeholder `GroupMember` row
locally — there's no actual mechanism to get that code to another device or
have them redeem it. This satisfies "v1 can stub this with a shareable code"
literally, but it's not a working multi-device invite flow. That has to wait
for the Supabase/Firebase backend.

## Empty-state copy

Wrote copy for the empty vehicle list, empty fuel log, and empty service log
myself (e.g. "No vehicles yet — Add your first vehicle to start tracking
service, fuel, and renewals."). Nothing in the brief specified exact
wording — treat these as placeholders to swap for your own voice.

## Odometer sync on entry

Logging a fuel or service entry bumps `Vehicle.currentOdometerKm` if the
entry's reading is higher than what's stored (`MAX(currentOdometerKm, ?)` in
`SqliteRepository`). Not specified in the brief, but the dashboard/overview
"Odometer" stat would otherwise silently go stale every time someone logs a
fill-up. If you'd rather odometer only update from the Edit Vehicle form,
that's a one-line removal in `SqliteRepository.addServiceEntry` /
`addFuelEntry`.

## PMS urgency when both date and km thresholds apply

Spec says PMS is "due by date OR mileage, whichever comes first." Implemented
as: compute urgency independently for date and for km-remaining, then take
the **more urgent** of the two (`overdue` beats `due_soon` beats `ok`). This
matches "whichever comes first" — if either signal says overdue, the whole
status is overdue.

## Not built (explicitly out of scope per the brief, restating so it's visible)

- Push/local notifications for upcoming renewals — worth a fast follow-up
  with `expo-notifications` once there's a backend, but not built here.
- OBD-II/telematics, receipt OCR, multi-currency — all out of scope, not
  touched.
- Auth: there's a single hardcoded `CURRENT_USER_ID` ("user-1", seeded as
  "Melissa") — no real login screen. A synced backend will need real auth
  before groups mean anything across devices.

## Premium automotive theme: light mode derived, not specified

The design brief gave a complete, exact palette (`#111416` background,
`#D9A23A` gold accent, etc.) but it's clearly dark-mode-first ("deep
charcoal foundation"). I used those values as-is for `darkColors` and
derived a `lightColors` complement using the same restraint and gold
family, rather than asking before touching light mode.

One real problem came up while deriving it: the raw gold `#D9A23A` on a
light (`#F5F2EA`) background computes to only ~2:1 contrast — unreadable as
a foreground/icon color. I deepened `lightColors.accent` to `#B8862E`
(~2.7–3:1), which is still short of the ~3:1 AA threshold for UI
components/large text. It's used sparingly (small icons, accent text, not
body copy), so I judged it an acceptable tradeoff rather than pushing the
gold dark enough to lose the "warm metallic gold" identity — but it's worth
a look on a real light-mode screen. If it reads poorly, the fix is a slightly
darker `accent` in `lightColors` (theme.ts) with no other code changes.

## Backend: Supabase, wired as an opt-in swap

Added a full `SupabaseRepository` (Postgres schema in `supabase/schema.sql`,
Row Level Security policies scoping every table to the caller's
household) behind the existing `Repository` interface, plus real auth
(sign up/sign in), an onboarding flow (create a household or redeem an
invite code), and real invite redemption to replace the local stub.

- `createRepository()` picks Supabase only once
  `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY` are set;
  otherwise it falls back to the original local-only SQLite path with the
  mock-data seed. This means today's push is safe to ship before the
  Supabase project exists — nothing changes for existing installs until
  those two env vars are added.
- The anon key is meant to be public (protection is the RLS policies, not
  secrecy of that key), so `.env` is intended to be committed once filled
  in — see `.env.example`. Never put the `service_role` key anywhere in
  the app or repo.
- Group invite codes remain a shared "capability token": any signed-in
  user can look up an invite row by code to redeem it (needed since the
  redeeming user isn't a member yet, so can't pass the normal membership
  check). The code itself is the secret, same trust model as the
  original local stub — flagging since it's a deliberate, not accidental,
  looseness.
- Role enforcement (owner vs. member permissions) is still not enforced
  anywhere beyond storing the value — same deferral as the original v1
  decision above, now just backed by a real table instead of a local one.
- Vehicle photos are **not** migrated to Supabase Storage in this pass —
  `photoUri` still points at a local file, so photos won't sync across a
  household's devices yet. Treating this as a fast-follow rather than
  blocking the core backend swap on it.

## Email confirmation: deep link back into the app

Sign-up confirmation emails now redirect to `vehicletracker://auth-callback`
(the app's existing scheme, already in app.json) instead of Supabase's
default page, using the PKCE flow so the auth code survives the OS's
link handoff. **This needs one manual step in the Supabase dashboard to
actually work**: Authentication → URL Configuration → Redirect URLs →
add `vehicletracker://auth-callback` to the allow list. Without that,
Supabase will reject the custom redirect and fall back to its default
(broken) behavior.

## Currency: a household-wide setting, not per-vehicle or per-entry

Currency is one Settings toggle (persisted locally per device, like the
theme) applied everywhere money is shown — not stored per vehicle or
per log entry. A household tracking a foreign-plated vehicle in a
different currency isn't supported; treating that as out of scope for
now rather than modeling currency on every Vehicle/FuelLogEntry/etc.
Amounts themselves are still stored as plain numbers (no currency code
saved alongside them), so switching the setting re-labels existing
figures rather than converting them — there's no exchange-rate
conversion here, just a different symbol/format.

## Vehicle add appearing twice: root cause and fix

Root cause: the Save button on Add/Edit Vehicle had no submitting guard,
so a second tap (or a slightly slow network round-trip to Supabase,
much more likely to get double-tapped than the old instant local SQLite
write) fired `addVehicle` twice before the screen navigated away. Fixed
by disabling the button and guarding `handleSave` re-entry while a save
is in flight — applied the same fix to QuickAddSheet (fuel/service/
charging entries) since it had the identical gap.

## Household Vehicle Management upgrade: scope actually delivered

The user's brief covered 29 sections (household roles, Action Center,
fleet intelligence, predictive maintenance, TCO, ownership timeline,
Vehicle Passport, shareable sale reports, AI/OCR capture, parts/tire/
service-center history, activity feed, task assignment, trip cost,
Philippine-specific document types, and a dashboard/login redesign).
Proposed (and the user confirmed) shipping a coherent slice rather than
partially building all 29: this pass delivers the foundation + a real
intelligence layer, not the full list. Specifically:

**Delivered:**
- Login tagline ("Manage your household's vehicles").
- Household already existed as `Group`/`GroupMember` — no rename of the
  underlying model, since every user-facing string already said
  "household," not "group" (checked before touching anything).
- `Vehicle.primaryDriverUserId` (a lightweight "responsibility," not a
  role/permission system) + a chip picker in Add/Edit Vehicle, driver
  name now shown on the Dashboard's vehicle cards.
- `Group.monthlyBudget`, editable in Settings.
- **No new expense table.** Fuel/service/charging entries already carry
  cost + vehicleId + date; `src/services/fleetAnalytics.ts` merges them
  into a unified `UnifiedExpense[]` view at read time instead of
  duplicating that data into a new "Expense" table — avoids exactly the
  "duplicate data structures" the brief said to avoid.
- Household Dashboard rebuilt around: greeting + Action Center
  (aggregated overdue/due-soon across every vehicle, replacing
  per-vehicle discovery, with "Mark done" inline) → Your Fleet → Fleet
  Intelligence → Household Budget → Recent Activity.
- Fleet Intelligence and the Activity Feed are both derived, not stored
  — computed from existing entries each render, per "do not store
  derived statistics unnecessarily."
- Data trust: insights only render once there are >= 4 expense records
  and only for effects big enough to be worth saying (>=1% spend
  change, a vehicle at >=40% of household spend) — otherwise shows
  "Fleet intelligence is learning," never a fabricated stat. Budget
  card similarly explains itself with no budget set rather than
  showing a meaningless ₱0/₱0 bar.

**Deliberately deferred** (each is a substantial standalone feature; see
chat for the explicit scoping discussion before starting):
predictive maintenance from historical intervals, total-cost-of-
ownership comparisons, vehicle ownership timeline, Vehicle Passport
screen, shareable sale report/PDF export, AI/OCR receipt capture (no
vision API is wired into this project), parts history, tire management,
service-center history, a real activity-log table (today's feed is
derived from log entries, not a persisted event stream — "mark done"
actions don't appear in it), assignable tasks beyond the single
primary-driver field, and true trip cost.

## Bug: unmigrated column broke app startup entirely

Root cause: the Household Management commit added `groups.monthlyBudget`
and `vehicles.primaryDriverUserId` to the app code and to
`supabase/schema.sql`, but a schema.sql change only takes effect once
re-run in the Supabase SQL editor — the user hadn't done that yet.
`getGroups()` (called during every app init, before anything else can
render) selected the new `monthlyBudget` column unconditionally; on a
database that doesn't have it, that query hard-fails, `ready` never
becomes true, and the app is stuck on its loading spinner indefinitely
— not a transient glitch, a full outage until fixed or migrated.
`createVehicle`/`updateVehicle` had the same landmine with
`primaryDriverUserId` (any vehicle add/edit would have failed too).

Fixed generally, not just for these two columns: `getGroups()` falls
back to a query without `monthlyBudget` on error, and
`writeWithColumnFallback()` retries a vehicle/group write with the
new column stripped if the first attempt fails — so the app now works
whether or not the user has re-run `schema.sql` yet, and the same
pattern covers any future additive column added this way. The
underlying lesson: a required-path query (anything in the app-init
critical path) must never assume a schema change has already been
applied remotely just because the code and schema.sql shipped together.

## Predictive maintenance: pattern-based, never presented as scheduled

`src/services/maintenancePrediction.ts` groups a vehicle's own service
history by type (e.g. "Oil change"), needs at least 2 real intervals
(3 entries of the same type) before predicting anything, and averages
those km intervals to estimate when that type is next due. No schema
change — reads the existing `service_entries` table.

Kept strictly separate from the scheduled `nextPmsDueDate`/`nextPmsDueKm`
on Vehicle: predictions render in their own "Predicted maintenance"
section with a visible "Predicted" tag on every row, never inside
"Renewals & Maintenance" and never using the "Overdue" badge/color —
"~X km past est." instead, in the due-soon amber rather than overdue
red, so a pattern-based guess can never be mistaken for a manufacturer-
required item. Below the 3-entries-per-type threshold, shows an
explanatory empty state rather than nothing or a fabricated guess.

## Bug: clearing an optional field silently no-op'd on Supabase

Root cause: `JSON.stringify` drops keys whose value is `undefined`, and
the model layer represents "cleared" (no photo, no notes, no PMS-by-km,
etc.) as `undefined` throughout — `SupabaseRepository`'s `.insert()`/
`.update()` calls were passing model objects straight through, so a
cleared field's key vanished from the request body entirely and
PostgREST left the column untouched instead of nulling it. Silent:
no error, the write just didn't do what it looked like it did. Fixed
with `withNulls()`, converting `undefined` → `null` before every
Supabase write. `SqliteRepository` was never affected — its raw SQL
already used `v.photoUri ?? null` explicitly at each bound parameter.

## Micro-interactions: haptics + press/scale, kept restrained

Added `expo-haptics` (a native module — needs an `eas build`, not just
OTA, same as the earlier photo-picker/notifications additions) and a
shared `AnimatedPressable` (scale to ~0.96 on press-in, 100-150ms, light
haptic tap) applied to primary buttons, the vehicle card, and the
"+Log..." actions — not to every touchable in the app, to stay
consistent with the existing design brief's "restrained micro-
interactions... avoid bouncy animations, excessive scaling, decorative
motion." "Mark done" gets a small completion state (checkmark fade/scale
in, success haptic, auto-dismiss ~900ms) instead of just closing
instantly — a fade+scale from 0.85→1, not a spring/bounce, for the same
reason.

## "Mark done" advances the due date, it's not a checkbox

Marking a renewal/PMS done opens a small sheet asking for the *new*
expiry/due date (registration & insurance default to +12 months from
today, PMS defaults to +6 months and current odometer + 5,000 km) —
all editable before saving. A plain checkbox would have no lasting
effect: the underlying date/km is what drives the overdue badge, so
"done" has to mean "renewed until X," not a flag that gets silently
re-triggered the moment the badge recomputes. Marking PMS done does
**not** create a Service tab log entry — that's still a separate,
deliberate action if the user wants cost/shop details recorded too.

## Daily reminders: server-driven push (Edge Function + cron)

Chosen over the simpler on-device alternative (recompute + reschedule a
local notification whenever the app is opened) specifically for
reliability: this fires daily regardless of whether the app was opened
recently. Cost of that choice — pieces that need one-time manual setup
neither the app nor I can do unattended:

- `push_tokens` table + RLS added to `supabase/schema.sql` — needs
  re-running (it's `create table if not exists`, safe to run the whole
  file again) in the Supabase SQL editor.
- `supabase/functions/daily-reminders/index.ts` — a Supabase Edge
  Function (Deno) that recomputes overdue/due-soon status server-side
  and pushes via Expo's push API. Deliberately duplicates the urgency
  thresholds from `src/utils/urgency.ts` (30 days / 500 km "due soon")
  rather than importing them — this runs in Deno against the DB, not in
  the RN app, so there's no shared module to import from. **If those
  thresholds ever change, update both places.**
- Needs deploying (I have no Supabase CLI/API access — only the public
  anon key) and a daily Cron trigger set up in the Supabase dashboard
  (Edge Functions → the function → Cron). No secrets to configure
  manually beyond that: `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are
  injected automatically into every Edge Function's environment.
- `expo-notifications` + `expo-device` + `expo-constants` are native
  modules — this requires a fresh `eas build`, not just an OTA update,
  same as the earlier `expo-image-picker` addition.
- One notification per household per day, only sent when there's at
  least one overdue or due-soon item — healthy vehicles produce no
  notification. Overdue and due-soon are combined into a single daily
  push rather than two separate notification streams, to avoid running
  a second scheduling/dedup mechanism for what the user's original ask
  described as one daily check.

## Service center history: grouped by shop, no new table

`src/services/serviceCenters.ts` groups existing service entries by their
`shop` field (already on `ServiceLogEntry`, no schema change) into
per-shop visit counts, totals, and average cost, sorted by total spend.
Entries with no shop recorded fall into an "Unspecified shop" bucket
rather than being silently dropped, so the totals in this view still
reconcile with the vehicle's own service history. New `ServiceCenters`
screen reachable from Settings.

## Shareable vehicle history report: text via OS share sheet, not PDF

`src/services/vehicleReport.ts` builds a plain-text report (identity,
ownership, full service history, spending summary) from the vehicle's
existing service/fuel/charging entries and `getVehicleOwnershipCost`,
shared through React Native's built-in `Share.share()` from a new icon
button on Vehicle Detail. No PDF/print library added — the brief's own
fallback instruction was to ship a clean shareable view first rather
than pull in a dependency for one feature. Photos aren't included since
the channel is plain text; a PDF version with photos would need eg.
`expo-print`/`react-native-html-to-pdf` (a native module — `eas build`,
not OTA) and is a reasonable fast-follow if a formatted report matters
more than shipping fast.

## True trip cost: stateless calculator, nothing persisted

`src/services/tripCost.ts` is a pure function, not a new feature backed
by storage: given a distance typed in and optional one-off extras
(tolls, parking), it estimates cost using the vehicle's own most recent
logged efficiency (km/L or km/kWh — already computed in
`fuelEfficiency.ts`/`chargingEfficiency.ts`) and most recent per-unit
price (latest fuel/charging entry's cost ÷ liters or kWh). No trip
table, no schema change — reachable via a "Trip cost calculator" link
on Vehicle Detail → Overview → At a glance, opening `TripCostSheet`.

Deliberately not "true" in the sense of tracking a real trip's actual
odometer-start/odometer-end and refueling afterward — that would need
persisted trip records (a schema change) to attribute a specific
refuel to a specific trip. This is a same-session estimate, labeled
"Estimated" throughout, with an honest empty state ("not enough logged
history yet") instead of guessing when a vehicle has no fuel/charging
entries at all.

## Vehicle Detail split: Overview vs. Insights tab

Overview had accumulated Renewals & Maintenance, Predicted maintenance,
At a glance, Ownership cost, the trip cost calculator link, Details,
and EV details in one scroll — too much in a single screen. Split it:

- **Overview** keeps the vehicle's plain facts: Renewals & Maintenance
  (with Mark done), At a glance stats, Details, EV details.
- **Insights** (new tab) holds everything derived/predicted/estimated:
  Predicted maintenance, Ownership cost, and the trip cost calculator —
  grouped together since all three are computed, not stored, and share
  the same "estimate, not a fact" framing.

`Vehicle Detail` is now 5 tabs (Overview, Insights, Service,
Fuel-or-Charging, Timeline), so `tabBarScrollEnabled: true` was added to
the top tab bar to keep labels legible instead of squeezing 5 fixed-width
tabs onto one row — same navigator, no new dependency. Pure UI
reorganization: no data, store, or route-param changes, no schema impact.

## Dashboard split: Home vs. Trends, and real charts instead of only cards

Dashboard had grown into one long scroll: greeting, Action Center, fleet
list, Fleet Intelligence, cost-to-own comparison, budget, and recent
activity, all stacked. Split into two top tabs (same
`material-top-tabs` pattern Vehicle Detail already uses):

- **Home**: greeting, Action Center, the fleet list, "+ Add a vehicle."
  The day-to-day tab — what needs attention, what you own.
- **Trends** (new): monthly spending trend chart, spend-by-category
  chart, Fleet Intelligence, cost-to-own comparison, household budget,
  recent activity. Everything derived from spending history, grouped
  together — nothing here is edited, only read.

Also added two chart components since the request was specifically for
charts, not just more cards:

- `SpendTrendChart` — single-hue bar chart of the last 6 calendar
  months' total household spend (`getMonthlySpendSeries()`, new in
  `fleetAnalytics.ts`). One series, one hue — the current month's bar
  uses the brighter accent, past months use the muted variant, so the
  present month reads first without adding a second color that would
  imply a second measure.
- `SpendByCategoryChart` — horizontal bars comparing fuel/service/
  charging totals, each in a fixed categorical color
  (`theme.chartFuel/chartService/chartCharging`, new tokens — never
  reused for status meaning elsewhere, never cycled). A category with
  zero spend is omitted, not shown as an empty bar — an all-gas
  household never sees a meaningless "Charging" row.

Both are hand-built with plain Views/flexbox, not a charting library —
no `react-native-svg`/Victory/etc. added, so this ships via OTA like
every other JS-only change this session, consistent with the running
"don't add a dependency for one feature" rule. Both show an honest
empty state ("log fuel/service/charging entries…") when there's no
spend at all, rather than an empty chart.

Pure UI reorganization + two new derived-view chart components — no
data, store, route, or schema changes.

## Currency setting: compact picker field instead of an always-expanded chip grid

Settings previously showed all 8 currencies as chips in a wrapping grid
— every option visible at once, taking 2-3 rows regardless of which was
selected. Replaced with `CurrencyPickerField`, a single-line row (same
shape as `DateField`: label + bordered value row + chevron) that shows
only the selected currency; tapping it opens a small bottom sheet to
pick a different one. Same options, same store (`useCurrencyStore`),
no behavior change — just collapsed to one line until the user actually
wants to change it.

## Card usage in Vehicle Detail → Overview tab

The brief says not to wrap every section in a card. Kept "At a glance" (the
four key stat numbers — odometer, efficiency, purchase date/price) as a
bordered card, since it's a genuinely distinct grouping of headline
numbers. Flattened "Renewals & Maintenance," "Details," and "EV details"
to plain sections with a hairline top divider instead of a full
card/border — they're closer to a continuous list than a separate module.
