import { Group, GroupMember } from "@/types/models";
import { supabase } from "./client";

function client() {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase;
}

function randomCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

/** Creates a redeemable invite for a group and returns the shareable code. */
export async function createInvite(
  groupId: string,
  createdBy: string,
  role: GroupMember["role"] = "member"
): Promise<string> {
  const code = randomCode();
  const { error } = await client()
    .from("group_invites")
    .insert({ groupId, code, role, createdBy });
  if (error) throw new Error(error.message);
  return code;
}

/** Redeems an invite code: adds the current user to the group and marks the invite used. */
export async function redeemInvite(
  code: string,
  userId: string,
  displayName: string
): Promise<Group> {
  const { data: invite, error: lookupError } = await client()
    .from("group_invites")
    .select("id, groupId, role, redeemedBy")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();
  if (lookupError) throw new Error(lookupError.message);
  if (!invite || invite.redeemedBy) throw new Error("That invite code is invalid or already used.");

  const member: GroupMember = {
    groupId: invite.groupId,
    userId,
    role: invite.role,
    displayName,
  };
  const { error: joinError } = await client().from("group_members").insert(member);
  if (joinError) throw new Error(joinError.message);

  await client()
    .from("group_invites")
    .update({ redeemedBy: userId, redeemedAt: new Date().toISOString() })
    .eq("id", invite.id);

  const { data: group, error: groupError } = await client()
    .from("groups")
    .select("id, name")
    .eq("id", invite.groupId)
    .single();
  if (groupError) throw new Error(groupError.message);
  return group as Group;
}
