// Garahe daily reminders — Supabase Edge Function (Deno runtime).
//
// Runs once a day (set up as a Cron trigger on this function in the
// Supabase dashboard — see DECISIONS.md / the deployment notes). For
// every household with at least one overdue or due-soon renewal
// (registration, insurance, next PMS by date or km), sends one push
// notification per member device via Expo's push API.
//
// Deliberately self-contained: mirrors src/utils/urgency.ts's thresholds
// rather than importing it, since this runs in Deno against a DB schema,
// not the RN app's module graph.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DAY_MS = 24 * 60 * 60 * 1000;
const DUE_SOON_DAYS = 30;
const DUE_SOON_KM = 500;

// This function runs on Supabase's servers (real UTC clock), not on a
// household's device — there's no per-household timezone stored to do
// this precisely, so it assumes this app's stated primary market,
// Asia/Manila (UTC+8, no DST). Comparing raw UTC instants without this
// adjustment reproduced the exact bug fixed client-side in
// src/utils/urgency.ts: a renewal due "today" would read as overdue
// hours before the Manila-local day actually ended, and the day
// boundary would land at 8am/4pm Manila time instead of midnight.
const ASSUMED_UTC_OFFSET_HOURS = 8;

type Urgency = "ok" | "due_soon" | "overdue";

/** UTC midnight of the calendar day this UTC instant falls on in the assumed local timezone. */
function localMidnightUtc(instant: Date, offsetHours: number): Date {
  const shifted = new Date(instant.getTime() + offsetHours * 60 * 60 * 1000);
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()));
}

function dateUrgency(expiryIso: string, now: Date): Urgency {
  // expiryIso is a Postgres `date` column ("YYYY-MM-DD"), carrying no
  // timezone of its own — anchoring it at UTC midnight is exact, not an
  // assumption, since a bare calendar date has no time-of-day to shift.
  const expiry = new Date(`${expiryIso}T00:00:00Z`);
  const today = localMidnightUtc(now, ASSUMED_UTC_OFFSET_HOURS);
  const diffDays = Math.round((expiry.getTime() - today.getTime()) / DAY_MS);
  if (diffDays < 0) return "overdue";
  if (diffDays <= DUE_SOON_DAYS) return "due_soon";
  return "ok";
}

function worseOf(a: Urgency, b: Urgency): Urgency {
  const rank: Record<Urgency, number> = { ok: 0, due_soon: 1, overdue: 2 };
  return rank[a] >= rank[b] ? a : b;
}

function pmsUrgency(
  dueDateIso: string,
  dueKm: number | null,
  currentOdometerKm: number,
  now: Date
): Urgency {
  const byDate = dateUrgency(dueDateIso, now);
  if (dueKm == null) return byDate;
  const kmRemaining = dueKm - currentOdometerKm;
  const byKm: Urgency = kmRemaining < 0 ? "overdue" : kmRemaining <= DUE_SOON_KM ? "due_soon" : "ok";
  return worseOf(byDate, byKm);
}

interface Vehicle {
  id: string;
  groupId: string;
  name: string;
  registrationExpiry: string;
  insuranceExpiry: string;
  nextPmsDueDate: string;
  nextPmsDueKm: number | null;
  currentOdometerKm: number;
}

interface PushMessage {
  to: string;
  title: string;
  body: string;
  sound: "default";
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const now = new Date();

  const { data: vehicles, error: vehiclesError } = await supabase
    .from("vehicles")
    .select('id, groupId, name, registrationExpiry, insuranceExpiry, nextPmsDueDate, nextPmsDueKm, currentOdometerKm');
  if (vehiclesError) {
    return new Response(JSON.stringify({ error: vehiclesError.message }), { status: 500 });
  }

  // groupId -> { overdue: string[], dueSoon: string[] }
  const byGroup = new Map<string, { overdue: string[]; dueSoon: string[] }>();

  for (const v of (vehicles ?? []) as Vehicle[]) {
    const checks: { label: string; urgency: Urgency }[] = [
      { label: `Registration (${v.name})`, urgency: dateUrgency(v.registrationExpiry, now) },
      { label: `Insurance (${v.name})`, urgency: dateUrgency(v.insuranceExpiry, now) },
      {
        label: `Next PMS (${v.name})`,
        urgency: pmsUrgency(v.nextPmsDueDate, v.nextPmsDueKm, v.currentOdometerKm, now),
      },
    ];

    if (!byGroup.has(v.groupId)) byGroup.set(v.groupId, { overdue: [], dueSoon: [] });
    const bucket = byGroup.get(v.groupId)!;
    for (const c of checks) {
      if (c.urgency === "overdue") bucket.overdue.push(c.label);
      else if (c.urgency === "due_soon") bucket.dueSoon.push(c.label);
    }
  }

  const groupIdsWithAlerts = [...byGroup.entries()]
    .filter(([, b]) => b.overdue.length > 0 || b.dueSoon.length > 0)
    .map(([groupId]) => groupId);

  if (groupIdsWithAlerts.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: "nothing overdue or due soon" }), { status: 200 });
  }

  const { data: members, error: membersError } = await supabase
    .from("group_members")
    .select('"groupId", "userId"')
    .in("groupId", groupIdsWithAlerts);
  if (membersError) {
    return new Response(JSON.stringify({ error: membersError.message }), { status: 500 });
  }

  const userIds = [...new Set((members ?? []).map((m) => m.userId))];
  const { data: tokens, error: tokensError } = await supabase
    .from("push_tokens")
    .select('token, "userId"')
    .in("userId", userIds);
  if (tokensError) {
    return new Response(JSON.stringify({ error: tokensError.message }), { status: 500 });
  }

  const tokensByUser = new Map<string, string[]>();
  for (const t of tokens ?? []) {
    const list = tokensByUser.get(t.userId) ?? [];
    list.push(t.token);
    tokensByUser.set(t.userId, list);
  }

  const messages: PushMessage[] = [];
  for (const [groupId, bucket] of byGroup) {
    if (bucket.overdue.length === 0 && bucket.dueSoon.length === 0) continue;
    const groupMembers = (members ?? []).filter((m) => m.groupId === groupId);

    const parts: string[] = [];
    if (bucket.overdue.length > 0) parts.push(`${bucket.overdue.length} overdue: ${bucket.overdue.join(", ")}`);
    if (bucket.dueSoon.length > 0) parts.push(`${bucket.dueSoon.length} due soon: ${bucket.dueSoon.join(", ")}`);
    const body = parts.join(". ");
    const title = bucket.overdue.length > 0 ? "Garahe: renewals overdue" : "Garahe: renewals due soon";

    for (const member of groupMembers) {
      for (const token of tokensByUser.get(member.userId) ?? []) {
        messages.push({ to: token, title, body, sound: "default" });
      }
    }
  }

  // Expo's push API caps batches at 100 messages.
  const CHUNK = 90;
  let sent = 0;
  for (let i = 0; i < messages.length; i += CHUNK) {
    const chunk = messages.slice(i, i + CHUNK);
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(chunk),
    });
    if (res.ok) sent += chunk.length;
  }

  return new Response(JSON.stringify({ sent, households: groupIdsWithAlerts.length }), { status: 200 });
});
