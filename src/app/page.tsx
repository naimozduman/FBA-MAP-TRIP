import { authConfigured, serverClient } from "@/lib/supabase/server";
import { workspaceData } from "@/lib/data/workspace";
import FieldworkApp from "@/components/fieldwork/app";
import Workbench from "@/components/Workbench";
import SignIn from "@/components/auth/SignIn";
import Link from "next/link";
import type { WorkspaceData } from "@/lib/model";
export const dynamic = "force-dynamic";
async function loadWorkspace(): Promise<{ status: "signed-out" | "nonmember" | "unavailable" } | { status: "ready"; data: WorkspaceData; userId: string }> {
  try {
    const client = await serverClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return { status: "signed-out" };
    const membership = await client.from("workspace_members").select("workspace_id").eq("user_id", user.id).eq("active", true).limit(1).maybeSingle();
    if (membership.error || !membership.data) return { status: "nonmember" };
    return { status: "ready", data: await workspaceData(client, membership.data.workspace_id), userId: user.id };
  } catch {
    return { status: "unavailable" };
  }
}
export default async function Home() {
  if (!authConfigured()) return <FieldworkApp />;
  const result = await loadWorkspace();
  if (result.status === "ready") return <Workbench initialData={result.data} preview={false} userId={result.userId} />;
  if (result.status === "signed-out") return <SignIn configured />;
  return <main id="main" className="setup-page workbench-app"><h1>Fieldwork</h1><h2>{result.status === "nonmember" ? "No active workspace" : "Workspace unavailable"}</h2><p>{result.status === "nonmember" ? "Your account is signed in, but has no active Fieldwork membership. The owner must add your verified account." : "Authentication, environment isolation or data access could not be verified. No private data or successful login is assumed."}</p><Link href="/sign-in">Account options</Link></main>;
}
