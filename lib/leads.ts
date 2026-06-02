/**
 * Client-side lead capture. Talks ONLY to our own Next.js API routes — the
 * browser never touches Supabase directly. Writes are progressive: one row per
 * session_id, upserted as the user advances through the funnel.
 */

/**
 * Funnel milestones that trigger a Slack ping (one threaded message per
 * session). Kept in sync with LeadEvent in lib/slack.ts — duplicated rather
 * than imported because that module is server-only.
 */
export type LeadEvent =
  | "quiz_started"
  | "q1_answered"
  | "email_given"
  | "download_clicked";

/** Columns the funnel may write. session_id is passed separately. */
export interface LeadFields {
  booking_method?: string | null;
  other_system?: string | null;
  headache?: string | null;
  handle?: string | null;
  email?: string | null;
  fbclid?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  reached_success?: boolean;
  clicked_download?: boolean;
  download_store?: string | null;
  user_agent?: string | null;
}

export interface LeadResult {
  ok?: boolean;
  /** Set when the handle was taken by another session (Postgres 23505). */
  error?: "handle_taken" | string;
}

/**
 * Upsert lead fields for a session. Awaitable (the claim step needs the
 * handle_taken result), but callers that don't care should NOT await — see
 * fireLead() for the fire-and-forget wrapper. `keepalive` lets the final
 * download write survive the navigation away.
 */
export async function postLead(
  session_id: string,
  fields: LeadFields,
  event?: LeadEvent,
): Promise<LeadResult> {
  try {
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ session_id, ...fields, ...(event ? { event } : {}) }),
      keepalive: true,
    });
    const json = (await res.json().catch(() => ({}))) as LeadResult;
    if (!res.ok) return { error: json.error ?? "request_failed" };
    return json;
  } catch {
    return { error: "network" };
  }
}

/** Fire-and-forget write: never blocks the UI, swallows all errors. */
export function fireLead(
  session_id: string,
  fields: LeadFields,
  event?: LeadEvent,
): void {
  void postLead(session_id, fields, event);
}

/** Live handle-availability check for the claim step. Fails open (true). */
export async function checkHandle(handle: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/handle?handle=${encodeURIComponent(handle)}`);
    const json = (await res.json()) as { available?: boolean };
    return Boolean(json.available);
  } catch {
    return true;
  }
}
