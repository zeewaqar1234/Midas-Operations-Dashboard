"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { DailyFlow } from "@/hooks/useExplorerData";
import { formatCompact } from "@/lib/formatters";

interface FlowChartProps {
  data: DailyFlow[];
  loading?: boolean;
}

interface TooltipPayload {
  value: number;
  name: string;
  color: string;
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
  const minted = payload.find((p) => p.name === "minted")?.value ?? 0;
  const burned = Math.abs(payload.find((p) => p.name === "burned")?.value ?? 0);
  const net = minted - burned;
  return (
    <div className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs shadow-card space-y-1">
      <div className="text-text-muted mb-1">{label}</div>
      <div className="flex gap-2">
        <span className="text-mint">+{formatCompact(minted)} minted</span>
      </div>
      <div className="flex gap-2">
        <span className="text-burn">−{formatCompact(burned)} burned</span>
      </div>
      <div className={`font-semibold border-t border-border pt-1 ${net >= 0 ? "text-mint" : "text-burn"}`}>
        Net: {net >= 0 ? "+" : ""}{formatCompact(net)}
      </div>
    </div>
  );
}

export default function FlowChart({ data, loading }: FlowChartProps) {
  if (loading) {
    return (
      <div className="h-48 flex items-end gap-1 px-2 pb-2">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="flex-1 animate-pulse rounded-t bg-surface-3"
            style={{ height: `${30 + Math.random() * 60}%` }}
          />
        ))}
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="h-48 flex items-center justify-center text-text-muted text-sm">
        No flow data available
      </div>
    );
  }

  // Only show every 5th date label to avoid crowding
  const tickDates = data
    .filter((_, i) => i % 5 === 0 || i === data.length - 1)
    .map((d) => d.date);

  return (
    <ResponsiveContainer width="100%" height={192}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }} barCategoryGap="25%">
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3A" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "#60607A", fontSize: 10, fontFamily: "inherit" }}
          tickLine={false}
          axisLine={false}
          ticks={tickDates}
        />
        <YAxis
          tick={{ fill: "#60607A", fontSize: 10, fontFamily: "inherit" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => formatCompact(Math.abs(v))}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke="#2A2A3A" />
        <Bar dataKey="minted" fill="#00C48C" opacity={0.85} radius={[2, 2, 0, 0]} stackId="flow" />
        <Bar dataKey="burned" fill="#FF4444" opacity={0.85} radius={[0, 0, 2, 2]} stackId="flow" />
      </BarChart>
    </ResponsiveContainer>
  );
}
