import SignIn from "@/components/auth/SignIn";
import { safeAuthConfigured } from "@/lib/supabase/environment";
export const dynamic = "force-dynamic";
export default function SignInPage() { return <SignIn configured={safeAuthConfigured()} />; }
