import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { slackConfigured, isLeadEvent, postLeadNotification } from "@/lib/slack";

// service_role must stay server-side; never statically optimise.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Only these columns may be written from the funnel. Anything else is ignored.
const ALLOWED = new Set([
  "booking_method",
  "other_system",
  "headache",
  "handle",
  "email",
  "fbclid",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "reached_success",
  "clicked_download",
  "download_store",
  "answers",
  "user_agent",
]);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const session_id = body.session_id;
  if (typeof session_id !== "string" || !session_id) {
    return NextResponse.json({ error: "missing_session_id" }, { status: 400 });
  }

  // Not configured → no-op so the funnel never breaks (PostHog/Meta still run).
  if (!supabaseAdmin) return NextResponse.json({ ok: true, skipped: true });

  const row: Record<string, unknown> = { session_id };
  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED.has(key) && value !== undefined) row[key] = value;
  }

  // Select the merged row back so the Slack message has the full session
  // context (handle/headache/etc.) and we can read/store the thread ts.
  const { data, error } = await supabaseAdmin
    .from("leads")
    .upsert(row, { onConflict: "session_id" })
    .select()
    .single();

  if (error) {
    // 23505 here can only be the lower(handle) unique index — session_id
    // collisions are the upsert target and become an UPDATE, not an error.
    if (error.code === "23505") {
      return NextResponse.json({ error: "handle_taken" }, { status: 409 });
    }
    console.error("[/api/lead] upsert failed:", error.code, error.message);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  // Slack ping on the four funnel milestones. Threaded per session: the first
  // milestone posts the parent and we persist its ts; later ones reply under it.
  // Never let a Slack failure surface to the funnel.
  const { event } = body;
  if (slackConfigured && isLeadEvent(event) && data) {
    try {
      const { ts } = await postLeadNotification(event, data);
      if (ts && !data.slack_thread_ts) {
        await supabaseAdmin
          .from("leads")
          .update({ slack_thread_ts: ts })
          .eq("session_id", session_id);
      }
    } catch (e) {
      console.error("[/api/lead] slack notify failed:", e);
    }
  }

  return NextResponse.json({ ok: true });
}
