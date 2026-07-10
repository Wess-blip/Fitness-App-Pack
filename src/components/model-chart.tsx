"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type ChartSeries = { key: string; label: string; unit: string; color: string; dash?: string };
export function ModelChart({ data, series, xKey = "week", height = 260 }: { data: Array<Record<string, string | number>>; series: ChartSeries[]; xKey?: string; height?: number }) {
  return (
    <div className="chart-box" style={{ minHeight: height }}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 12, right: 10, left: -16, bottom: 2 }}>
          <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 3" />
          <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
          <YAxis domain={["auto", "auto"]} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
          <Tooltip formatter={(value, name) => {
            const item = series.find((s) => s.key === name);
            return [`${Number(value).toFixed(item?.unit === "%" ? 1 : 1)} ${item?.unit ?? ""}`, item?.label ?? String(name)];
          }} labelFormatter={(label) => xKey === "week" ? `Week ${label}` : String(label)} />
          <Legend formatter={(value) => series.find((s) => s.key === value)?.label ?? value} />
          {series.map((item) => <Line key={item.key} type="monotone" dataKey={item.key} stroke={item.color} strokeWidth={2.7} dot={false} strokeDasharray={item.dash} />)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
