import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client (service_role). NEVER import this from client
 * components — the service_role key bypasses RLS and must never reach the
 * browser. Env vars are intentionally un-prefixed (no NEXT_PUBLIC_).
 *
 * Null when unconfigured, so the API routes degrade to a no-op and the funnel
 * keeps working without credentials (mirrors the PostHog/Meta fail-safe).
 */
const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin: SupabaseClient | null =
  url && serviceRoleKey
    ? createClient(url, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;
