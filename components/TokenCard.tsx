import { Users, TrendingUp, BarChart3, ExternalLink } from "lucide-react";
import { LiveBadge, StaleBadge } from "@/components/StatusBadge";
import { formatCompact, formatUSD } from "@/lib/formatters";
import type { TokenData } from "@/hooks/useTokenData";
import { TOKEN_META } from "@/lib/constants";

interface TokenCardProps {
  data: TokenData;
  loading?: boolean;
}

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-surface-3 ${className}`} />
  );
}

export default function TokenCard({ data, loading }: TokenCardProps) {
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

  return (
    <div className="card-hover p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
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
      <div className="grid grid-cols-2 gap-3">
        {/* NAV Price */}
        <div className="bg-surface-2 rounded-lg p-3">
          <div className="stat-label mb-1 flex items-center gap-1">
            <TrendingUp size={10} />
            NAV Price
          </div>
          <div className="stat-value text-xl">
            {data.navPrice !== null ? (
              `$${data.navPrice.toFixed(4)}`
            ) : (
              <span className="text-text-muted text-base">—</span>
            )}
          </div>
        </div>

        {/* AUM */}
        <div className="bg-surface-2 rounded-lg p-3">
          <div className="stat-label mb-1 flex items-center gap-1">
            <BarChart3 size={10} />
            AUM
          </div>
          <div className="stat-value text-xl">
            {data.aum !== null ? (
              formatUSD(data.aum)
            ) : (
              <span className="text-text-muted text-base">—</span>
            )}
          </div>
        </div>

        {/* Total Supply */}
        <div className="bg-surface-2 rounded-lg p-3">
          <div className="stat-label mb-1">Supply</div>
          <div className="stat-value text-xl">
            {formatCompact(data.totalSupply)}
          </div>
          <div className="text-xs text-text-muted mt-0.5">tokens</div>
        </div>

        {/* Holders */}
        <div className="bg-surface-2 rounded-lg p-3">
          <div className="stat-label mb-1 flex items-center gap-1">
            <Users size={10} />
            Holders
          </div>
          <div className="stat-value text-xl">
            {data.holderCount > 0
              ? data.holderCount.toLocaleString()
              : <span className="text-text-muted text-base">—</span>}
          </div>
        </div>
      </div>

      {/* Contract address */}
      <div className="border-t border-border pt-3 flex items-center justify-between">
        <span className="text-xs text-text-muted">Contract</span>
        <a
          href={meta?.etherscanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-text-secondary hover:text-accent transition-colors"
        >
          {meta
            ? `${meta.address.slice(0, 8)}...${meta.address.slice(-6)}`
            : "—"}
        </a>
      </div>
    </div>
  );
}
