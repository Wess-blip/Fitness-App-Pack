"use client";

import Link from "next/link";
import { LogIn, Database, ArrowLeft } from "lucide-react";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/browser";

export default function LoginPage() {
  const configured = isSupabaseConfigured();
  async function signInGoogle() {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }
  return (
    <div className="auth-screen">
      <Link href="/" className="back-link"><ArrowLeft size={17} /> Back</Link>
      <section className="auth-card">
        <div className="brand-mark">FL</div>
        <div className="eyebrow">FormLab account</div>
        <h1>Keep your plan and logs synced</h1>
        <p>Use Google to save profile settings, goals, projections and logs across devices. Local mode still works on this phone or browser.</p>
        <button className="button accent full" disabled={!configured} onClick={() => void signInGoogle()}><LogIn size={19} /> Continue with Google</button>
        {!configured && <div className="notice warning">Google login is included but Supabase environment variables have not been added to Netlify yet.</div>}
        <Link className="button secondary full" href="/"><Database size={18} /> Continue in local mode</Link>
      </section>
    </div>
  );
}
