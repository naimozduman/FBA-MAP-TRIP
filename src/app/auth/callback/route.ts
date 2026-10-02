import { NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase/server";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    try {
      const client = await serverClient();
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(url.searchParams.get("recovery") === "1" ? "/recovery" : "/", url.origin));
    } catch { /* A configuration/session failure must not create a mock session. */ }
  }
  return NextResponse.redirect(new URL("/sign-in?error=callback", url.origin));
}
