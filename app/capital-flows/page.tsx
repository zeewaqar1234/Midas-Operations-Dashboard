"use client";

import { useState } from "react";
import {
  RefreshCw,
  AlertCircle,
  Filter,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  BarChart2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  useTransactions,
  type TokenFilter,
  type TxTypeFilter,
  type TimeRange,
} from "@/hooks/useTransactions";
import { useNavHistory } from "@/hooks/useNavHistory";
import TransactionTable from "@/components/TransactionTable";
import TxDecoder from "@/components/TxDecoder";
import { formatCompact, formatUSD } from "@/lib/formatters";

// ─── Filter pill ──────────────────────────────────────────────────────────────

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition-all duration-150 ${
        active
          ? "bg-accent/10 text-accent"
          : "bg-white text-text-muted border border-border hover:text-text-primary hover:border-accent/20"
      }`}
    >
      {children}
    </button>
  );
}

// ─── Flow Summary Cards — with avg deal size ──────────────────────────────────

function FlowSummaryCards({
  navPrice,
  getSummary,
  timeRange,
}: {
  navPrice: number | null;
  getSummary: ReturnType<typeof useTransactions>["getSummary"];
  timeRange: TimeRange;
}) {
  const s = getSummary(navPrice, timeRange);
  const rangeLabel = timeRange === "all" ? "All time" : `Last ${timeRange}`;

  const redemptionPressure =
    s.subscriptionCount + s.redemptionCount > 0
      ? (s.redemptionCount / (s.subscriptionCount + s.redemptionCount)) * 100
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Subscriptions */}
      <div className="card p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[8px] bg-success/10 flex items-center justify-center">
              <TrendingUp size={13} className="text-success" />
            </div>
            <span className="text-sm font-semibold text-text-primary">Subscriptions</span>
          </div>
          <span className="text-xs text-text-muted">{rangeLabel}</span>
        </div>
        <div>
          <div className="text-2xl font-semibold text-text-primary tabular-nums">
            {formatCompact(s.totalMinted)}
          </div>
          {s.totalMintedUSD != null && (
            <div className="text-sm text-success tabular-nums mt-0.5">
              {formatUSD(s.totalMintedUSD)}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs text-text-muted">
          <span>{s.subscriptionCount} transactions</span>
          {s.avgSubscriptionSize > 0 && (
            <span className="tabular-nums font-medium text-text-secondary">
              avg {formatCompact(s.avgSubscriptionSize)}
            </span>
          )}
        </div>
      </div>

      {/* Redemptions */}
      <div className="card p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[8px] bg-danger/10 flex items-center justify-center">
              <TrendingDown size={13} className="text-danger" />
            </div>
            <span className="text-sm font-semibold text-text-primary">Redemptions</span>
          </div>
          <span className="text-xs text-text-muted">{rangeLabel}</span>
        </div>
        <div>
          <div className="text-2xl font-semibold text-text-primary tabular-nums">
            {s.totalBurned > 0 ? formatCompact(s.totalBurned) : "—"}
          </div>
          {s.totalBurnedUSD != null && s.totalBurned > 0 && (
            <div className="text-sm text-danger tabular-nums mt-0.5">
              {formatUSD(s.totalBurnedUSD)}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs text-text-muted">
          <span>{s.redemptionCount} transactions</span>
          {s.avgRedemptionSize > 0 && (
            <span className="tabular-nums font-medium text-text-secondary">
              avg {formatCompact(s.avgRedemptionSize)}
            </span>
          )}
        </div>
      </div>

      {/* Net Capital Flow */}
      <div className="card p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[8px] bg-accent/10 flex items-center justify-center">
              <ArrowLeftRight size={13} className="text-accent" />
            </div>
            <span className="text-sm font-semibold text-text-primary">Net Flow</span>
          </div>
          <span className="text-xs text-text-muted">{rangeLabel}</span>
        </div>
        <div>
          <div className={`text-2xl font-semibold tabular-nums ${
            s.netFlow > 0 ? "text-success" : s.netFlow < 0 ? "text-danger" : "text-text-primary"
          }`}>
            {s.netFlow === 0
              ? "—"
              : `${s.netFlow > 0 ? "+" : ""}${formatCompact(s.netFlow)}`}
          </div>
          {s.totalMintedUSD != null && s.totalBurnedUSD != null && (
            <div className={`text-sm tabular-nums mt-0.5 ${
              s.netFlow > 0 ? "text-success" : s.netFlow < 0 ? "text-danger" : "text-text-muted"
            }`}>
              {s.netFlow !== 0
                ? `${s.netFlow > 0 ? "+" : ""}${formatUSD(s.totalMintedUSD - s.totalBurnedUSD)}`
                : "Neutral"}
            </div>
          )}
        </div>
        <div className="border-t border-border/50 pt-2 text-xs text-text-muted">
          {s.netFlowRatio != null && s.redemptionCount > 0
            ? `${s.netFlowRatio.toFixed(1)}× more subscriptions`
            : s.redemptionCount === 0 && s.subscriptionCount > 0
            ? "No redemptions this period"
            : "No activity"}
        </div>
      </div>

      {/* Redemption Pressure — operational risk view */}
      <div className="card p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-[8px] flex items-center justify-center ${
            redemptionPressure > 50 ? "bg-danger/10" : redemptionPressure > 25 ? "bg-warning/10" : "bg-success/10"
          }`}>
            <BarChart2 size={13} className={
              redemptionPressure > 50 ? "text-danger" : redemptionPressure > 25 ? "text-warning" : "text-success"
            } />
          </div>
          <span className="text-sm font-semibold text-text-primary">Redemption Pressure</span>
        </div>
        <div>
          <div className={`text-2xl font-semibold tabular-nums ${
            redemptionPressure > 50 ? "text-danger" : redemptionPressure > 25 ? "text-warning" : "text-success"
          }`}>
            {redemptionPressure.toFixed(0)}%
          </div>
          <div className="text-xs text-text-muted mt-0.5">of total transactions are redemptions</div>
        </div>
        <div className="border-t border-border/50 pt-2">
          <div className="w-full h-1.5 rounded-full bg-surface-3">
            <div
              className={`h-1.5 rounded-full transition-all ${
                redemptionPressure > 50 ? "bg-danger" : redemptionPressure > 25 ? "bg-warning" : "bg-success"
              }`}
              style={{ width: `${redemptionPressure}%` }}
            />
          </div>
          <div className="text-[10px] text-text-muted mt-1">
            {redemptionPressure < 25 ? "Low pressure — healthy inflow dominance"
              : redemptionPressure < 50 ? "Moderate — monitor MSL pool capacity"
              : "High — check instant redemption pool"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Daily Flow Chart ─────────────────────────────────────────────────────────

// Custom tooltip for the bar chart
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-[8px] shadow-card px-3 py-2.5 text-xs">
      <div className="font-semibold text-text-primary mb-1.5">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-text-secondary">{p.name}:</span>
          <span className="font-mono font-medium text-text-primary">{formatCompact(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function DailyFlowChart({
  getDailyFlows,
  timeRange,
  loading,
}: {
  getDailyFlows: ReturnType<typeof useTransactions>["getDailyFlows"];
  timeRange: TimeRange;
  loading: boolean;
}) {
  const data = getDailyFlows(timeRange);

  if (loading) {
    return (
      <div className="card p-5">
        <div className="animate-pulse h-48 rounded-[8px] bg-surface-3" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="card p-5 flex items-center justify-center h-36 text-sm text-text-muted">
        No transaction data for this period
      </div>
    );
  }

  return (
    <div className="card p-5 flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold text-text-primary">Daily Flow Breakdown</h2>
        <p className="text-xs text-text-muted mt-0.5">
          Subscription vs redemption volume by day — helps identify capital movement trends
        </p>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="35%" barGap={2}>
            <CartesianGrid vertical={false} stroke="#E5E5E7" strokeDasharray="0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#838589" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#838589" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => formatCompact(v)}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={7}
              wrapperStyle={{ fontSize: 11, color: "#636366" }}
            />
            <Bar dataKey="subscriptions" name="Subscriptions" fill="#10B981" radius={[3, 3, 0, 0]} />
            <Bar dataKey="redemptions" name="Redemptions" fill="#EF4444" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CapitalFlowsPage() {
  const [decoderOpen, setDecoderOpen] = useState(false);

  const {
    transactions,
    loading,
    error,
    tokenFilter,
    typeFilter,
    timeRange,
    setTokenFilter,
    setTypeFilter,
    setTimeRange,
    refresh,
    fetchTxDetail,
    getSummary,
    getDailyFlows,
  } = useTransactions();

  const { currentPrice: navPrice } = useNavHistory();

  const TOKEN_FILTERS: { label: string; value: TokenFilter }[] = [
    { label: "All", value: "all" },
    { label: "mTBILL", value: "mTBILL" },
    { label: "mBASIS", value: "mBASIS" },
  ];

  const TYPE_FILTERS: { label: string; value: TxTypeFilter }[] = [
    { label: "All", value: "all" },
    { label: "Subscriptions", value: "mint" },
    { label: "Redemptions", value: "burn" },
  ];

  const TIME_RANGES: { label: string; value: TimeRange }[] = [
    { label: "24h", value: "24h" },
    { label: "7d", value: "7d" },
    { label: "30d", value: "30d" },
    { label: "All", value: "all" },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Capital Flows</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Subscription and redemption lifecycle across mTBILL and mBASIS
          </p>
        </div>
        <button onClick={refresh} disabled={loading} className="btn-secondary gap-1.5 py-1.5 px-3 text-xs">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-[12px] bg-danger/5 border border-danger/20 text-sm text-danger">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span><span className="font-medium">Etherscan API error — </span>{error}</span>
        </div>
      )}

      {/* Period selector — sits above cards, controls both cards + chart + table */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-text-muted font-medium">Period:</span>
          <div className="flex gap-1">
            {TIME_RANGES.map(({ label, value }) => (
              <FilterPill key={value} active={timeRange === value} onClick={() => setTimeRange(value)}>
                {label}
              </FilterPill>
            ))}
          </div>
        </div>
      </div>

      {/* Section A: Flow Summary Cards */}
      <FlowSummaryCards navPrice={navPrice} getSummary={getSummary} timeRange={timeRange} />

      {/* Section B: Daily Flow Chart */}
      <DailyFlowChart getDailyFlows={getDailyFlows} timeRange={timeRange} loading={loading} />

      {/* Section C: Filters + Table */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-1.5">
          <Filter size={12} className="text-text-muted" />
          <span className="text-xs text-text-muted font-medium">Product:</span>
          <div className="flex gap-1">
            {TOKEN_FILTERS.map(({ label, value }) => (
              <FilterPill key={value} active={tokenFilter === value} onClick={() => setTokenFilter(value)}>
                {label}
              </FilterPill>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-text-muted font-medium">Type:</span>
          <div className="flex gap-1">
            {TYPE_FILTERS.map(({ label, value }) => (
              <FilterPill key={value} active={typeFilter === value} onClick={() => setTypeFilter(value)}>
                {label}
              </FilterPill>
            ))}
          </div>
        </div>

        {!loading && (
          <span className="ml-auto text-xs text-text-muted">
            {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <TransactionTable
        transactions={transactions}
        loading={loading}
        fetchDetail={fetchTxDetail}
        navPrice={navPrice}
      />

      {/* Section D: Smart Contract Decoder — collapsible */}
      <div className="card overflow-hidden">
        <button
          onClick={() => setDecoderOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-2/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text-primary">Smart Contract Decoder</span>
            <span className="text-xs text-text-muted">— decode any transaction's calldata</span>
          </div>
          {decoderOpen
            ? <ChevronUp size={15} className="text-text-muted" />
            : <ChevronDown size={15} className="text-text-muted" />}
        </button>
        {decoderOpen && (
          <div className="border-t border-border px-5 pb-5 pt-4">
            <TxDecoder />
          </div>
        )}
      </div>
    </div>
  );
}
