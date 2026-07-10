import Link from "next/link";
import { Activity, Beef, Flame, Scale, ChevronRight } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { ProjectionChart } from "@/components/projection-chart";
import { demoActivity, demoGoal, demoProfile } from "@/data/demo";
import { calculateTdee, projectBodyComposition } from "@/lib/engine";

export default function HomePage() {
  const nutrition = { calories: 2224, proteinG: 180, carbsG: 238.5, fatG: 70 };
  const tdee = calculateTdee(demoProfile, nutrition, demoActivity);
  const projection = projectBodyComposition({
    startDate: "2026-07-10",
    profile: demoProfile,
    goal: demoGoal,
    activity: demoActivity,
    weeks: 24,
  });
  const chartData = projection.points.map((point) => ({ week: point.week, weight: Number(point.weightKg.toFixed(2)) }));
  const last = projection.points.at(-1)!;

  return (
    <>
      <header className="page-header">
        <div>
          <div className="eyebrow">Today</div>
          <h1>Good morning</h1>
          <p style={{ margin: 0 }}>Your plan is on track. Keep today simple.</p>
        </div>
        <span className="pill">Engine v1.0</span>
      </header>

      <section className="metric-grid">
        <MetricCard label="Calories" value="1,340 / 2,224" detail="884 kcal remaining" icon={<Flame size={16} />} />
        <MetricCard label="Protein" value="112 / 180 g" detail="68 g remaining" icon={<Beef size={16} />} />
        <MetricCard label="Weight" value="98.3 kg" detail="7-day trend 97.8 kg" icon={<Scale size={16} />} />
        <MetricCard label="TDEE" value={`${Math.round(tdee.predictedTdeeKcal)} kcal`} detail="Model estimate · calibration pending" icon={<Activity size={16} />} />
      </section>

      <section className="section card">
        <div className="row">
          <div><div className="eyebrow">Next workout</div><h2 style={{ marginTop: 5 }}>Push Day · Tuesday</h2></div>
          <Link className="button secondary" href="/plan">Open <ChevronRight size={16} /></Link>
        </div>
        <p className="small">5 exercises · approximately 55 minutes · treadmill optional</p>
      </section>

      <section className="section card">
        <div className="row">
          <div><div className="eyebrow">Expected projection</div><h2 style={{ marginTop: 5 }}>Toward 15% body fat</h2></div>
          <span className="pill">{last.weightKg.toFixed(1)} kg</span>
        </div>
        <ProjectionChart data={chartData} />
        <p className="small">The line recalculates as weight, intake and activity logs build a stronger rolling TDEE calibration.</p>
      </section>

      <section className="section notice">
        Apple Health can sync through the included iOS HealthKit bridge. The PWA itself cannot read HealthKit directly.
      </section>
    </>
  );
}
