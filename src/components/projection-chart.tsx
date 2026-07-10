"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

export function ProjectionChart({ data }: { data: Array<{ week: number; weight: number }> }) {
  return (
    <div className="chart-box" aria-label="Projected weight chart">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
          <YAxis domain={["dataMin - 1", "dataMax + 1"]} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => [`${Number(value).toFixed(1)} kg`, "Weight"]} labelFormatter={(label) => `Week ${label}`} />
          <Line type="monotone" dataKey="weight" stroke="var(--accent)" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
