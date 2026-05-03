"use client";

import { CheckCircle, AlertTriangle, Clock, Layers } from "lucide-react";
import type { TokenData, PortfolioSummary } from "@/hooks/useTokenData";
import { formatCompact } from "@/lib/formatters";

interface HealthStripProps {
  mTBILL: TokenData | null;
  portfolio: PortfolioSummary | null;
  loading: boolean;
}

function SkeletonPill() {
  return (
    <div className="flex-1 min-w-[160px] h-[68px] rounded-[12px] bg-surface border border-border/70 animate-pulse" />
  );
}

interface HealthPillProps {
  label: string;
  value: string;
  sub: string;
  status: "ok" | "warn" | "err" | "neutral";
  icon: React.ReactNode;
}

function HealthPill({ label, value, sub, status, icon }: HealthPillProps) {
  const dotColor = {
    ok: "bg-success",
    warn: "bg-warning",
    err: "bg-danger",
    neutral: "bg-text-muted",
  }[status];

  const valueColor = {
    ok: "text-success",
    warn: "text-warning",
    err: "text-danger",
    neutral: "text-text-primary",
  }[status];

  return (
    <div className="flex-1 min-w-[160px] card px-4 py-3 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className={`status-dot ${dotColor}`} />
          <span className="text-xs font-medium text-text-muted uppercase tracking-widest">
            {label}
          </span>
        </div>
        <span className="text-text-muted opacity-60">{icon}</span>
      </div>
      <div className={`text-base font-semibold tabular-nums leading-tight ${valueColor}`}>
        {value}
      </div>
      <div className="text-[11px] text-text-muted leading-none">{sub}</div>
    </div>
  );
}

export default function HealthStrip({ mTBILL, portfolio, loading }: HealthStripProps) {
  if (loading || !mTBILL) {
    return (
      <div className="flex flex-wrap gap-3">
        {[...Array(4)].map((_, i) => <SkeletonPill key={i} />)}
      </div>
    );
  }

  // ── Oracle Status ──────────────────────────────────────────────────────────
  const hoursAgo = mTBILL.navUpdatedAt
    ? Math.round((Date.now() / 1000 - mTBILL.navUpdatedAt) / 3600)
    : null;

  const oracleStatus = mTBILL.navStaleness === "fresh" ? "ok"
    : mTBILL.navStaleness === "stale" ? "err"
    : "neutral";
  const oracleValue = mTBILL.navStaleness === "fresh"
    ? "Oracle Fresh"
    : mTBILL.navStaleness === "stale"
    ? "Oracle Stale"
    : "Oracle Unknown";
  const oracleSub = hoursAgo !== null
    ? `Updated ${hoursAgo}h ago`
    : "Timestamp unavailable";

  // ── 24h Net Flow ──────────────────────────────────────────────────────────
  const netFlow = (portfolio?.netFlow24h ?? 0);
  const flowStatus: "ok" | "warn" | "neutral" =
    netFlow > 0 ? "ok" : netFlow < -10000 ? "warn" : "neutral";
  const flowSign = netFlow >= 0 ? "+" : "";
  const flowValue = `${flowSign}${formatCompact(Math.abs(netFlow))}`;
  const flowSub = netFlow >= 0
    ? "Net subscriptions (24h)"
    : "Net redemptions (24h)";

  // ── Supply Trend 7d ────────────────────────────────────────────────────────
  const pct = mTBILL.supplyChangePct7d;
  const trendStatus: "ok" | "warn" | "neutral" =
    pct > 0 ? "ok" : pct < -2 ? "warn" : "neutral";
  const trendSign = pct >= 0 ? "+" : "";
  const trendValue = `mTBILL ${trendSign}${pct.toFixed(1)}%`;
  const trendSub = "Supply change (7 days)";

  // ── Active Products ────────────────────────────────────────────────────────
  const productsValue = "2 Active";
  const productsSub = "mTBILL · mBASIS · Ethereum";

  return (
    <div className="flex flex-wrap gap-3">
      <HealthPill
        label="Oracle"
        value={oracleValue}
        sub={oracleSub}
        status={oracleStatus}
        icon={<Clock size={13} />}
      />
      <HealthPill
        label="24h Net Flow"
        value={netFlow === 0 ? "No activity" : flowValue}
        sub={flowSub}
        status={netFlow === 0 ? "neutral" : flowStatus}
        icon={<CheckCircle size={13} />}
      />
      <HealthPill
        label="Supply Trend"
        value={pct === 0 ? "Flat (7d)" : trendValue}
        sub={trendSub}
        status={pct === 0 ? "neutral" : trendStatus}
        icon={<AlertTriangle size={13} />}
      />
      <HealthPill
        label="Products"
        value={productsValue}
        sub={productsSub}
        status="neutral"
        icon={<Layers size={13} />}
      />
    </div>
  );
}
