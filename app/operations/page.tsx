"use client";

import { RefreshCw, AlertCircle, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useTokenData } from "@/hooks/useTokenData";
import { useNavHistory } from "@/hooks/useNavHistory";
import { useTransactions } from "@/hooks/useTransactions";
import TokenCard from "@/components/TokenCard";
import NavChart from "@/components/NavChart";
import HealthStrip from "@/components/HealthStrip";
import { formatCompact, formatUSD } from "@/lib/formatters";
import { ETHERSCAN_URL } from "@/lib/constants";
import AddressTag from "@/components/AddressTag";

// ─── Portfolio Summary Card ───────────────────────────────────────────────────

function PortfolioSummaryCard({
  totalAUM,
  totalHolders,
  productCount,
  netFlow24h,
}: {
  totalAUM: number | null;
  totalHolders: number;
  productCount: number;
  netFlow24h: number;
}) {
  const flowPositive = netFlow24h >= 0;

  return (
    <div className="card-hover p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-[8px] bg-warning/10 border border-warning/20 flex items-center justify-center">
          <span className="text-warning text-xs font-bold">Σ</span>
        </div>
        <div>
          <div className="text-sm font-semibold text-text-primary">Portfolio</div>
          <div className="text-xs text-text-muted">Combined mToken metrics</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        <div className="bg-surface-2 rounded-[8px] p-3">
          <div className="stat-label mb-1">Total AUM</div>
          <div className="stat-value text-2xl">
            {totalAUM !== null ? formatUSD(totalAUM) : (
              <span className="text-text-muted text-base">Calculating…</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-surface-2 rounded-[8px] p-3">
            <div className="stat-label mb-1">Wallets</div>
            <div className="stat-value text-xl">
              {totalHolders > 0 ? totalHolders.toLocaleString() : "—"}
            </div>
          </div>
          <div className="bg-surface-2 rounded-[8px] p-3">
            <div className="stat-label mb-1">Products</div>
            <div className="stat-value text-xl">{productCount}</div>
          </div>
        </div>

        <div className="bg-surface-2 rounded-[8px] p-3 flex items-center justify-between">
          <div>
            <div className="stat-label mb-0.5">24h Net Flow</div>
            <div className={`text-base font-semibold tabular-nums ${
              flowPositive ? "text-success" : "text-danger"
            }`}>
              {netFlow24h === 0
                ? "—"
                : `${flowPositive ? "+" : ""}${formatCompact(netFlow24h)}`}
            </div>
          </div>
          {netFlow24h !== 0 && (
            flowPositive
              ? <ArrowUpRight size={18} className="text-success opacity-70" />
              : <ArrowDownRight size={18} className="text-danger opacity-70" />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Recent Activity Feed ─────────────────────────────────────────────────────

function RecentActivity() {
  const { transactions, loading } = useTransactions();

  const recent = transactions.slice(0, 5);

  const formatRelative = (ts: string) => {
    const diff = Math.floor(Date.now() / 1000 - Number(ts));
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse h-9 rounded-[8px] bg-surface-3" />
        ))}
      </div>
    );
  }

  if (!recent.length) {
    return (
      <p className="text-sm text-text-muted py-2">No recent activity found.</p>
    );
  }

  return (
    <div className="space-y-1.5">
      {recent.map((tx) => {
        const isMint = tx.eventType === "mint";
        const decimals = Number(tx.tokenDecimal) || 18;
        const amount = Number(tx.value) / 10 ** decimals;
        const counterparty = isMint ? tx.to : tx.from;

        return (
          <div
            key={tx.hash}
            className="flex items-center justify-between gap-3 px-3 py-2 rounded-[8px] hover:bg-surface-2/60 transition-colors group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`status-dot shrink-0 ${isMint ? "bg-success" : "bg-danger"}`} />
              <span className={`text-xs font-medium shrink-0 ${isMint ? "text-success" : "text-danger"}`}>
                {isMint ? "Subscription" : "Redemption"}
              </span>
              <span className="text-xs text-text-secondary tabular-nums shrink-0">
                {isMint ? "+" : "−"}{formatCompact(amount)} {tx.tokenSymbol}
              </span>
              <span className="text-xs text-text-muted hidden sm:block truncate">
                to <AddressTag address={counterparty} prefixLen={6} suffixLen={4} />
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-text-muted tabular-nums">
                {formatRelative(tx.timeStamp)}
              </span>
              <a
                href={`${ETHERSCAN_URL}/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-muted hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ArrowUpRight size={12} />
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OperationsPage() {
  const { mTBILL, mBASIS, portfolio, loading, error, refresh, countdown } =
    useTokenData();
  const { data: navHistory, loading: navLoading, currentPrice, nav30dAgo } =
    useNavHistory();

  // Compute implied annualized yield from 30d NAV delta
  const impliedYield30d =
    currentPrice && nav30dAgo && nav30dAgo > 0
      ? (Math.pow(currentPrice / nav30dAgo, 365 / 30) - 1) * 100
      : null;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Operations</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Daily health check — oracle status, capital flows, and recent activity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-text-muted">
            <Clock size={12} />
            Refreshes in{" "}
            <span className="font-mono text-text-secondary tabular-nums w-5 text-right">
              {countdown}s
            </span>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="btn-secondary gap-1.5 py-1.5 px-3 text-xs"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-[12px] bg-danger/5 border border-danger/20 text-sm text-danger">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">Failed to load onchain data — </span>
            {error}. Check your Alchemy RPC URL and Etherscan API key in{" "}
            <code className="font-mono text-xs">.env.local</code>.
          </div>
        </div>
      )}

      {/* Section A: Operational Health Strip */}
      <HealthStrip mTBILL={mTBILL} portfolio={portfolio} loading={loading} />

      {/* Section B: Token cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mTBILL ? (
          <TokenCard data={mTBILL} impliedYield30d={impliedYield30d} />
        ) : (
          <TokenCard
            data={{
              symbol: "mTBILL", name: "Midas Tokenized T-Bill",
              totalSupply: 0, totalSupplyRaw: BigInt(0), decimals: 18,
              holderCount: 0, navPrice: null, navUpdatedAt: null,
              navStaleness: "unknown", aum: null,
              netFlow24h: 0, supplyChange7d: 0, supplyChangePct7d: 0, mintVolume7d: 0,
            }}
            loading
          />
        )}

        {mBASIS ? (
          <TokenCard data={mBASIS} />
        ) : (
          <TokenCard
            data={{
              symbol: "mBASIS", name: "Midas Basis Trading Token",
              totalSupply: 0, totalSupplyRaw: BigInt(0), decimals: 18,
              holderCount: 0, navPrice: null, navUpdatedAt: null,
              navStaleness: "unknown", aum: null,
              netFlow24h: 0, supplyChange7d: 0, supplyChangePct7d: 0, mintVolume7d: 0,
            }}
            loading
          />
        )}

        <PortfolioSummaryCard
          totalAUM={portfolio?.totalAUM ?? null}
          totalHolders={portfolio?.totalHolders ?? 0}
          productCount={portfolio?.productCount ?? 2}
          netFlow24h={portfolio?.netFlow24h ?? 0}
        />
      </div>

      {/* Section C: NAV Chart */}
      <div className="card p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">
              mTBILL NAV Price History
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Oracle price feed · 30 days · $1.00 reference line shows yield accumulation above par
            </p>
          </div>
          {currentPrice && (
            <div className="text-right">
              <div className="text-lg font-semibold text-text-primary tabular-nums">
                ${currentPrice.toFixed(4)}
              </div>
              <div className="text-xs text-text-muted">Current NAV</div>
            </div>
          )}
        </div>
        <NavChart data={navHistory} loading={navLoading} />
      </div>

      {/* Section D: Recent Activity */}
      <div className="card p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Recent Activity</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Latest subscriptions and redemptions across both products
            </p>
          </div>
          <a
            href="/capital-flows"
            className="text-xs text-accent hover:underline"
          >
            View all →
          </a>
        </div>
        <RecentActivity />
      </div>
    </div>
  );
}
