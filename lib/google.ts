import { google } from "googleapis";
import { createSupabaseServerClient } from "./supabase-server";

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
];

const REFRESH_TOKEN_KEY = "google_refresh_token";

export const createOAuthClient = (redirectUri: string) =>
  new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  );

export async function getStoredRefreshToken(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", REFRESH_TOKEN_KEY)
    .maybeSingle();
  return data?.value ?? null;
}

export async function saveRefreshToken(refreshToken: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("app_settings").upsert({
    key: REFRESH_TOKEN_KEY,
    value: refreshToken,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Failed to save refresh token: ${error.message}`);
}

export async function deleteRefreshToken(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.from("app_settings").delete().eq("key", REFRESH_TOKEN_KEY);
}

export async function isCalendarConnected(): Promise<boolean> {
  return (await getStoredRefreshToken()) !== null;
}
