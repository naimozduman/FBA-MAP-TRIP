"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/browser";
export default function SignIn({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState(""), [busy, setBusy] = useState(false), [recovery, setRecovery] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const values = new FormData(event.currentTarget);
    try {
      const client = browserClient(), email = String(values.get("email"));
      const result = recovery
        ? await client.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/auth/callback?recovery=1" })
        : await client.auth.signInWithPassword({ email, password: String(values.get("password")) });
      if (result.error) throw new Error(recovery ? "Recovery could not be requested. Check the configured email delivery service." : "Sign-in failed. Check your account credentials.");
      if (recovery) setMessage("If the account is eligible, the configured service will send recovery instructions. Delivery is not confirmed here.");
      else { router.replace("/"); router.refresh(); }
    } catch(e) { setMessage(e instanceof Error ? e.message : "Sign-in unavailable."); }
    finally { setBusy(false); }
  }
  return <main id="main" className="auth-shell workbench-app">
    <Link className="wordmark" href="/">Fieldwork</Link>
    <section className="auth-form">
      <h1>{recovery ? "Recover your account" : "Back to the field."}</h1>
      <p>Separate accounts. One private workspace.</p>
      {!configured && <p className="notice">Supabase is not configured. Login and saving are unavailable; no substitute account will be created.</p>}
      <form method="post" onSubmit={submit}>
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
        {!recovery && <label>Password<input name="password" type="password" autoComplete="current-password" required minLength={8} /></label>}
        <button className="primary" disabled={busy || !configured}>{busy ? "Please wait…" : recovery ? "Request recovery" : "Sign in"}</button>
      </form>
      {message && <p role="status" className="notice">{message}</p>}
      <button className="text-button" onClick={() => { setRecovery(!recovery); setMessage(""); }}>{recovery ? "Back to sign in" : "Forgot your password?"}</button>
      <p>Invite-only. Public sign-up is not available.</p>
      <Link href="/preview">Explore the unsaved reference preview</Link>
    </section>
  </main>;
}
