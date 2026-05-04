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

export type DayEvent = {
  title: string;
  timeLabel: string;
};

export async function createShootEvent(args: {
  dateString: string;
  title: string;
  description: string;
}): Promise<{ id: string; htmlLink: string } | null> {
  const calendar = await getAuthedCalendarClient();
  if (!calendar) return null;

  // All-day events: end.date is exclusive (the day after the shoot).
  const endDate = new Date(`${args.dateString}T00:00:00.000Z`);
  endDate.setUTCDate(endDate.getUTCDate() + 1);
  const endDateString = endDate.toISOString().slice(0, 10);

  const result = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: args.title,
      description: args.description,
      start: { date: args.dateString },
      end: { date: endDateString },
    },
  });

  const id = result.data.id;
  const htmlLink = result.data.htmlLink;
  if (!id || !htmlLink) {
    throw new Error("Calendar event response missing id or htmlLink");
  }
  return { id, htmlLink };
}

// "2026-06-15T09:00:00-07:00" -> "9am". Uses the local time as set in Google
// rather than re-converting to the server's TZ, which would be UTC on Vercel.
function formatLocalTime(dateTime: string): string {
  const match = /T(\d{2}):(\d{2})/.exec(dateTime);
  if (!match) return "";
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = hours >= 12 ? "pm" : "am";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return minutes === 0
    ? `${displayHours}${period}`
    : `${displayHours}:${minutes.toString().padStart(2, "0")}${period}`;
}

export async function getDayEvents(
  dateString: string,
): Promise<DayEvent[] | null> {
  const calendar = await getAuthedCalendarClient();
  if (!calendar) return null;

  const start = new Date(`${dateString}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  try {
    // List all calendars then events.list across each. Querying just "primary"
    // misses events on secondary or "other" calendars; Kenny has work + personal.
    const list = await calendar.calendarList.list();
    const calendarIds =
      list.data.items
        ?.map((c) => c.id)
        .filter((id): id is string => Boolean(id)) ?? ["primary"];

    const perCalendar = await Promise.all(
      calendarIds.map((id) =>
        calendar.events.list({
          calendarId: id,
          timeMin: start.toISOString(),
          timeMax: end.toISOString(),
          singleEvents: true,
          showDeleted: false,
        }),
      ),
    );

    const events: DayEvent[] = [];
    for (const result of perCalendar) {
      for (const item of result.data.items ?? []) {
        if (item.status === "cancelled") continue;
        // "transparent" = the event is marked "Free" in Google; freebusy ignored
        // these too, so keep parity.
        if (item.transparency === "transparent") continue;
        const selfAttendee = item.attendees?.find((a) => a.self);
        if (selfAttendee?.responseStatus === "declined") continue;

        const title = item.summary?.trim() || "(no title)";
        const allDay = Boolean(item.start?.date);
        let timeLabel = "all day";
        if (!allDay && item.start?.dateTime) {
          const startLabel = formatLocalTime(item.start.dateTime);
          const endLabel = item.end?.dateTime
            ? formatLocalTime(item.end.dateTime)
            : "";
          timeLabel = endLabel ? `${startLabel}–${endLabel}` : startLabel;
        }
        events.push({ title, timeLabel });
      }
    }

    return events;
  } catch (err) {
    console.error("getDayEvents error:", err);
    return null;
  }
}
