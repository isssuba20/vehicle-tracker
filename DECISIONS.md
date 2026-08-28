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

## Bug: AnimatedPressable's Save/Cancel buttons rendered unequal widths

User-reported (screenshot: MarkDoneSheet's Cancel button wide, Save
narrow, though both styled `{ flex: 1, ... }` in the same row). Root
cause: `AnimatedPressable` rendered a plain, unstyled `Pressable`
wrapping an inner `Animated.View` that received the actual `style`
prop — so `flex: 1` landed on the inner view, not on the outer
`Pressable` that participates in the parent row's flex layout. The
inner view's `flex: 1` has no effect on how its own unstyled parent
sizes itself; the outer `Pressable` shrank to fit its content instead.
Cancel (a plain `Pressable` elsewhere in the same row, style applied
directly) sized correctly, making the mismatch visible.

Fixed by animating the `Pressable` itself — `Animated.createAnimatedComponent(Pressable)`
— instead of nesting a nested Animated.View, so the passed-in `style`
(including any `flex`/`width`) and the animated `transform` land on
the same element. This is the standard RN idiom for an animated
pressable and avoids the whole "does layout style propagate through an
unstyled wrapper" class of bug. Every other `AnimatedPressable` usage
in the app (primary buttons, vehicle card, "+Log…" actions) gets the
same fix for free, since they all went through the same component.

## Dashboard/Insights: pull-to-refresh, and a per-vehicle spend chart

Two follow-ups after the Dashboard/Insights split:

- **Pull-to-refresh** on both Dashboard tabs (Home's FlatList, Trends'
  ScrollView) — re-runs `refreshVehicles()`, `refreshGroups()`, each
  vehicle's `loadVehicleDetail()`, and `loadMembers()`. No new
  mechanism: same store actions every other mutation already calls,
  just user-triggered instead of only firing after a write.
- **Vehicle Detail → Insights** gets a "Where it goes" section reusing
  `SpendByCategoryChart` (the same component the household Trends tab
  uses) scoped to just that one vehicle — extends the charts pattern
  down to the per-vehicle level instead of leaving it dashboard-only.

No schema changes; both are pure UI/derived-view additions.

## In-app OTA update notification on launch

Previously the only way to get a new OTA update was Settings →
"Check for updates" — easy to forget, so most people ran a stale build
until they happened to think of it. Added a silent background check
on every app launch (`useAppUpdateCheck`, new hook): calls
`Updates.checkForUpdateAsync()` and, if one exists,
`Updates.fetchUpdateAsync()` — same calls the manual button already
used, just run automatically instead of waiting for the user to tap
it.

**Never auto-restarts.** Once a new bundle is downloaded, a dismissible
`UpdateBanner` slides in at the very top of the app (above the nav
stack, its own `insets.top` padding) with a "Restart" button — the user
decides when to reload, so an update can't yank the screen out from
under whatever they're doing. Dismissing just hides the banner for
that session; the update is already downloaded and applies on the next
natural restart regardless. Network/update-server failures are
swallowed silently in the background check — Settings' existing manual
button still surfaces errors there if the user goes looking.

Bootstrapping note: since this check is itself JS-only code, it can
only run once a build already contains it — the very first OTA push of
this feature won't have notified about itself; from the next update
onward it will. No native module added — `expo-updates` was already a
dependency (Settings' manual check used it) — so this ships as a
normal OTA update, not a new `eas build`.

## Accessibility pass: icon-only buttons had zero accessibilityLabel usage

Audited the app for icon-only touch targets (an Ionicons icon with no
adjacent text — a screen reader falls back to reading the icon's
internal glyph name, or nothing) and found the app had **zero**
`accessibilityLabel` usages anywhere. Buttons that already pair an icon
with visible text (PhotoActionSheet's "Take photo"/"Choose from
library"/"Remove photo", MarkDoneSheet's Save/Cancel) were already
fine — RN uses the child Text as the accessible name automatically.
Added labels to the ones that weren't:

- `ThemeToggle` — "Switch to light/dark theme" (state-dependent)
- Vehicle Detail's share icon — "Share vehicle history report"
- `UpdateBanner`'s dismiss (×) and Restart buttons; the decorative
  sparkles icon is now `importantForAccessibility="no"` so it doesn't
  add noise before the text a screen reader should read
- The delete (trash) icon on every Service/Fuel/Charging log row —
  labeled with the entry's type + date (e.g. "Delete Oil change entry
  from Jan 15, 2026") so multiple rows don't all announce as an
  identical unlabeled "Delete"
- `VehicleCard`'s photo-avatar button — "Change photo for {name}"
- `VehicleCard`'s three status dots (registration/insurance/PMS) —
  previously three colored dots with **no label at all**, meaningless
  to a screen reader (and honestly cryptic sighted, too, without
  already knowing the fixed order) — now one combined label:
  "Registration ok, insurance due soon, next service overdue"

Pure a11y/UX metadata — no visual or behavioral change, no schema
impact.

## Activity feed: category-colored dot per row

`ActivityFeed` rows (Trends tab) previously had no visual tie to the
Trends tab's own `SpendByCategoryChart` legend just above it — same
categories, no shared color. Added a small colored dot per row using
the same `theme.chartFuel/chartService/chartCharging` tokens the chart
already uses, so a fuel row and the "Fuel" bar in the chart read as
the same thing at a glance. No new colors, no schema change.

## Bug: floating "+ Log/Add" buttons overlapped list content

User-reported (screenshot): the Dashboard's "+ Add a vehicle" button
rendered on top of a vehicle card, obscuring its text. Root cause:
every one of these buttons (`HomeTab`'s Add vehicle, and Service/Fuel/
Charging tabs' "+ Log…" buttons) used `position: "absolute"` pinned to
the bottom of their container, floating *over* the scrollable list —
a classic Material FAB pattern, but here the list's bottom padding
(`spacing.xl * 3`) wasn't reliably larger than the button's actual
footprint across devices/insets, so it could sit on top of unscrolled
content instead of just below it.

Fixed by making the button a genuine flex footer instead of an
absolute overlay: the button now lives in a sibling `View` *below* the
`FlatList` (not inside it, not layered over it), with the list given
`flex: 1` so it fills exactly the remaining space above the footer.
This guarantees zero overlap by construction, at any list length or
device inset, rather than depending on tuned padding numbers. Applied
identically to all four "+ …" buttons in the app (Dashboard, Service,
Fuel, Charging tabs) since they all had the same bug.

## Dashboard restructured: Home / Fleet / Trends (was Home / Trends)

Two follow-up requests after the Home/Trends split:

1. Group "things that need your attention" by vehicle and make each
   group collapsible, so a household with several vehicles overdue on
   several things doesn't turn Home into a long flat list. `ActionCenter`
   now groups its `items` by `vehicleId`, sorted by that vehicle's worst
   urgency (items already arrive sorted overall, so grouping preserves
   "most urgent vehicle first"). Each group header shows the vehicle
   name, item count, and a worst-urgency color bar; **all groups start
   collapsed** — this scales to any fleet size instead of getting more
   crowded as vehicles are added, and the header count is still visible
   without expanding anything.
2. Move the fleet vehicle list itself out of Home entirely, into a new
   **Fleet** tab. Home is now reserved strictly for what needs
   attention — the greeting, an "all caught up" state, and the grouped
   Action Center — with room to add other attention-worthy content
   later without it competing with "browse my vehicles" for space.
   `getActionItems()` already only returns overdue + due-soon items
   (30-day / 500km window, unchanged), so "near-due (1 month before)"
   was already the existing behavior — no logic change there, just
   giving Home a tab of its own instead of sharing space with the fleet
   list.

New `src/screens/dashboard/FleetTab.tsx` holds what Home used to:
vehicle cards, empty state, "+ Add a vehicle" footer. Dashboard is now
3 top tabs: Home, Fleet, Trends.

No schema changes — pure UI reorganization + one component (ActionCenter)
gaining grouping/collapse state.

## Six-item polish batch: search, reminder lead time, export, onboarding, contrast, duplicate

**Fleet search/filter.** `FleetTab` gets a search bar (name/make/model/
plate, case-insensitive substring) — but only once there are >= 4
vehicles (`SEARCH_MIN_VEHICLES`); below that it's pure clutter with
nothing to narrow down. No new dependency, filters client-side over
the already-loaded vehicle list.

**Configurable renewal lead time.** The "due soon" window (registration/
insurance by date, PMS by km) was hardcoded at 30 days / 500 km in
`urgency.ts`. `dateUrgency()`/`pmsUrgency()` now take optional
threshold params (default unchanged) and a new
`useReminderSettingsStore` (AsyncStorage-persisted, same pattern as
currency/theme) holds the user's chosen values, editable in Settings.
**Important limitation, called out in the Settings UI itself**: this is
a device-local setting, not synced anywhere — the daily push
notification (`supabase/functions/daily-reminders`) has its own
hardcoded 30/500 baked into the Edge Function and has no way to read a
device's AsyncStorage. Syncing the two would need a stored per-household
setting (a schema change), so for now the in-app display and the daily
push can disagree if someone changes this. Flagged in-app, not hidden.

**Export all data.** New `src/services/householdExport.ts` builds a
CSV (not prose, unlike the single-vehicle share report) covering every
vehicle's own fields plus its full fuel/service/charging history in one
text file — two tables (VEHICLES, ENTRIES) since a vehicle and a log
entry don't share a row shape, and no zip/xlsx library exists in this
project to split them into real sheets. Shared via the same
`Share.share()` pattern as the existing per-vehicle report — no new
dependency.

**Onboarding: Home tab's zero-vehicle state.** Previously a household
with no vehicles yet still saw "Your household is all caught up" —
technically true (zero action items) but a strange first impression.
`HomeTab` now takes `hasVehicles` and shows a distinct prompt ("Add
your first vehicle to get started") with a button straight into
Add/Edit Vehicle, instead of implying there's nothing to do yet.

**Light-mode chart contrast, computed not eyeballed.** Ran the actual
WCAG relative-luminance contrast formula against every newly-added
color: `chartFuel` in light mode (previously == `accent`, `#B8862E`)
measured **2.89:1** against background/surface — under the 3:1
non-text-contrast floor, now that it's used for a chart bar/legend
swatch/activity-feed dot (a fill, not the small icon/text use the raw
accent was originally tuned and accepted for at that same borderline
ratio). Fixed by pointing `lightColors.chartFuel` at the already-
existing `accentMuted` token (`#8C6423`, 4.74:1/5.30:1) instead of
inventing a new color — same gold family, already vetted as part of
the palette. `chartService`/`chartCharging` and the `UpdateBanner`
text-on-accent combo were already comfortably above 4.5:1 in both
modes; no changes needed there. The three chart colors are only ever
shown next to a text label (chart legend, activity feed row text) per
the working data-viz rule "color is never the sole identifier," so
distinguishing them by hue alone wasn't a hard requirement here.

**Faster data entry: duplicate an entry.** Every Service/Fuel/Charging
log row gets a "copy" icon next to delete. It opens the same
`QuickAddSheet` used for add/edit, but pre-filled from that entry's
cost/type/shop/liters/kWh — date always resets to today and odometer
always resets to the vehicle's current reading (never copied, since
those are exactly the two fields that must change for a new entry).
For recurring costs (same shop, same fill-up amount) this turns a
blank form into a few taps. `QuickAddSheet` gained a `duplicateFrom`
prop, kept distinct from `entry` (which means "edit this exact
record," including its delete button) — duplicating always creates a
new record.

No schema changes across any of these six.

## Bug: negative numbers silently accepted on Add/Edit Vehicle and Mark Done

Found while auditing numeric input handling for validation gaps.
`AddEditVehicleScreen.handleSave()` computed `purchasePrice`/
`currentOdometerKm` as `Number(input) || 0` — this guards against
empty/non-numeric input (`Number("")` is `0`, falsy) but a **negative**
number like `-5000` is truthy, so it sailed straight through
unvalidated into the saved vehicle. Same gap on `nextPmsDueKm`,
`batteryCapacityKwh`, and `estimatedRangeKm`. `MarkDoneSheet`'s PMS
"next due at (km)" field had the identical bug — only checked
`Number.isNaN`, not sign. A negative purchase price or odometer would
have quietly corrupted every cost-per-km/ownership-cost calculation
downstream (all of which assume non-negative inputs) with no error
shown to the user.

Fixed by validating sign explicitly wherever a number is parsed from
one of these fields, with a specific error message per field (e.g.
"Purchase price can't be negative.") rather than one generic message —
also tightened the vehicle year check to a plausible range (1900 to
next year) instead of "any non-NaN number," so e.g. "0" or "30000"
can't be saved as a model year. `MarkDoneSheet` gained an `error` state
and inline error text (it previously had none at all — an invalid
value there was dropped silently rather than shown).

## Loading-state consistency: Dashboard now shows a spinner, not just text

Dashboard's initial loading state was text-only ("Loading your
garage…"), while Vehicle Detail's equivalent state uses a spinner.
Added the same `ActivityIndicator` to Dashboard's loading view so
"the app is doing something" reads the same way everywhere rather than
looking stalled on a plain sentence for a moment.

## Audit: every numeric input and division site, one more gap found

After the Add/Edit Vehicle and Mark Done negative-number fixes, swept
every remaining `Number(...)` conversion and every division in
`services/`/`utils/` for the same class of bug (unvalidated sign,
divide-by-zero).

Found one more: `TripCostSheet`'s "tolls/parking/other" field computed
`extraCosts = Number(extras) || 0` with no sign check. Distance was
already effectively safe (`distanceKm <= 0` already gates the whole
result to a hint instead of computing), but a negative extras value
would silently *reduce* the displayed total — with the "Tolls /
parking" row itself hidden (it only renders `extraCosts > 0`), so the
discount would have no visible explanation. Fixed with
`Math.max(0, Number(extras) || 0)`.

Everything else checked out already guarded: `QuickAddSheet` (cost/
odometer/liters/kWh all validated), `ownershipCost.monthsSince()`
(`Math.max(1, months)`, so cost-per-month can't divide by zero for a
same-day purchase), `maintenancePrediction` (requires >= 2 real
intervals before averaging), `serviceCenters` (a shop group is only
ever created alongside its first entry, so `entries.length` is never
0), `fleetAnalytics.getSpendingTrend` (returns `null` rather than
dividing by a zero last-month total). No further changes needed there.

## Bug (significant): dates silently shifted by a day for Philippine-timezone users

Widened the numeric-input sweep to dates and found the biggest bug of
this session. Root cause, present since very early in the app: every
date in this app is meant to be a plain calendar day ("2026-03-15"),
but the code routinely converted between `Date` objects and those
strings via `.toISOString()` / `new Date(isoString)` — both of which
go through **UTC**, not the device's local timezone. For any positive
UTC offset — the Philippines is UTC+8, this app's explicitly stated
primary market — that conversion silently shifts the calendar date by
a day. This wasn't a rare midnight edge case; it was reproducible
every time, for most users.

Two call sites were the sharpest edges:

- **`DateField`** (the date picker used by every date field in the
  app — vehicle purchase date, registration/insurance/PMS due dates,
  every fuel/service/charging entry date): its `onChange` did
  `date.toISOString().slice(0, 10)`. Whatever calendar day the native
  picker returned (anchored to local midnight), converting through UTC
  moved it back by 8 hours worth of date — for a PH user, **every date
  picked from the calendar saved as one day earlier than what was
  tapped.** Its `value={new Date(valueIso)}` had the mirror-image bug
  on load for negative-offset users.
- **`urgency.dateUrgency()`**: compared `new Date(expiryIso)` (UTC
  midnight of the due date) against the exact current instant. For a
  PH user, a renewal due "today" would flip to **overdue by local
  mid-afternoon** — hours before the local day actually ended — because
  the UTC-midnight anchor was already 8 hours in the past by then.

Fixed with a new shared `src/utils/date.ts`:
- `toLocalIso(d)` — a Date's own local year/month/day, never through UTC
- `todayIso()` — today, local
- `fromLocalIso(iso)` — parses "YYYY-MM-DD" as **local** midnight, not UTC

Applied everywhere a date-only string crossed a `Date` object:
`DateField` (both directions — the core fix), `urgency.dateUrgency()`
(now diffs local-midnight-to-local-midnight, so overdue transitions
land exactly at local midnight rather than at a timezone-dependent
hour, as a clean integer day count instead of a fractional one),
`fleetAnalytics.getMonthTotal()`/`getMonthlySpendSeries()` (previously
computed "this month" via `toISOString()`, which could name the wrong
month for the first ~8 local hours of a new month — directly affects
the household budget comparison and the Trends spend chart),
`ownershipCost.monthsSince()`, `format.formatDate()`/`formatDateShort()`
(display-side, affects negative-offset regions), `QuickAddSheet`,
`AddEditVehicleScreen`, `MarkDoneSheet`, `vehicleReport.ts`,
`householdExport.ts`, and the mock-data seed. Left untouched (correctly
already using UTC): `redeemedAt`/`updatedAt` audit timestamps in
`invites.ts`/`registerPushToken.ts`, which are real instants, not
calendar days — `.toISOString()` is the right call there.

**Follow-up**: `supabase/functions/daily-reminders/index.ts` had the
identical bug in its own `dateUrgency()` — it's a separate Deno Edge
Function, excluded from the RN app's `tsconfig.json`
(`"exclude": ["supabase/functions"]`), so it wasn't touched by the
sweep above and isn't covered by the `tsc`/`expo export` verification
this session otherwise relies on. Fixed separately: since this runs on
Supabase's server (a real UTC clock) rather than a household's device,
there's no per-user timezone to read, so it now assumes this app's
stated primary market, Asia/Manila (UTC+8, no DST) — shifts the
server's UTC "now" by that fixed offset before truncating to a
calendar day, then diffs against the stored date (itself anchored at
UTC midnight, which is exact for a bare `date` column with no
time-of-day to shift). Verified the day-math directly with a
standalone Node script (same logic, no Deno-specific APIs) covering
the mid-afternoon-Manila and early-morning-Manila cases that were
broken before. Needs a manual redeploy to take effect — the fix ships
with this commit but Edge Functions don't auto-deploy like the OTA
app bundle does.

## Card usage in Vehicle Detail → Overview tab

The brief says not to wrap every section in a card. Kept "At a glance" (the
four key stat numbers — odometer, efficiency, purchase date/price) as a
bordered card, since it's a genuinely distinct grouping of headline
numbers. Flattened "Renewals & Maintenance," "Details," and "EV details"
to plain sections with a hairline top divider instead of a full
card/border — they're closer to a continuous list than a separate module.

## Push notification registration: silent failure made debuggable

While debugging why a real device's `push_tokens` row never appeared
after force-stop/reopen, found the real root cause wasn't reproducible
from here: `registerPushToken()` returned `void` on every early-out
(no Supabase, not a real device, permission denied, no EAS project ID)
**and** on any thrown error (native module issue, network failure,
Supabase upsert error) — all four indistinguishable from "worked, just
nothing to do." With no adb/device-log access to the user's phone,
this was undiagnosable from either side.

Changed it to return a `PushRegistrationResult` union instead, and
added a "Notifications" section in Settings with a "Check push
notification status" button that calls it on demand and shows the
exact outcome in an `Alert` — permission denied, no project ID,
Supabase error message, etc. `AppGate.tsx`'s automatic on-launch call
still fires the same way (return value just unused there); this button
is for on-demand diagnosis without needing a rebuild or console access.

## Push notifications, part 2: FCM credentials added

The diagnostic from the previous entry did its job — it surfaced
"Default FirebaseApp is not initialized... FirebaseApp.initializeApp(Context)
first," which is exactly the error Expo's push docs describe when an
Android app has no Firebase/FCM configuration at all. Root cause: this
project never had a Firebase project or `google-services.json` — the
`expo-notifications` plugin was already in `app.json`, but that alone
isn't enough for Android; FCM specifically needs its own config file.

Fixed the config-file half: user created a Firebase project (package
name `com.vehicletracker.app`, matching exactly), downloaded
`google-services.json`, and it's now committed at the repo root with
`android.googleServicesFile: "./google-services.json"` added to
`app.json`. Committed deliberately, not gitignored — this file is a
client config analogous to the Supabase anon key already committed in
this project (see the "Backend: Supabase" entry above): it's scoped to
this specific Android package and restricted by Firebase's own rules,
not a secret that needs hiding. The actual secret — the Firebase
service-account key used for sending pushes via FCM V1 — is never
committed; it goes straight into `eas credentials`, outside this repo.

**Still needed, outside what committing this file can do**:
1. Upload the Firebase service-account key to EAS (`eas credentials`
   → Android → "Push Notifications: Manage your FCM V1 credentials").
2. A fresh native build (`eas build --platform android`) —
   `google-services.json` is baked into the native binary at build
   time, so this change cannot ship via OTA like the rest of this
   session's work.

No RN app code changed — config-only. `npx tsc --noEmit` and
`npx expo export` both still clean (the file only matters at native
build time, not to the JS bundle).
