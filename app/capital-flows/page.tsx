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
} from "lucide-react";
import { useTransactions, type TokenFilter, type TxTypeFilter, type TimeRange } from "@/hooks/useTransactions";
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
          : "bg-surface-2 text-text-muted border border-border/60 hover:text-text-primary hover:border-accent/20"
      }`}
    >
      {children}
    </button>
  );
}

// ─── Flow summary cards ───────────────────────────────────────────────────────

function FlowSummaryCards({
  navPrice,
  getSummary,
  timeRange,
}: {
  navPrice: number | null;
  getSummary: ReturnType<typeof useTransactions>["getSummary"];
  timeRange: TimeRange;
}) {
  const summary = getSummary(navPrice, timeRange);

  const rangeLabel = timeRange === "all" ? "All time" : `Last ${timeRange}`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            {formatCompact(summary.totalMinted)}
          </div>
          {summary.totalMintedUSD != null && (
            <div className="text-sm text-success tabular-nums mt-0.5">
              {formatUSD(summary.totalMintedUSD)}
            </div>
          )}
        </div>

        <div className="text-xs text-text-muted border-t border-border/40 pt-2">
          {summary.subscriptionCount} subscription{summary.subscriptionCount !== 1 ? "s" : ""}
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
            {summary.totalBurned > 0 ? formatCompact(summary.totalBurned) : "—"}
          </div>
          {summary.totalBurnedUSD != null && summary.totalBurned > 0 && (
            <div className="text-sm text-danger tabular-nums mt-0.5">
              {formatUSD(summary.totalBurnedUSD)}
            </div>
          )}
        </div>

        <div className="text-xs text-text-muted border-t border-border/40 pt-2">
          {summary.redemptionCount} redemption{summary.redemptionCount !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Net Capital Flow */}
      <div className="card p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[8px] bg-accent/10 flex items-center justify-center">
              <ArrowLeftRight size={13} className="text-accent" />
            </div>
            <span className="text-sm font-semibold text-text-primary">Net Capital Flow</span>
          </div>
          <span className="text-xs text-text-muted">{rangeLabel}</span>
        </div>

        <div>
          <div className={`text-2xl font-semibold tabular-nums ${
            summary.netFlow >= 0 ? "text-success" : "text-danger"
          }`}>
            {summary.netFlow === 0
              ? "—"
              : `${summary.netFlow > 0 ? "+" : ""}${formatCompact(summary.netFlow)}`}
          </div>
          {summary.totalMintedUSD != null && summary.totalBurnedUSD != null && (
            <div className={`text-sm tabular-nums mt-0.5 ${
              summary.netFlow >= 0 ? "text-success" : "text-danger"
            }`}>
              {summary.netFlow > 0
                ? `+${formatUSD(summary.totalMintedUSD - summary.totalBurnedUSD)}`
                : summary.netFlow < 0
                ? formatUSD(summary.totalMintedUSD - summary.totalBurnedUSD)
                : "Neutral"}
            </div>
          )}
        </div>

        <div className="text-xs text-text-muted border-t border-border/40 pt-2">
          {summary.netFlowRatio != null && summary.redemptionCount > 0
            ? `${summary.netFlowRatio.toFixed(1)}× more subscriptions than redemptions`
            : summary.redemptionCount === 0 && summary.subscriptionCount > 0
            ? "No redemptions in this period"
            : "No activity in this period"}
        </div>
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

      {/* Section A: Flow Summary Cards */}
      <FlowSummaryCards navPrice={navPrice} getSummary={getSummary} timeRange={timeRange} />

      {/* Section B: Filters */}
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

        {!loading && (
          <span className="ml-auto text-xs text-text-muted">
            {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Section B: Transaction Table */}
      <TransactionTable
        transactions={transactions}
        loading={loading}
        fetchDetail={fetchTxDetail}
        navPrice={navPrice}
      />

      {/* Section C: Smart Contract Decoder — collapsible Tools panel */}
      <div className="card overflow-hidden">
        <button
          onClick={() => setDecoderOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-2/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text-primary">Smart Contract Decoder</span>
            <span className="text-xs text-text-muted">— paste any tx hash to decode calldata</span>
          </div>
          {decoderOpen
            ? <ChevronUp size={15} className="text-text-muted" />
            : <ChevronDown size={15} className="text-text-muted" />}
        </button>
        {decoderOpen && (
          <div className="border-t border-border/60 px-5 pb-5 pt-4">
            <TxDecoder />
          </div>
        )}
      </div>
    </div>
  );
}
