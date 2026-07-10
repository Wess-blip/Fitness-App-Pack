import Link from "next/link";
import { ChevronRight, HeartPulse, Settings2, ShieldCheck, Download } from "lucide-react";

const items = [
  { title: "Apple Health connection", detail: "Use the included iOS HealthKit bridge", icon: HeartPulse, href: "#apple-health" },
  { title: "Model settings", detail: "Review engine version and editable thresholds", icon: Settings2, href: "/admin/model" },
  { title: "Privacy and access", detail: "Supabase RLS and private image storage", icon: ShieldCheck, href: "#privacy" },
  { title: "Export my data", detail: "CSV/JSON endpoint scaffold included", icon: Download, href: "#export" },
];

export default function MorePage() {
  return (
    <>
      <header className="page-header"><div><div className="eyebrow">Settings</div><h1>More</h1><p style={{ margin: 0 }}>Connections, privacy and model controls.</p></div></header>
      <div className="list">{items.map(({ title, detail, icon: Icon, href }) => <Link className="list-item row" href={href} key={title}><div className="row" style={{ justifyContent: "flex-start" }}><Icon size={20} /><div><strong>{title}</strong><div className="small muted">{detail}</div></div></div><ChevronRight size={18} /></Link>)}</div>
      <section id="apple-health" className="section card"><div className="eyebrow">HealthKit restriction</div><h2 style={{ marginTop: 6 }}>Why a small iPhone bridge is included</h2><p className="small">HealthKit data is permission-gated inside Apple platforms. A Netlify-hosted website cannot call HealthKit directly. The pack includes Swift code that reads authorized weight, active energy, steps and workouts, then posts them to the secure import endpoint.</p></section>
    </>
  );
}
