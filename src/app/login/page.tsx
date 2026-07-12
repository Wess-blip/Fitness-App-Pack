"use client";

import Link from "next/link";
import { LogIn, Database, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/browser";
import { useAppData } from "@/components/app-data-provider";

export default function LoginPage() {
  const configured = isSupabaseConfigured();
  const { user, signOut } = useAppData();
  const [error, setError] = useState("");
  async function signInGoogle() {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    setError("");
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (authError) setError(authError.message);
  }
  return (
    <div className="auth-screen">
      <Link href="/" className="back-link"><ArrowLeft size={17} /> Back</Link>
      <section className="auth-card">
        <div className="brand-mark">FL</div>
        <div className="eyebrow">FormLab account</div>
        <h1>Keep your plan and logs synced</h1>
        <p>Use Google to save profile settings, goals, projections and logs across devices. Local mode still works on this phone or browser.</p>
        {user ? <><div className="notice">Signed in as {user.email}</div><Link className="button accent full" href="/setup">Open my profile</Link><button className="button secondary full" onClick={() => void signOut()}>Sign out</button></> : <button className="button accent full" disabled={!configured} onClick={() => void signInGoogle()}><LogIn size={19} /> Continue with Google</button>}
        {!configured && <div className="notice warning">Google login is included but Supabase environment variables have not been added to Netlify yet.</div>}
        {error && <div className="notice warning">Google sign-in failed: {error}</div>}
        <Link className="button secondary full" href="/"><Database size={18} /> Continue in local mode</Link>
      </section>
    </div>
  );
}
