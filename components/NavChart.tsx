"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { NavPoint } from "@/hooks/useNavHistory";

interface NavChartProps {
  data: NavPoint[];
  loading?: boolean;
}

interface TooltipPayload {
  value: number;
  payload: NavPoint;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-2 border border-border rounded-lg px-3 py-2 shadow-card text-xs">
      <div className="text-text-muted mb-1">{label}</div>
      <div className="font-semibold text-text-primary">
        ${payload[0].value.toFixed(6)}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse h-full flex flex-col justify-end gap-1 px-2">
      {[70, 50, 80, 60, 90, 75, 85].map((h, i) => (
        <div
          key={i}
          className="bg-surface-3 rounded"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

export default function NavChart({ data, loading }: NavChartProps) {
  if (loading) {
    return (
      <div className="h-56 flex items-center justify-center">
        <Skeleton />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="h-56 flex items-center justify-center text-text-muted text-sm">
        No historical data available
      </div>
    );
  }

  const minPrice = Math.min(...data.map((d) => d.price));
  const maxPrice = Math.max(...data.map((d) => d.price));
  const padding = (maxPrice - minPrice) * 0.05 || 0.001;

  return (
    <ResponsiveContainer width="100%" height={224}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#2A2A3A"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fill: "#60607A", fontSize: 11, fontFamily: "inherit" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[minPrice - padding, maxPrice + padding]}
          tick={{ fill: "#60607A", fontSize: 11, fontFamily: "inherit" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `$${v.toFixed(3)}`}
          width={64}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="price"
          stroke="#00D4FF"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#00D4FF", strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
