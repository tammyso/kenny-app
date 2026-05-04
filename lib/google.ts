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

async function getAuthedCalendarClient() {
  const refreshToken = await getStoredRefreshToken();
  if (!refreshToken) return null;
  // The OAuth2 client refreshes the access token automatically when given a
  // refresh token; the redirect URI is irrelevant for token refresh.
  const oauth = createOAuthClient("unused");
  oauth.setCredentials({ refresh_token: refreshToken });
  return google.calendar({ version: "v3", auth: oauth });
}

export type AvailabilityStatus = "free" | "busy";

export async function getDayAvailability(
  dateString: string,
): Promise<AvailabilityStatus | null> {
  const calendar = await getAuthedCalendarClient();
  if (!calendar) return null;

  const start = new Date(`${dateString}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  try {
    const result = await calendar.freebusy.query({
      requestBody: {
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        items: [{ id: "primary" }],
      },
    });
    const busy = result.data.calendars?.primary?.busy ?? [];
    console.log("[freebusy]", {
      dateString,
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      calendarsKeys: Object.keys(result.data.calendars ?? {}),
      busyCount: busy.length,
      busy,
    });
    return busy.length > 0 ? "busy" : "free";
  } catch (err) {
    console.error("getDayAvailability error:", err);
    return null;
  }
}
