import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { authConfigured, verifyEnvironment } from './environment';
export { authConfigured, verifyEnvironment } from './environment';
export async function serverClient(bearer?: string) {
  if (!authConfigured()) throw new Error("Supabase authentication is not configured.");
  verifyEnvironment();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!, key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  if (bearer) return createClient(url, key, { global: { headers: { Authorization: "Bearer " + bearer } }, auth: { persistSession: false, autoRefreshToken: false } });
  const jar = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: values => {
        try { values.forEach(({ name, value, options }) => jar.set(name, value, options)); }
        catch { /* Cookie refresh is also performed by the Next.js proxy. */ }
      }
    }
  });
}
