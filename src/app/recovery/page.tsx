"use client";
import { useState } from "react";
import Link from "next/link";
import { browserClient } from "@/lib/supabase/browser";
export default function Recovery() {
  const [message, setMessage] = useState("");
  return <main id="main" className="auth-shell workbench-app"><Link className="wordmark" href="/">Fieldwork</Link><section className="auth-form"><h1>Set a new password</h1><form method="post" onSubmit={async e => {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password"));
    try {
      const client = browserClient();
      const user = await client.auth.getUser();
      if (!user.data.user || user.error) throw new Error("A valid recovery session is required.");
      const result = await client.auth.updateUser({ password });
      if (result.error) throw new Error("Password could not be updated.");
      setMessage("Password updated. Return to your workspace.");
    } catch(e) { setMessage(e instanceof Error ? e.message : "Recovery unavailable."); }
  }}><label>New password<input name="password" type="password" autoComplete="new-password" minLength={12} required /></label><button className="primary">Update password</button></form><p role="status">{message}</p><Link href="/">Return to Fieldwork</Link></section></main>;
}
