import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { serverClient, authConfigured } from "@/lib/supabase/server";
export class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }
export type Access = { client: SupabaseClient; userId: string; role: "owner" | "partner"; workspaceId: string };
export async function requireMembership(request: Request, workspaceId: string): Promise<Access> {
  if (!authConfigured()) throw new ApiError("Supabase authentication is not configured.", 503);
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  const client = await serverClient(token);
  const { data: { user }, error } = token ? await client.auth.getUser(token) : await client.auth.getUser();
  if (error || !user) throw new ApiError("Sign in to access this workspace.", 401);
  const membership = await client.from("workspace_members").select("role").eq("workspace_id", workspaceId).eq("user_id", user.id).eq("active", true).maybeSingle();
  if (membership.error || !membership.data) throw new ApiError("Workspace access denied.", 403);
  return { client, userId: user.id, role: membership.data.role, workspaceId };
}
export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = process.env.APP_ORIGIN || new URL(request.url).origin;
  if (origin && origin !== expected) throw new ApiError("Cross-origin mutation denied.", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new ApiError("JSON content type required.", 415);
}
export async function bodyJSON(request: Request): Promise<unknown> {
  requireSameOrigin(request);
  if (Number(request.headers.get("content-length")) > 150000) throw new ApiError("Request is too large.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError("JSON body required.", 400);
  const chunks: Uint8Array[] = []; let bytes = 0;
  while (true) { const { done, value } = await reader.read(); if (done) break; bytes += value.length; if (bytes > 150000) { await reader.cancel(); throw new ApiError("Request is too large.", 413); } chunks.push(value); }
  const body = Buffer.concat(chunks).toString("utf8");
  try { return JSON.parse(body); } catch { throw new ApiError("Invalid JSON.", 400); }
}
export async function api(request: Request, workspaceId: string, action: (access: Access) => Promise<unknown>) {
  try {
    const access = await requireMembership(request, workspaceId);
    const result = await action(access);
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch(e) {
    const status = e instanceof ApiError ? e.status : 500;
    return NextResponse.json({ error: e instanceof ApiError ? e.message : "Operation failed. No successful save is confirmed." }, { status, headers: { "Cache-Control": "private, no-store" } });
  }
}
