"use client";

import { RefreshCw, AlertCircle, Clock } from "lucide-react";
import { useTokenData } from "@/hooks/useTokenData";
import { useNavHistory } from "@/hooks/useNavHistory";
import TokenCard from "@/components/TokenCard";
import NavChart from "@/components/NavChart";
import { formatUSD } from "@/lib/formatters";

function PortfolioSummaryCard({
  totalAUM,
  totalHolders,
  productCount,
}: {
  totalAUM: number | null;
  totalHolders: number;
  productCount: number;
}) {
  return (
    <div className="card-hover p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-warning/10 border border-warning/20 flex items-center justify-center">
          <span className="text-warning text-xs font-bold">Σ</span>
        </div>
        <div>
          <div className="text-sm font-semibold text-text-primary">Portfolio</div>
          <div className="text-xs text-text-muted">All mTokens combined</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="bg-surface-2 rounded-lg p-3">
          <div className="stat-label mb-1">Total AUM</div>
          <div className="stat-value text-2xl">
            {totalAUM !== null ? formatUSD(totalAUM) : (
              <span className="text-text-muted text-base">Calculating…</span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-2 rounded-lg p-3">
            <div className="stat-label mb-1">Holders</div>
            <div className="stat-value text-xl">
              {totalHolders > 0 ? totalHolders.toLocaleString() : "—"}
            </div>
          </div>
          <div className="bg-surface-2 rounded-lg p-3">
            <div className="stat-label mb-1">Products</div>
            <div className="stat-value text-xl">{productCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const { mTBILL, mBASIS, portfolio, loading, error, refresh, countdown } =
    useTokenData();
  const { data: navHistory, loading: navLoading } = useNavHistory();

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            Token Overview & NAV Monitor
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            Live data from Ethereum mainnet — mTBILL &amp; mBASIS contracts
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Countdown */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-text-muted">
            <Clock size={12} />
            Refreshes in{" "}
            <span className="font-mono text-text-secondary tabular-nums w-5 text-right">
              {countdown}s
            </span>
          </div>
          {/* Refresh button */}
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
        <div className="flex items-start gap-3 p-4 rounded-xl bg-danger/5 border border-danger/20 text-sm text-danger">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">Failed to load onchain data — </span>
            {error}. Check your Alchemy RPC URL and Etherscan API key in{" "}
            <code className="font-mono text-xs">.env.local</code>.
          </div>
        </div>
      )}

      {/* Token cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mTBILL ? (
          <TokenCard data={mTBILL} loading={loading && !mTBILL} />
        ) : (
          <TokenCard
            data={{
              symbol: "mTBILL",
              name: "Midas Tokenized T-Bill",
              totalSupply: 0,
              totalSupplyRaw: BigInt(0),
              decimals: 18,
              holderCount: 0,
              navPrice: null,
              navUpdatedAt: null,
              navStaleness: "unknown",
              aum: null,
            }}
            loading
          />
        )}

        {mBASIS ? (
          <TokenCard data={mBASIS} loading={loading && !mBASIS} />
        ) : (
          <TokenCard
            data={{
              symbol: "mBASIS",
              name: "Midas Basis Trading Token",
              totalSupply: 0,
              totalSupplyRaw: BigInt(0),
              decimals: 18,
              holderCount: 0,
              navPrice: null,
              navUpdatedAt: null,
              navStaleness: "unknown",
              aum: null,
            }}
            loading
          />
        )}

        <PortfolioSummaryCard
          totalAUM={portfolio?.totalAUM ?? null}
          totalHolders={portfolio?.totalHolders ?? 0}
          productCount={portfolio?.productCount ?? 2}
        />
      </div>

      {/* NAV Chart */}
      <div className="card p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">
              mTBILL NAV Price History
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Oracle price feed — last 30 days
            </p>
          </div>
          {mTBILL?.navPrice && (
            <div className="text-right">
              <div className="text-lg font-semibold text-text-primary tabular-nums">
                ${mTBILL.navPrice.toFixed(4)}
              </div>
              <div className="text-xs text-text-muted">Current NAV</div>
            </div>
          )}
        </div>
        <NavChart data={navHistory} loading={navLoading} />
      </div>

      {/* Data sources footer */}
      <div className="flex flex-wrap gap-4 text-xs text-text-muted border-t border-border pt-4">
        <span>
          Data sources:{" "}
          <a
            href="https://etherscan.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Etherscan
          </a>{" "}
          ·{" "}
          <a
            href={`https://etherscan.io/address/${process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL ? "Alchemy" : "Cloudflare"}`}
            className="text-accent hover:underline"
          >
            Ethereum RPC
          </a>{" "}
          · Chainlink-style Oracle
        </span>
        <span className="ml-auto">Auto-refresh: 60s</span>
      </div>
    </div>
  );
}
