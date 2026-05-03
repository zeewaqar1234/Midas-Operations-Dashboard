"use client";

import { useState } from "react";
import {
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Search,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import { useDistribution } from "@/hooks/useDistribution";
import { useWalletAnalyzer } from "@/hooks/useExplorerData";
import AddressTag from "@/components/AddressTag";
import { formatCompact, isAddress } from "@/lib/formatters";
import { ETHERSCAN_URL } from "@/lib/constants";
import { MintBadge, BurnBadge } from "@/components/StatusBadge";

// ─── Supply Distribution Stacked Bar ─────────────────────────────────────────

function DistributionBar({
  label,
  investorPct,
  protocolPct,
  totalSupply,
  loading,
}: {
  label: string;
  investorPct: number;
  protocolPct: number;
  totalSupply: number;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        <div className="animate-pulse h-4 w-24 rounded bg-surface-3" />
        <div className="animate-pulse h-8 rounded-[8px] bg-surface-3" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">{label} Supply Distribution</span>
        <span className="text-xs text-text-muted tabular-nums">
          {formatCompact(totalSupply)} total
        </span>
      </div>

      {/* Stacked bar */}
      <div className="h-8 w-full rounded-[8px] overflow-hidden flex bg-surface-3">
        {investorPct > 0 && (
          <div
            className="h-full bg-accent/70 flex items-center justify-center transition-all duration-500"
            style={{ width: `${investorPct}%` }}
            title={`Investor Wallets: ${investorPct.toFixed(1)}%`}
          >
            {investorPct > 12 && (
              <span className="text-[10px] font-medium text-white truncate px-1">
                {investorPct.toFixed(0)}%
              </span>
            )}
          </div>
        )}
        {protocolPct > 0 && (
          <div
            className="h-full bg-success/60 flex items-center justify-center transition-all duration-500"
            style={{ width: `${protocolPct}%` }}
            title={`DeFi Protocols: ${protocolPct.toFixed(1)}%`}
          >
            {protocolPct > 8 && (
              <span className="text-[10px] font-medium text-white truncate px-1">
                {protocolPct.toFixed(0)}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-accent/70" />
          Investor Wallets: {investorPct.toFixed(1)}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-success/60" />
          DeFi Protocols: {protocolPct.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

// ─── Concentration Bar ────────────────────────────────────────────────────────

function ConcentrationIndicator({
  top5Pct,
  level,
  loading,
}: {
  top5Pct: number;
  level: "low" | "medium" | "high";
  loading: boolean;
}) {
  if (loading) return <div className="animate-pulse h-16 rounded-[8px] bg-surface-3" />;

  const color = level === "low" ? "bg-success" : level === "medium" ? "bg-warning" : "bg-danger";
  const textColor = level === "low" ? "text-success" : level === "medium" ? "text-warning" : "text-danger";
  const label = level === "low" ? "Low Concentration" : level === "medium" ? "Medium Concentration" : "High Concentration";
  const risk = level === "low"
    ? "Diversified holder base — lower single-redemption risk"
    : level === "medium"
    ? "Moderate concentration — monitor for large individual redemption requests"
    : "High concentration — a single redemption could significantly impact liquidity";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">Holder Concentration (mTBILL)</span>
        <span className={`text-xs font-semibold ${textColor}`}>{label}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-surface-3 overflow-hidden">
        <div
          className={`h-2 rounded-full ${color} transition-all duration-500`}
          style={{ width: `${Math.min(top5Pct, 100)}%` }}
        />
      </div>
      <div className="flex items-start gap-1.5 text-[11px] text-text-muted">
        {level !== "low" && <AlertTriangle size={11} className={`${textColor} shrink-0 mt-0.5`} />}
        <span>Top 5 holders control <strong className={textColor}>{top5Pct.toFixed(1)}%</strong> of mTBILL supply. {risk}</span>
      </div>
    </div>
  );
}

// ─── Wallet Deep Dive (simplified from old Explorer) ─────────────────────────

function WalletDeepDive() {
  const { wallet, loading, error, analyze } = useWalletAnalyzer();
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  const handleAnalyze = () => {
    const addr = input.trim();
    if (!isAddress(addr)) {
      setInputError("Enter a valid Ethereum address (0x…)");
      return;
    }
    setInputError(null);
    analyze(addr);
  };

  return (
    <div className="card flex flex-col">
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2">
        <Wallet size={15} className="text-accent" />
        <h2 className="text-sm font-semibold text-text-primary">Wallet Deep Dive</h2>
        <span className="text-xs text-text-muted">— ETH balance, mToken holdings, interaction timeline</span>
      </div>

      <div className="px-5 py-4 border-b border-border/60 flex gap-2">
        <input
          className="input flex-1"
          placeholder="0x address…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
        />
        <button onClick={handleAnalyze} disabled={loading} className="btn-primary shrink-0">
          <Search size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </div>

      {(inputError || error) && (
        <div className="mx-5 mt-4 flex items-center gap-2 text-xs text-danger bg-danger/5 border border-danger/20 rounded-[8px] px-3 py-2">
          <AlertCircle size={12} />
          {inputError ?? error}
        </div>
      )}

      {wallet && (
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border/60 animate-fade-in">
          {/* Left: balances */}
          <div className="px-5 py-4 flex flex-col gap-4">
            <div>
              <div className="text-xs text-text-muted mb-1.5">Wallet</div>
              <div className="flex items-center gap-2">
                <AddressTag address={wallet.address} prefixLen={10} suffixLen={6} copyable />
                <a href={`${ETHERSCAN_URL}/address/${wallet.address}`} target="_blank" rel="noopener noreferrer"
                  className="text-accent hover:underline flex items-center gap-1 text-xs">
                  Etherscan <ExternalLink size={11} />
                </a>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: "ETH Balance", value: `${wallet.ethBalance.toFixed(4)} ETH` },
                { label: "mTBILL Balance", value: formatCompact(wallet.mTBILLBalance) },
                { label: "mBASIS Balance", value: formatCompact(wallet.mBASISBalance) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between bg-surface-2 rounded-[8px] px-3 py-2.5">
                  <span className="text-xs text-text-muted">{label}</span>
                  <span className="text-sm font-semibold text-text-primary font-mono">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: timeline */}
          <div className="px-5 py-4 flex flex-col gap-3">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-widest">
              Midas Interaction Timeline
            </div>
            {wallet.interactions.length === 0 ? (
              <p className="text-sm text-text-muted py-4 text-center">No mToken interactions found</p>
            ) : (
              <div className="relative">
                <div className="absolute left-3 top-2 bottom-2 w-px bg-border/60" />
                <div className="space-y-3 pl-8">
                  {wallet.interactions.map((tx, i) => {
                    const dotColor = tx.eventType === "mint" ? "bg-mint" : tx.eventType === "burn" ? "bg-burn" : "bg-text-muted";
                    return (
                      <div key={i} className="relative flex flex-col gap-0.5">
                        <div className={`absolute -left-5 top-1.5 w-2 h-2 rounded-full ${dotColor}`} />
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {tx.eventType === "mint" ? <MintBadge size="sm" /> : tx.eventType === "burn" ? <BurnBadge size="sm" /> : null}
                          <span className="text-xs font-semibold text-text-primary tabular-nums">
                            {formatCompact(tx.amount)} {tx.tokenSymbol}
                          </span>
                          <a href={`${ETHERSCAN_URL}/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer"
                            className="text-text-muted hover:text-accent">
                            <ExternalLink size={11} />
                          </a>
                        </div>
                        <span className="text-[10px] text-text-muted">{tx.date}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DistributionPage() {
  const { data, loading, error, refresh } = useDistribution();

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Protocol Distribution</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Where mTokens are deployed — investor wallets vs DeFi protocol integrations
          </p>
        </div>
        <button onClick={refresh} disabled={loading} className="btn-secondary gap-1.5 py-1.5 px-3 text-xs">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-[12px] bg-danger/5 border border-danger/20 text-xs text-danger">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {/* Section A: Supply Distribution */}
      <div className="card p-5 flex flex-col gap-6">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Supply Allocation</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Tokens deployed in DeFi protocols vs held directly by investor wallets. High protocol allocation may constrain instant redemption capacity.
          </p>
        </div>
        <div className="flex flex-col gap-5">
          <DistributionBar
            label="mTBILL"
            investorPct={data?.mTBILL.investorPct ?? 0}
            protocolPct={data?.mTBILL.protocolPct ?? 0}
            totalSupply={data?.mTBILL.totalSupply ?? 0}
            loading={loading}
          />
          <DistributionBar
            label="mBASIS"
            investorPct={data?.mBASIS.investorPct ?? 0}
            protocolPct={data?.mBASIS.protocolPct ?? 0}
            totalSupply={data?.mBASIS.totalSupply ?? 0}
            loading={loading}
          />
        </div>
      </div>

      {/* Section B: Protocol Integration Table */}
      <div className="card flex flex-col">
        <div className="px-5 py-4 border-b border-border/60">
          <h2 className="text-sm font-semibold text-text-primary">Protocol Integrations</h2>
          <p className="text-xs text-text-muted mt-0.5">Known DeFi protocols holding mTokens — verified via on-chain balanceOf</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="bg-surface-2/40 border-b border-border/60">
                {["Protocol", "Contract", "mTBILL Held", "mBASIS Held", "% Supply (mTBILL)"].map((h) => (
                  <th key={h} className="py-2.5 px-4 text-left text-xs font-medium text-text-muted uppercase tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(2)].map((_, i) => (
                  <tr key={i}>
                    {[120, 140, 80, 80, 80].map((w, j) => (
                      <td key={j} className="py-3 px-4 border-b border-border/30">
                        <div className="animate-pulse h-4 rounded bg-surface-3" style={{ width: w }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !data?.protocols.length ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-muted text-sm">
                    No protocol integrations found
                  </td>
                </tr>
              ) : (
                data.protocols.map((p) => (
                  <tr key={p.key} className="hover:bg-surface-2/40 border-b border-border/30 last:border-0 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <a href={p.url} target="_blank" rel="noopener noreferrer"
                          className="text-sm font-medium text-accent hover:underline flex items-center gap-1">
                          {p.label} <ExternalLink size={11} />
                        </a>
                        <span className="text-[10px] text-text-muted border border-border/60 rounded px-1.5 py-0.5">{p.type}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <AddressTag address={p.address} etherscanLink copyable />
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-text-primary tabular-nums">
                      {p.mTBILLBalance > 0 ? formatCompact(p.mTBILLBalance) : "—"}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-text-primary tabular-nums">
                      {p.mBASISBalance > 0 ? formatCompact(p.mBASISBalance) : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-surface-3">
                          <div className="h-1.5 rounded-full bg-success/70" style={{ width: `${Math.min(p.mTBILLPct, 100)}%` }} />
                        </div>
                        <span className="text-xs text-text-secondary tabular-nums">{p.mTBILLPct.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section C: Holder Concentration */}
      <div className="card p-5 flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Holder Concentration Analysis</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Single-redemption risk assessment — high concentration from a few wallets can strain instant redemption capacity
          </p>
        </div>
        <ConcentrationIndicator
          top5Pct={data?.top5PctMTBILL ?? 0}
          level={data?.concentrationLevel ?? "low"}
          loading={loading}
        />
        {/* Top holders mini-table */}
        {!loading && data?.mTBILLConcentration && data.mTBILLConcentration.length > 0 && (
          <div className="overflow-x-auto mt-1">
            <table className="w-full text-xs min-w-[400px]">
              <thead>
                <tr className="border-b border-border/40">
                  {["Rank", "Address", "mTBILL Balance", "% of Supply"].map((h) => (
                    <th key={h} className="py-2 px-3 text-left text-[10px] font-medium text-text-muted uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.mTBILLConcentration.map((h) => (
                  <tr key={h.address} className="border-b border-border/30 last:border-0 hover:bg-surface-2/30">
                    <td className="py-2 px-3 text-text-muted">{h.rank}</td>
                    <td className="py-2 px-3"><AddressTag address={h.address} etherscanLink copyable /></td>
                    <td className="py-2 px-3 font-mono tabular-nums text-text-primary">{formatCompact(h.balance)}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-surface-3">
                          <div className="h-1.5 rounded-full bg-accent/60" style={{ width: `${Math.min(h.pctOfSupply, 100)}%` }} />
                        </div>
                        <span className="tabular-nums text-text-secondary">{h.pctOfSupply.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && (!data?.mTBILLConcentration || data.mTBILLConcentration.length === 0) && (
          <p className="text-xs text-text-muted italic">Concentration data estimated from on-chain activity</p>
        )}
      </div>

      {/* Section D: Wallet Deep Dive */}
      <WalletDeepDive />
    </div>
  );
}
