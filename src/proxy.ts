import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { verifyEnvironment } from '@/lib/supabase/environment';
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;
  try { verifyEnvironment(); } catch { return NextResponse.json({error:'Deployment/data boundary could not be verified.'},{status:503,headers:{'Cache-Control':'no-store'}}); }
  const client = createServerClient(url, key, { cookies: {
    getAll: () => request.cookies.getAll(),
    setAll: values => {
      values.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({ request });
      values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    }
  } });
  await client.auth.getUser();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = { matcher: ["/api/workspaces/:path*", "/sign-in", "/recovery", "/auth/:path*"] };
