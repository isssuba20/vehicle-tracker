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

## Card usage in Vehicle Detail → Overview tab

The brief says not to wrap every section in a card. Kept "At a glance" (the
four key stat numbers — odometer, efficiency, purchase date/price) as a
bordered card, since it's a genuinely distinct grouping of headline
numbers. Flattened "Renewals & Maintenance," "Details," and "EV details"
to plain sections with a hairline top divider instead of a full
card/border — they're closer to a continuous list than a separate module.
