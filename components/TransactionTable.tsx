"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ChevronRight,
  Copy,
  Check,
} from "lucide-react";
import { MintBadge, BurnBadge, TxStatusBadge } from "@/components/StatusBadge";
import AddressTag from "@/components/AddressTag";
import type { MintBurnTx, TxDetail } from "@/hooks/useTransactions";
import { formatTokenAmount, formatCompact, timeAgo, formatBlock, formatGas, formatDateTime } from "@/lib/formatters";
import { decodeCalldata } from "@/lib/decoder";
import { ETHERSCAN_URL } from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TransactionTableProps {
  transactions: MintBurnTx[];
  loading: boolean;
  fetchDetail: (hash: string) => Promise<TxDetail>;
}

type SortKey = "time" | "amount" | "token";
type SortDir = "asc" | "desc";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {[...Array(8)].map((_, i) => (
        <tr key={i}>
          {[40, 60, 80, 120, 80, 60].map((w, j) => (
            <td key={j} className="py-3 px-4 border-b border-border/40">
              <div
                className="animate-pulse rounded bg-surface-3 h-4"
                style={{ width: w }}
              />
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
      <td colSpan={6} className="bg-surface-2/60 border-b border-border">
        <div className="px-4 py-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: TX Details */}
          <div className="flex flex-col gap-3">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-widest">
              Transaction Details
            </div>
            <div className="space-y-2 text-sm">
              {/* Hash */}
              <div className="flex items-center gap-2">
                <span className="text-text-muted w-20 shrink-0">Tx Hash</span>
                <span className="font-mono text-xs text-text-secondary truncate">
                  {tx.hash.slice(0, 18)}…{tx.hash.slice(-8)}
                </span>
                <button
                  onClick={() => copy(tx.hash)}
                  className="text-text-muted hover:text-accent transition-colors"
                >
                  {copied ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                </button>
                <a
                  href={`${ETHERSCAN_URL}/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-accent-hover transition-colors"
                >
                  <ExternalLink size={12} />
                </a>
              </div>

              {/* Block */}
              <div className="flex items-center gap-2">
                <span className="text-text-muted w-20 shrink-0">Block</span>
                <a
                  href={`${ETHERSCAN_URL}/block/${tx.blockNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-accent hover:underline"
                >
                  {formatBlock(tx.blockNumber)}
                </a>
              </div>

              {/* From */}
              <div className="flex items-center gap-2">
                <span className="text-text-muted w-20 shrink-0">From</span>
                <AddressTag address={tx.from} showLabel etherscanLink copyable />
              </div>

              {/* To */}
              <div className="flex items-center gap-2">
                <span className="text-text-muted w-20 shrink-0">To</span>
                <AddressTag address={tx.to} showLabel etherscanLink copyable />
              </div>

              {/* Amount */}
              <div className="flex items-center gap-2">
                <span className="text-text-muted w-20 shrink-0">Amount</span>
                <span className="font-mono text-xs text-text-primary">
                  {formatCompact(formatTokenAmount(tx.value, Number(tx.tokenDecimal)))}{" "}
                  {tx.tokenSymbol}
                </span>
              </div>

              {/* Gas / Status */}
              {detail && !detailLoading && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted w-20 shrink-0">Gas Used</span>
                    <span className="font-mono text-xs text-text-primary">
                      {formatGas(detail.gasUsed)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted w-20 shrink-0">Status</span>
                    <TxStatusBadge isError={detail.isError} />
                  </div>
                </>
              )}

              {/* Timestamp */}
              <div className="flex items-center gap-2">
                <span className="text-text-muted w-20 shrink-0">Time</span>
                <span className="text-xs text-text-secondary">
                  {formatDateTime(tx.timeStamp)}
                </span>
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
              <div className="bg-surface rounded-lg border border-border p-3 space-y-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-text-muted">Function</span>
                  <span className="text-accent font-semibold">{decoded.functionName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-text-muted">Selector</span>
                  <span className="text-text-secondary">{decoded.selector}</span>
                </div>
                {decoded.args.length > 0 && (
                  <div className="mt-2 border-t border-border pt-2 space-y-1.5">
                    {decoded.args.map((arg, i) => (
                      <div key={i} className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-text-muted text-[10px]">
                            param{i + 1}
                          </span>
                          <span className="text-text-muted text-[10px]">
                            ({arg.type})
                          </span>
                          <span className="text-warning text-[10px]">
                            {arg.name}
                          </span>
                          {arg.label && (
                            <span className="text-success text-[10px]">
                              → {arg.label}
                            </span>
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
              <div className="bg-surface rounded-lg border border-border p-3 text-xs font-mono text-text-muted">
                {detail.input === "0x" ? (
                  "No calldata (simple transfer)"
                ) : (
                  <>
                    <div className="text-text-secondary mb-1">
                      Unknown function selector — raw input:
                    </div>
                    <div className="break-all text-[10px] text-text-muted">
                      {detail.input.slice(0, 80)}…
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-xs text-text-muted">
                Loading calldata…
              </div>
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
}: TransactionTableProps) {
  const [expandedHash, setExpandedHash] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, TxDetail>>({});
  const [detailLoading, setDetailLoading] = useState<Record<string, boolean>>({});
  const [sortKey, setSortKey] = useState<SortKey>("time");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleRow = async (hash: string) => {
    if (expandedHash === hash) {
      setExpandedHash(null);
      return;
    }
    setExpandedHash(hash);
    if (!details[hash]) {
      setDetailLoading((prev) => ({ ...prev, [hash]: true }));
      try {
        const d = await fetchDetail(hash);
        setDetails((prev) => ({ ...prev, [hash]: d }));
      } catch {
        // silently ignore — panel will show loading state
      } finally {
        setDetailLoading((prev) => ({ ...prev, [hash]: false }));
      }
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
      <th
        className="py-3 px-4 border-b border-border text-left cursor-pointer select-none group"
        onClick={() => handleSort(col)}
      >
        <span className="flex items-center gap-1 text-xs font-medium text-text-muted uppercase tracking-widest group-hover:text-text-secondary">
          {label} <SortIcon col={col} />
        </span>
      </th>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="bg-surface-2/50">
            <th className="py-3 px-4 border-b border-border text-left text-xs font-medium text-text-muted uppercase tracking-widest w-8" />
            <th className="py-3 px-4 border-b border-border text-left text-xs font-medium text-text-muted uppercase tracking-widest">
              Type
            </th>
            <SortTh col="token" label="Token" />
            <SortTh col="amount" label="Amount" />
            <th className="py-3 px-4 border-b border-border text-left text-xs font-medium text-text-muted uppercase tracking-widest">
              Wallet
            </th>
            <SortTh col="time" label="Time" />
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableSkeleton />
          ) : sorted.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="py-16 text-center text-text-muted text-sm"
              >
                No transactions found
              </td>
            </tr>
          ) : (
            sorted.map((tx) => {
              const isExpanded = expandedHash === tx.hash;
              const amount = formatTokenAmount(tx.value, Number(tx.tokenDecimal));
              const walletAddr =
                tx.eventType === "mint" ? tx.to : tx.from;

              return (
                <>
                  <tr
                    key={tx.hash}
                    onClick={() => toggleRow(tx.hash)}
                    className={`cursor-pointer transition-colors ${
                      isExpanded
                        ? "bg-accent/5 border-l-2 border-l-accent"
                        : "hover:bg-surface-2/50"
                    }`}
                  >
                    {/* Expand chevron */}
                    <td className="py-3 px-4 border-b border-border/40 text-text-muted">
                      <ChevronRight
                        size={14}
                        className={`transition-transform ${isExpanded ? "rotate-90 text-accent" : ""}`}
                      />
                    </td>

                    {/* Type badge */}
                    <td className="py-3 px-4 border-b border-border/40">
                      {tx.eventType === "mint" ? <MintBadge /> : <BurnBadge />}
                    </td>

                    {/* Token */}
                    <td className="py-3 px-4 border-b border-border/40">
                      <span className="font-mono text-xs font-semibold text-text-primary">
                        {tx.tokenSymbol}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 border-b border-border/40 tabular-nums font-mono text-xs">
                      <span
                        className={
                          tx.eventType === "mint"
                            ? "text-mint"
                            : "text-burn"
                        }
                      >
                        {tx.eventType === "mint" ? "+" : "−"}
                        {formatCompact(amount)}
                      </span>
                    </td>

                    {/* Wallet */}
                    <td className="py-3 px-4 border-b border-border/40">
                      <AddressTag address={walletAddr} copyable />
                    </td>

                    {/* Time */}
                    <td className="py-3 px-4 border-b border-border/40 text-xs text-text-secondary">
                      {timeAgo(tx.timeStamp)}
                    </td>
                  </tr>

                  {isExpanded && (
                    <DetailPanel
                      key={`detail-${tx.hash}`}
                      tx={tx}
                      detail={details[tx.hash] ?? null}
                      detailLoading={detailLoading[tx.hash] ?? true}
                    />
                  )}
                </>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
