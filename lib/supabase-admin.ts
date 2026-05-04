import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

// Server-only client that uses the service-role key, bypassing RLS. Use this
// for operations that run outside an authenticated user context (e.g. the
// public /submit flow needs to write the AI draft back to the inquiry without
// the user being logged in).
//
// NEVER expose the service-role key to the browser. This module must only be
// imported from server-side code.
export function createSupabaseAdminClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
