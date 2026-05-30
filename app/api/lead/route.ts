import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

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

  const { error } = await supabaseAdmin
    .from("leads")
    .upsert(row, { onConflict: "session_id" });

  if (error) {
    // 23505 here can only be the lower(handle) unique index — session_id
    // collisions are the upsert target and become an UPDATE, not an error.
    if (error.code === "23505") {
      return NextResponse.json({ error: "handle_taken" }, { status: 409 });
    }
    console.error("[/api/lead] upsert failed:", error.code, error.message);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
