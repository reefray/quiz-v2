import { supabase } from "./supabase";

export interface LeadInput {
  session_id: string;
  booking_method: string | null;
  headache: string | null;
  handle: string;
  email: string;
  other_system?: string;
}

export interface LeadResult {
  ok: boolean;
  /** true when the handle was taken between the live check and submit (23505). */
  duplicate?: boolean;
}

/**
 * Insert one completed lead (called on email submit). No-op when Supabase isn't
 * configured. Returns { duplicate: true } on a unique-handle collision so the
 * flow can send the user back to re-pick.
 */
export async function insertLead(input: LeadInput): Promise<LeadResult> {
  if (!supabase) return { ok: true };

  let fbclid: string | null = null;
  try {
    fbclid = localStorage.getItem("fbclid");
  } catch {
    /* ignore */
  }

  const { error } = await supabase.from("leads").insert({
    session_id: input.session_id,
    booking_method: input.booking_method,
    headache: input.headache,
    handle: input.handle,
    email: input.email,
    fbclid,
    answers: {
      booking_method: input.booking_method,
      headache: input.headache,
      other_system: input.other_system ?? null,
    },
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
  });

  if (error) {
    if (error.code === "23505") return { ok: false, duplicate: true };
    console.warn("[leads] insert failed:", error.message);
    return { ok: false };
  }
  return { ok: true };
}
