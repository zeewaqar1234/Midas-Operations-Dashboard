"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
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
    <div className="bg-surface-2 border border-border/70 rounded-[8px] px-3 py-2 shadow-card text-xs">
      <div className="text-text-muted mb-1">{label}</div>
      <div className="font-semibold text-text-primary tabular-nums">
        ${payload[0].value.toFixed(6)}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="h-56 w-full animate-pulse rounded-[8px] bg-surface-3" />
  );
}

export default function NavChart({ data, loading }: NavChartProps) {
  if (loading) return <Skeleton />;

  if (!data.length) {
    return (
      <div className="h-56 flex items-center justify-center text-text-muted text-sm">
        No historical data available
      </div>
    );
  }

  const prices = data.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = (maxPrice - minPrice) * 0.08 || 0.001;

  // Include $1.00 in domain so the reference line is always visible
  const domainMin = Math.min(minPrice - padding, 0.998);
  const domainMax = maxPrice + padding;

  return (
    <ResponsiveContainer width="100%" height={224}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#2A3350"
          vertical={false}
          opacity={0.6}
        />
        <XAxis
          dataKey="date"
          tick={{ fill: "#64748B", fontSize: 11, fontFamily: "Inter, sans-serif" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[domainMin, domainMax]}
          tick={{ fill: "#64748B", fontSize: 11, fontFamily: "Inter, sans-serif" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `$${v.toFixed(3)}`}
          width={64}
        />
        <Tooltip content={<CustomTooltip />} />

        {/* $1.00 reference line — shows yield accumulation above par */}
        <ReferenceLine
          y={1.0}
          stroke="#64748B"
          strokeDasharray="4 4"
          strokeWidth={1}
          label={{
            value: "$1.00 par",
            position: "insideTopLeft",
            fill: "#64748B",
            fontSize: 10,
            fontFamily: "Inter, sans-serif",
          }}
        />

        <Line
          type="monotone"
          dataKey="price"
          stroke="#3B82F6"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#3B82F6", strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
