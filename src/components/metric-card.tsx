import type { ReactNode } from "react";

export function MetricCard({ label, value, detail, icon, tone = "default" }: { label: string; value: string; detail?: string; icon?: ReactNode; tone?: "default" | "blue" | "violet" | "orange" | "teal" }) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <div className="metric-label">{icon}{label}</div>
      <div className="metric-value">{value}</div>
      {detail && <div className="metric-detail">{detail}</div>}
    </article>
  );
}
