import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { GOOGLE_SCOPES, createOAuthClient } from "@/lib/google";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const redirectUri = `${new URL(request.url).origin}/api/google/callback`;
  const oauth = createOAuthClient(redirectUri);

  // prompt=consent forces Google to always return a refresh_token, even on
  // re-authorization. Without it, a second connect from the same account
  // returns only an access_token and we can't store anything reusable.
  const authUrl = oauth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_SCOPES,
  });

  return NextResponse.redirect(authUrl);
}
