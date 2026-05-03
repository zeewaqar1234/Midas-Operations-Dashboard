"use client";

import { useState } from "react";
import { Search, AlertCircle, ExternalLink, Wallet } from "lucide-react";
import { useTopHolders, useDailyFlow, useWalletAnalyzer, type ExplorerToken } from "@/hooks/useExplorerData";
import HolderChart from "@/components/HolderChart";
import FlowChart from "@/components/FlowChart";
import AddressTag from "@/components/AddressTag";
import { isAddress, formatCompact } from "@/lib/formatters";
import { ETHERSCAN_URL } from "@/lib/constants";
import { MintBadge, BurnBadge } from "@/components/StatusBadge";

function TokenToggle({
  value,
  onChange,
}: {
  value: ExplorerToken;
  onChange: (t: ExplorerToken) => void;
}) {
  return (
    <div className="flex gap-1 bg-surface-2 rounded-lg p-0.5 border border-border">
      {(["mTBILL", "mBASIS"] as ExplorerToken[]).map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
            value === t
              ? "bg-accent text-background"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function WalletDeepDive() {
  const { wallet, loading, error, analyze } = useWalletAnalyzer();
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  const handleAnalyze = () => {
    const addr = input.trim();
    if (!isAddress(addr)) {
      setInputError("Enter a valid Ethereum address");
      return;
    }
    setInputError(null);
    analyze(addr);
  };

  return (
    <div className="card flex flex-col">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <Wallet size={15} className="text-accent" />
        <h2 className="text-sm font-semibold text-text-primary">Wallet Deep Dive</h2>
      </div>

      <div className="px-5 py-4 border-b border-border flex gap-2">
        <input
          className="input flex-1"
          placeholder="0x wallet address…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
        />
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="btn-primary shrink-0"
        >
          <Search size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </div>

      {(inputError || error) && (
        <div className="mx-5 mt-4 flex items-center gap-2 text-xs text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">
          <AlertCircle size={12} />
          {inputError ?? error}
        </div>
      )}

      {wallet && (
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border animate-fade-in">
          {/* Left: balances */}
          <div className="px-5 py-4 flex flex-col gap-4">
            <div>
              <div className="text-xs text-text-muted mb-1">Wallet</div>
              <div className="flex items-center gap-2">
                <AddressTag address={wallet.address} prefixLen={10} suffixLen={6} copyable />
                <a
                  href={`${ETHERSCAN_URL}/address/${wallet.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline flex items-center gap-1 text-xs"
                >
                  Etherscan <ExternalLink size={11} />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {[
                { label: "ETH Balance", value: `${wallet.ethBalance.toFixed(4)} ETH`, mono: true },
                { label: "mTBILL Balance", value: formatCompact(wallet.mTBILLBalance), mono: false },
                { label: "mBASIS Balance", value: formatCompact(wallet.mBASISBalance), mono: false },
              ].map(({ label, value, mono }) => (
                <div key={label} className="flex items-center justify-between bg-surface-2 rounded-lg px-3 py-2.5">
                  <span className="text-xs text-text-muted">{label}</span>
                  <span className={`text-sm font-semibold text-text-primary ${mono ? "font-mono" : ""}`}>
                    {value}
                  </span>
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
              <p className="text-sm text-text-muted py-4 text-center">
                No mToken interactions found
              </p>
            ) : (
              <div className="relative">
                <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />
                <div className="space-y-3 pl-8">
                  {wallet.interactions.map((tx, i) => {
                    const dotColor =
                      tx.eventType === "mint" ? "bg-mint" :
                      tx.eventType === "burn" ? "bg-burn" : "bg-text-muted";
                    return (
                      <div key={i} className="relative flex flex-col gap-0.5">
                        <div className={`absolute -left-5 top-1.5 w-2 h-2 rounded-full ${dotColor}`} />
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {tx.eventType === "mint" ? <MintBadge size="sm" /> : tx.eventType === "burn" ? <BurnBadge size="sm" /> : null}
                          <span className="text-xs font-semibold text-text-primary tabular-nums">
                            {formatCompact(tx.amount)} {tx.tokenSymbol}
                          </span>
                          <a
                            href={`${ETHERSCAN_URL}/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-text-muted hover:text-accent"
                          >
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

export default function ExplorerPage() {
  const [token, setToken] = useState<ExplorerToken>("mTBILL");
  const { holders, loading: holdersLoading, error: holdersError, totalSupply } = useTopHolders(token);
  const { data: flowData, loading: flowLoading } = useDailyFlow(token);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            Block Explorer & Wallet Analyzer
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            Top holders, token flow, and wallet-level Midas activity
          </p>
        </div>
        <TokenToggle value={token} onChange={setToken} />
      </div>

      {holdersError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-danger/5 border border-danger/20 text-xs text-danger">
          <AlertCircle size={13} /> {holdersError}
        </div>
      )}

      {/* Top section: holders table + pie chart */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Holders table — 3 cols */}
        <div className="xl:col-span-3 card flex flex-col">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">
              Top Holders — {token}
            </h2>
            {totalSupply > 0 && (
              <span className="text-xs text-text-muted">
                Supply: {formatCompact(totalSupply)}
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2/40">
                  {["Rank", "Address", "Balance", "% Supply"].map((h) => (
                    <th key={h} className="py-2.5 px-4 text-left text-xs font-medium text-text-muted uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdersLoading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i}>
                      {[24, 160, 80, 60].map((w, j) => (
                        <td key={j} className="py-3 px-4 border-b border-border/40">
                          <div className="animate-pulse h-4 rounded bg-surface-3" style={{ width: w }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : holders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-text-muted text-sm">
                      No holder data — Etherscan token holder API may require a Pro key
                    </td>
                  </tr>
                ) : (
                  holders.map((h) => (
                    <tr key={h.address} className="hover:bg-surface-2/40 border-b border-border/40 last:border-0 transition-colors">
                      <td className="py-3 px-4 text-text-muted text-xs tabular-nums">{h.rank}</td>
                      <td className="py-3 px-4">
                        {h.label ? (
                          <span className="text-xs font-medium text-accent">{h.label}</span>
                        ) : (
                          <AddressTag address={h.address} etherscanLink copyable />
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-text-primary tabular-nums">
                        {formatCompact(h.balance)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-surface-3 max-w-[80px]">
                            <div
                              className="h-1.5 rounded-full bg-accent"
                              style={{ width: `${Math.min(h.pctOfSupply, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-text-secondary tabular-nums">
                            {h.pctOfSupply.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pie chart — 2 cols */}
        <div className="xl:col-span-2 card p-5 flex flex-col gap-3">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Holder Concentration</h2>
            <p className="text-xs text-text-muted mt-0.5">Top 5 vs rest of supply</p>
          </div>
          <HolderChart holders={holders} loading={holdersLoading} />
        </div>
      </div>

      {/* Daily flow chart */}
      <div className="card p-5 flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">
            Daily Mint / Burn Volume — {token}
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Last 30 days — green = minted, red = burned
          </p>
        </div>
        <FlowChart data={flowData} loading={flowLoading} />
      </div>

      {/* Wallet deep dive */}
      <WalletDeepDive />
    </div>
  );
}
