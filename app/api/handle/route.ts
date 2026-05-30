import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const handle = new URL(req.url).searchParams.get("handle");
  if (!handle) {
    return NextResponse.json({ available: false, error: "missing_handle" }, { status: 400 });
  }

  // Not configured → assume available so the claim step never blocks.
  if (!supabaseAdmin) return NextResponse.json({ available: true });

  // Handles are stored already-cleansed (lowercase, [a-z0-9._]); compare on the
  // lowered value. .eq (not .ilike) avoids LIKE treating "_" as a wildcard.
  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("id")
    .eq("handle", handle.toLowerCase())
    .limit(1);

  if (error) {
    console.error("[/api/handle] lookup failed:", error.code, error.message);
    return NextResponse.json({ available: true }); // fail open
  }

  return NextResponse.json({ available: (data?.length ?? 0) === 0 });
}
