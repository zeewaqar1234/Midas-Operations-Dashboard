"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { HolderEntry } from "@/hooks/useExplorerData";
import { truncateAddress } from "@/lib/formatters";

interface HolderChartProps {
  holders: HolderEntry[];
  loading?: boolean;
}

const COLORS = [
  "#00D4FF",
  "#00C48C",
  "#FFB800",
  "#FF6B6B",
  "#A855F7",
  "#60607A",
];

interface TooltipPayload {
  name: string;
  value: number;
  payload: { pctOfSupply: number; balance: number };
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs shadow-card">
      <div className="font-mono text-text-secondary mb-1">{d.name}</div>
      <div className="text-text-primary font-semibold">
        {d.payload.pctOfSupply.toFixed(2)}% of supply
      </div>
      <div className="text-text-muted">
        {d.payload.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })} tokens
      </div>
    </div>
  );
}

export default function HolderChart({ holders, loading }: HolderChartProps) {
  if (loading) {
    return (
      <div className="h-56 flex items-center justify-center">
        <div className="w-40 h-40 rounded-full border-8 border-surface-3 animate-pulse" />
      </div>
    );
  }

  if (!holders.length) {
    return (
      <div className="h-56 flex items-center justify-center text-text-muted text-sm">
        No holder data available
      </div>
    );
  }

  // Top 5 + "Others"
  const top5 = holders.slice(0, 5);
  const othersPct = holders.slice(5).reduce((s, h) => s + h.pctOfSupply, 0);
  const data = [
    ...top5.map((h) => ({
      name: h.label ?? truncateAddress(h.address),
      pctOfSupply: h.pctOfSupply,
      balance: h.balance,
    })),
    ...(othersPct > 0
      ? [{ name: "Others", pctOfSupply: othersPct, balance: 0 }]
      : []),
  ];

  return (
    <ResponsiveContainer width="100%" height={224}>
      <PieChart>
        <Pie
          data={data}
          dataKey="pctOfSupply"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
          strokeWidth={0}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={0.9} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value: string) => (
            <span style={{ color: "#9090A8", fontSize: 11 }}>{value}</span>
          )}
          iconSize={8}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
