import { Users, TrendingUp, BarChart3, ExternalLink, Percent } from "lucide-react";
import { LiveBadge, StaleBadge } from "@/components/StatusBadge";
import { formatCompact, formatUSD } from "@/lib/formatters";
import type { TokenData } from "@/hooks/useTokenData";
import { TOKEN_META } from "@/lib/constants";

interface TokenCardProps {
  data: TokenData;
  loading?: boolean;
  impliedYield30d?: number | null; // annualized % yield, passed from page
}

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-surface-3 ${className}`} />
  );
}

export default function TokenCard({ data, loading, impliedYield30d }: TokenCardProps) {
  const meta = TOKEN_META[data.symbol as keyof typeof TOKEN_META];

  if (loading) {
    return (
      <div className="card p-5 flex flex-col gap-4">
        <Skeleton className="h-5 w-24" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isMTBILL = data.symbol === "mTBILL";

  return (
    <div className="card-hover p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-[8px] flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: `${meta?.color}18`, color: meta?.color }}
          >
            {data.symbol.slice(1, 3)}
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary">
              {data.symbol}
            </div>
            <div className="text-xs text-text-muted">{meta?.description}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data.navStaleness === "fresh" ? (
            <LiveBadge />
          ) : data.navStaleness === "stale" ? (
            <StaleBadge />
          ) : null}
          {meta && (
            <a
              href={meta.etherscanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-accent transition-colors"
            >
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* NAV Price — mTBILL only */}
        {isMTBILL ? (
          <div className="bg-surface-2 rounded-[8px] p-3">
            <div className="stat-label mb-1 flex items-center gap-1">
              <TrendingUp size={10} />
              NAV Price
            </div>
            <div className="text-xl font-semibold text-text-primary tabular-nums">
              {data.navPrice !== null ? (
                `$${data.navPrice.toFixed(4)}`
              ) : (
                <span className="text-text-muted text-base">—</span>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-surface-2 rounded-[8px] p-3">
            <div className="stat-label mb-1 flex items-center gap-1">
              <TrendingUp size={10} />
              NAV
            </div>
            <div className="text-sm font-medium text-text-muted leading-snug mt-0.5">
              Via strategy manager
            </div>
          </div>
        )}

        {/* AUM — mTBILL; 7d Subscriptions — mBASIS */}
        {isMTBILL ? (
          <div className="bg-surface-2 rounded-[8px] p-3">
            <div className="stat-label mb-1 flex items-center gap-1">
              <BarChart3 size={10} />
              AUM
            </div>
            <div className="text-xl font-semibold text-text-primary tabular-nums">
              {data.aum !== null ? (
                formatUSD(data.aum)
              ) : (
                <span className="text-text-muted text-base">—</span>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-surface-2 rounded-[8px] p-3">
            <div className="stat-label mb-1 flex items-center gap-1">
              <BarChart3 size={10} />
              7d Subscriptions
            </div>
            <div className="text-xl font-semibold text-text-primary tabular-nums">
              {data.mintVolume7d > 0
                ? formatCompact(data.mintVolume7d)
                : <span className="text-text-muted text-base">—</span>}
            </div>
          </div>
        )}

        {/* Total Supply */}
        <div className="bg-surface-2 rounded-[8px] p-3">
          <div className="stat-label mb-1">Supply</div>
          <div className="text-xl font-semibold text-text-primary tabular-nums">
            {formatCompact(data.totalSupply)}
          </div>
          <div className="text-[11px] text-text-muted mt-0.5">tokens</div>
        </div>

        {/* Implied Yield (mTBILL) or Holders (mBASIS) */}
        {isMTBILL && impliedYield30d !== undefined && impliedYield30d !== null ? (
          <div className="bg-surface-2 rounded-[8px] p-3">
            <div className="stat-label mb-1 flex items-center gap-1">
              <Percent size={10} />
              Implied APY
            </div>
            <div className="text-xl font-semibold text-success tabular-nums">
              {impliedYield30d > 0
                ? `~${impliedYield30d.toFixed(1)}%`
                : <span className="text-text-muted text-base">—</span>}
            </div>
            <div className="text-[11px] text-text-muted mt-0.5">30d annualized</div>
          </div>
        ) : (
          <div className="bg-surface-2 rounded-[8px] p-3">
            <div className="stat-label mb-1 flex items-center gap-1">
              <Users size={10} />
              Holders
            </div>
            <div className="text-xl font-semibold text-text-primary tabular-nums">
              {data.holderCount > 0
                ? data.holderCount.toLocaleString()
                : <span className="text-text-muted text-base">—</span>}
            </div>
          </div>
        )}
      </div>

      {/* Supply trend + contract address */}
      <div className="border-t border-border/50 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-xs font-medium tabular-nums ${
              data.supplyChangePct7d > 0
                ? "text-success"
                : data.supplyChangePct7d < 0
                ? "text-danger"
                : "text-text-muted"
            }`}
          >
            {data.supplyChangePct7d === 0
              ? "—"
              : `${data.supplyChangePct7d > 0 ? "+" : ""}${data.supplyChangePct7d.toFixed(1)}%`}
          </span>
          <span className="text-xs text-text-muted">supply 7d</span>
        </div>
        <a
          href={meta?.etherscanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-text-muted hover:text-accent transition-colors"
        >
          {meta
            ? `${meta.address.slice(0, 8)}…${meta.address.slice(-6)}`
            : "—"}
        </a>
      </div>
    </div>
  );
}
