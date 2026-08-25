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
