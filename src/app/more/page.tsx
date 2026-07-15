import Link from "next/link";
import { ChevronRight, HeartPulse, ShieldCheck } from "lucide-react";
import { AccountStatusCard } from "@/components/account-status-card";

const items = [
  { title: "Apple Health connection", detail: "Use the included iOS HealthKit bridge", icon: HeartPulse, href: "#apple-health" },
  { title: "Privacy and access", detail: "Supabase RLS and private image storage", icon: ShieldCheck, href: "#privacy" },
];

export default function MorePage() {
  return (
    <>
      <header className="page-header"><div><div className="eyebrow">Settings</div><h1>More</h1><p style={{ margin: 0 }}>Connections and privacy information.</p></div></header>
      <AccountStatusCard />
      <div className="list">{items.map(({ title, detail, icon: Icon, href }) => <Link className="list-item row" href={href} key={title}><div className="row" style={{ justifyContent: "flex-start" }}><Icon size={20} /><div><strong>{title}</strong><div className="small muted">{detail}</div></div></div><ChevronRight size={18} /></Link>)}</div>
      <section id="apple-health" className="section card"><div className="eyebrow">HealthKit restriction</div><h2 style={{ marginTop: 6 }}>Why a small iPhone bridge is included</h2><p className="small">HealthKit data is permission-gated inside Apple platforms. A Netlify-hosted website cannot call HealthKit directly. The pack includes Swift code that reads authorized weight, active energy, steps and workouts, then posts them to the secure import endpoint.</p></section>
      <section id="privacy" className="section card"><div className="eyebrow">Your data</div><h2 style={{ marginTop: 6 }}>Private by default</h2><p className="small">Signed-in data is stored under your Supabase user ID. Row-level security prevents ordinary users from reading or changing another user&apos;s records. Keep your Google account and project-owner accounts protected with two-factor authentication.</p></section>
    </>
  );
}
