import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase browser client. Null when env vars aren't set, so lead capture
 * gracefully no-ops until credentials are added (PostHog + Meta still run).
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;
