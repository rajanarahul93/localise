import { supabase } from "./supabase";
import type { Reaction, ReactionType } from "../types";

export async function addReaction(
  targetId: string,
  reactionType: ReactionType,
  targetType: "post" | "comment"
): Promise<Reaction> {
  const { data: existingSession } = await supabase.auth.getSession();
  const userId = existingSession?.session?.user?.id;
  if (!userId) throw new Error("User not authenticated");

  const column = targetType === "post" ? "post_id" : "comment_id";

  const { data: existing, error: checkError } = await supabase
    .from("reactions")
    .select("*")
    .eq(column, targetId)
    .eq("user_id", userId)
    .eq("reaction_type", reactionType)
    .maybeSingle();

  if (checkError) throw checkError;

  if (existing) {
    await supabase.from("reactions").delete().eq("id", existing.id);
    return existing;
  }

  const { data: oldReaction } = await supabase
    .from("reactions")
    .select("id")
    .eq(column, targetId)
    .eq("user_id", userId)
    .maybeSingle();

  if (oldReaction) {
    await supabase.from("reactions").delete().eq("id", oldReaction.id);
  }

  const insertData = {
    user_id: userId,
    reaction_type: reactionType,
    [column]: targetId,
  };

  const { data, error } = await supabase
    .from("reactions")
    .insert([insertData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeReaction(reactionId: string): Promise<void> {
  const { error } = await supabase.from("reactions").delete().eq("id", reactionId);
  if (error) throw error;
}

export async function getReactions(
  targetId: string,
  targetType: "post" | "comment"
): Promise<Record<ReactionType, number>> {
  const column = targetType === "post" ? "post_id" : "comment_id";

  const { data, error } = await supabase
    .from("reactions")
    .select("reaction_type")
    .eq(column, targetId);

  if (error) throw error;

  const counts: Record<ReactionType, number> = { "👍": 0, "😍": 0, "💯": 0, "⚠️": 0 };
  (data || []).forEach(({ reaction_type }: { reaction_type: ReactionType }) => {
    counts[reaction_type]++;
  });
  return counts;
}

export async function getUserReaction(
  targetId: string,
  targetType: "post" | "comment"
): Promise<ReactionType | null> {
  const { data: existingSession } = await supabase.auth.getSession();
  const userId = existingSession?.session?.user?.id;
  if (!userId) return null;

  const column = targetType === "post" ? "post_id" : "comment_id";

  const { data, error } = await supabase
    .from("reactions")
    .select("reaction_type")
    .eq(column, targetId)
    .eq("user_id", userId);

  if (error) throw error;

  const reactions = data || [];
  if (reactions.length === 0) return null;
  if (reactions.length === 1) return reactions[0].reaction_type;

  return reactions[0].reaction_type;
}

export async function reportContent(
  targetId: string,
  targetType: "post" | "comment"
): Promise<void> {
  const { data: existingSession } = await supabase.auth.getSession();
  const userId = existingSession?.session?.user?.id;
  if (!userId) throw new Error("User not authenticated");

  const column = targetType === "post" ? "post_id" : "comment_id";

  const insertData = {
    user_id: userId,
    [column]: targetId,
  };

  const { error } = await supabase.from("reports").insert([insertData]);
  if (error && error.code !== "23505") throw error; // Ignore duplicate key errors
}

export async function getReportCount(
  targetId: string,
  targetType: "post" | "comment"
): Promise<number> {
  const column = targetType === "post" ? "post_id" : "comment_id";

  const { count, error } = await supabase
    .from("reports")
    .select("*", { count: "exact", head: true })
    .eq(column, targetId);

  if (error) throw error;
  return count || 0;
}
