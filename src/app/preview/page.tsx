import Workbench from "@/components/Workbench";
import { previewData } from "@/lib/data/reference";
export const dynamic = "force-dynamic";
export default function Preview() { return <Workbench initialData={previewData} preview userId={null} />; }
