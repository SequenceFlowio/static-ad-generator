"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface RoasPoint {
  date: string;
  roas: number;
}

export default function RoasChart({ data }: { data: RoasPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-gray-400 dark:text-gray-500">
        Geen data beschikbaar
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}x`} />
        <Tooltip formatter={(v) => [`${Number(v).toFixed(2)}x`, "ROAS"]} />
        <Line type="monotone" dataKey="roas" stroke="#C7F56F" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
