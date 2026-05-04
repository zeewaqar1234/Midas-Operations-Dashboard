"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ChevronRight,
  Copy,
  Check,
} from "lucide-react";
import { TxStatusBadge } from "@/components/StatusBadge";
import AddressTag from "@/components/AddressTag";
import type { MintBurnTx, TxDetail } from "@/hooks/useTransactions";
import {
  formatTokenAmount,
  formatCompact,
  formatUSD,
  timeAgo,
  formatBlock,
  formatGas,
  formatDateTime,
} from "@/lib/formatters";
import { decodeCalldata } from "@/lib/decoder";
import { ETHERSCAN_URL } from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TransactionTableProps {
  transactions: MintBurnTx[];
  loading: boolean;
  fetchDetail: (hash: string) => Promise<TxDetail>;
  navPrice?: number | null; // for USD value column
}

type SortKey = "time" | "amount" | "token";
type SortDir = "asc" | "desc";

// ─── Type pills — operational language, not blockchain jargon ─────────────────

function SubscriptionPill() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
      <span className="status-dot bg-success" />
      Subscription
    </span>
  );
}

function RedemptionPill() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-danger">
      <span className="status-dot bg-danger" />
      Redemption
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {[...Array(8)].map((_, i) => (
        <tr key={i}>
          {[...Array(cols)].map((__, j) => (
            <td key={j} className="py-3 px-4 border-b border-border/30">
              <div className="animate-pulse rounded bg-surface-3 h-4" style={{ width: [16, 80, 60, 80, 80, 120, 60][j] ?? 60 }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  tx,
  detail,
  detailLoading,
}: {
  tx: MintBurnTx;
  detail: TxDetail | null;
  detailLoading: boolean;
}) {
  const decoded = detail?.input ? decodeCalldata(detail.input) : null;
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <tr>
      <td colSpan={7} className="bg-surface-2/50 border-b border-border/60">
        <div className="px-4 py-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: TX Details */}
          <div className="flex flex-col gap-3">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-widest">
              Transaction Details
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-text-muted w-24 shrink-0 text-xs">Tx Hash</span>
                <span className="font-mono text-xs text-text-secondary truncate">
                  {tx.hash.slice(0, 18)}…{tx.hash.slice(-8)}
                </span>
                <button onClick={() => copy(tx.hash)} className="text-text-muted hover:text-accent transition-colors">
                  {copied ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                </button>
                <a href={`${ETHERSCAN_URL}/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-hover transition-colors">
                  <ExternalLink size={12} />
                </a>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-text-muted w-24 shrink-0 text-xs">Block</span>
                <a href={`${ETHERSCAN_URL}/block/${tx.blockNumber}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-accent hover:underline">
                  {formatBlock(tx.blockNumber)}
                </a>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-text-muted w-24 shrink-0 text-xs">From</span>
                <AddressTag address={tx.from} showLabel etherscanLink copyable />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-text-muted w-24 shrink-0 text-xs">To</span>
                <AddressTag address={tx.to} showLabel etherscanLink copyable />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-text-muted w-24 shrink-0 text-xs">Amount</span>
                <span className="font-mono text-xs text-text-primary">
                  {formatCompact(formatTokenAmount(tx.value, Number(tx.tokenDecimal)))} {tx.tokenSymbol}
                </span>
              </div>

              {detail && !detailLoading && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted w-24 shrink-0 text-xs">Gas Used</span>
                    <span className="font-mono text-xs text-text-primary">{formatGas(detail.gasUsed)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted w-24 shrink-0 text-xs">Status</span>
                    <TxStatusBadge isError={detail.isError} />
                  </div>
                </>
              )}

              <div className="flex items-center gap-2">
                <span className="text-text-muted w-24 shrink-0 text-xs">Processed</span>
                <span className="text-xs text-text-secondary">{formatDateTime(tx.timeStamp)}</span>
              </div>
            </div>
          </div>

          {/* Right: Decoded calldata */}
          <div className="flex flex-col gap-3">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-widest">
              Smart Contract Decoder
            </div>
            {detailLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse h-4 rounded bg-surface-3 w-4/5" />
                ))}
              </div>
            ) : decoded ? (
              <div className="bg-surface rounded-[8px] border border-border/70 p-3 space-y-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-text-muted">Function</span>
                  <span className="text-accent font-semibold">{decoded.functionName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-text-muted">Selector</span>
                  <span className="text-text-secondary">{decoded.selector}</span>
                </div>
                {decoded.args.length > 0 && (
                  <div className="mt-2 border-t border-border/50 pt-2 space-y-1.5">
                    {decoded.args.map((arg, i) => (
                      <div key={i} className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-text-muted text-[10px]">param{i + 1}</span>
                          <span className="text-text-muted text-[10px]">({arg.type})</span>
                          <span className="text-warning text-[10px]">{arg.name}</span>
                          {arg.label && (
                            <span className="text-success text-[10px]">→ {arg.label}</span>
                          )}
                        </div>
                        <div className="text-text-primary text-[11px] break-all pl-2">
                          {arg.value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : detail ? (
              <div className="bg-surface rounded-[8px] border border-border/70 p-3 text-xs font-mono text-text-muted">
                {detail.input === "0x"
                  ? "No calldata (simple transfer)"
                  : (
                    <>
                      <div className="text-text-secondary mb-1">Unknown function selector — raw input:</div>
                      <div className="break-all text-[10px] text-text-muted">{detail.input.slice(0, 80)}…</div>
                    </>
                  )}
              </div>
            ) : (
              <div className="text-xs text-text-muted">Loading calldata…</div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Table ───────────────────────────────────────────────────────────────

export default function TransactionTable({
  transactions,
  loading,
  fetchDetail,
  navPrice,
}: TransactionTableProps) {
  const [expandedHash, setExpandedHash] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, TxDetail>>({});
  const [detailLoading, setDetailLoading] = useState<Record<string, boolean>>({});
  const [sortKey, setSortKey] = useState<SortKey>("time");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const showUSD = navPrice != null;

  const toggleRow = async (hash: string) => {
    if (expandedHash === hash) { setExpandedHash(null); return; }
    setExpandedHash(hash);
    if (!details[hash]) {
      setDetailLoading((prev) => ({ ...prev, [hash]: true }));
      try {
        const d = await fetchDetail(hash);
        setDetails((prev) => ({ ...prev, [hash]: d }));
      } catch { /* silently ignore */ }
      finally { setDetailLoading((prev) => ({ ...prev, [hash]: false })); }
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sorted = [...transactions].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "time") cmp = Number(a.timeStamp) - Number(b.timeStamp);
    if (sortKey === "amount")
      cmp = formatTokenAmount(a.value, Number(a.tokenDecimal)) -
            formatTokenAmount(b.value, Number(b.tokenDecimal));
    if (sortKey === "token") cmp = a.tokenSymbol.localeCompare(b.tokenSymbol);
    return sortDir === "asc" ? cmp : -cmp;
  });

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronDown size={11} className="opacity-30" />;
    return sortDir === "asc"
      ? <ChevronUp size={11} className="text-accent" />
      : <ChevronDown size={11} className="text-accent" />;
  }

  function SortTh({ col, label }: { col: SortKey; label: string }) {
    return (
      <th className="py-3 px-4 border-b border-border/60 text-left cursor-pointer select-none group" onClick={() => handleSort(col)}>
        <span className="flex items-center gap-1 text-xs font-medium text-text-muted uppercase tracking-widest group-hover:text-text-secondary">
          {label} <SortIcon col={col} />
        </span>
      </th>
    );
  }

  const totalCols = showUSD ? 7 : 6;

  return (
    <div className="overflow-x-auto rounded-[12px] border border-border/60">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="bg-surface-2/40">
            {/* Expand */}
            <th className="py-3 px-4 border-b border-border/60 w-8" />
            {/* Type */}
            <th className="py-3 px-4 border-b border-border/60 text-left text-xs font-medium text-text-muted uppercase tracking-widest">
              Type
            </th>
            {/* Product */}
            <SortTh col="token" label="Product" />
            {/* Amount */}
            <SortTh col="amount" label="Amount" />
            {/* USD Value */}
            {showUSD && (
              <th className="py-3 px-4 border-b border-border/60 text-left text-xs font-medium text-text-muted uppercase tracking-widest">
                USD Value
              </th>
            )}
            {/* Counterparty */}
            <th className="py-3 px-4 border-b border-border/60 text-left text-xs font-medium text-text-muted uppercase tracking-widest">
              Counterparty
            </th>
            {/* Processed */}
            <SortTh col="time" label="Processed" />
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableSkeleton cols={totalCols} />
          ) : sorted.length === 0 ? (
            <tr>
              <td colSpan={totalCols} className="py-16 text-center text-text-muted text-sm">
                No transactions found for this filter
              </td>
            </tr>
          ) : (
            sorted.map((tx) => {
              const isExpanded = expandedHash === tx.hash;
              const amount = formatTokenAmount(tx.value, Number(tx.tokenDecimal));
              const usdValue = navPrice != null ? amount * navPrice : null;
              const counterparty = tx.eventType === "mint" ? tx.to : tx.from;

              return (
                <React.Fragment key={tx.hash}>
                  <tr
                    onClick={() => toggleRow(tx.hash)}
                    className={`cursor-pointer transition-colors ${
                      isExpanded ? "bg-accent/5" : "hover:bg-surface-2/40"
                    }`}
                  >
                    {/* Expand */}
                    <td className="py-3 px-4 border-b border-border/30 text-text-muted">
                      <ChevronRight size={14} className={`transition-transform ${isExpanded ? "rotate-90 text-accent" : ""}`} />
                    </td>

                    {/* Type — operational language */}
                    <td className="py-3 px-4 border-b border-border/30">
                      {tx.eventType === "mint" ? <SubscriptionPill /> : <RedemptionPill />}
                    </td>

                    {/* Product */}
                    <td className="py-3 px-4 border-b border-border/30">
                      <span className="font-mono text-xs font-semibold text-text-primary">{tx.tokenSymbol}</span>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 border-b border-border/30 tabular-nums font-mono text-xs">
                      <span className={tx.eventType === "mint" ? "text-mint" : "text-burn"}>
                        {tx.eventType === "mint" ? "+" : "−"}{formatCompact(amount)}
                      </span>
                    </td>

                    {/* USD Value */}
                    {showUSD && (
                      <td className="py-3 px-4 border-b border-border/30 tabular-nums text-xs text-text-secondary">
                        {usdValue != null ? formatUSD(usdValue) : "—"}
                      </td>
                    )}

                    {/* Counterparty */}
                    <td className="py-3 px-4 border-b border-border/30">
                      <AddressTag address={counterparty} copyable />
                    </td>

                    {/* Processed */}
                    <td className="py-3 px-4 border-b border-border/30 text-xs text-text-secondary tabular-nums">
                      {timeAgo(tx.timeStamp)}
                    </td>
                  </tr>

                  {isExpanded && (
                    <DetailPanel
                      tx={tx}
                      detail={details[tx.hash] ?? null}
                      detailLoading={detailLoading[tx.hash] ?? true}
                    />
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
