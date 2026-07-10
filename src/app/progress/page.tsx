import { WeightChart } from "@/components/weight-chart";
import { demoWeightTrend } from "@/data/demo";
import { MetricCard } from "@/components/metric-card";

export default function ProgressPage() {
  return (
    <>
      <header className="page-header"><div><div className="eyebrow">Trend first</div><h1>Progress</h1><p style={{ margin: 0 }}>Raw measurements remain visible; decisions use trends and confidence.</p></div></header>
      <section className="metric-grid">
        <MetricCard label="7-day trend" value="97.8 kg" detail="−0.4 kg vs prior week" />
        <MetricCard label="Waist" value="108.0 cm" detail="Next measurement Sunday" />
        <MetricCard label="Body fat" value="29.4%" detail="Medium confidence" />
        <MetricCard label="TDEE calibration" value="Low" detail="More complete days needed" />
      </section>
      <section className="section card"><div className="row"><h2>Weight trend</h2><span className="pill">Morning weights</span></div><WeightChart data={demoWeightTrend} /></section>
      <section className="section notice">The rolling calibration requires at least 14 days, 10 morning weigh-ins, 10 completed intake days and at least 70% intake coverage.</section>
    </>
  );
}
