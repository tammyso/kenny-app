import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createOAuthClient, saveRefreshToken } from "@/lib/google";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/?calendar=error&message=${encodeURIComponent(error)}`, request.url),
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?calendar=missing_code", request.url));
  }

  const redirectUri = `${url.origin}/api/google/callback`;
  const oauth = createOAuthClient(redirectUri);

  try {
    const { tokens } = await oauth.getToken(code);
    if (!tokens.refresh_token) {
      return NextResponse.redirect(
        new URL("/?calendar=no_refresh_token", request.url),
      );
    }
    await saveRefreshToken(tokens.refresh_token);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.redirect(
      new URL(`/?calendar=exchange_failed&message=${encodeURIComponent(message)}`, request.url),
    );
  }

  return NextResponse.redirect(new URL("/?calendar=connected", request.url));
}
