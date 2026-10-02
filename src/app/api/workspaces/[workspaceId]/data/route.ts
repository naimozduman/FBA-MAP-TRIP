import { api } from "@/lib/auth/api";
import { workspaceData } from "@/lib/data/workspace";
export async function GET(request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  return api(request, workspaceId, ({ client }) => workspaceData(client, workspaceId));
}
