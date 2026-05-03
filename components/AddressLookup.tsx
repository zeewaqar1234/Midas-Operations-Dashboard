"use client";

import { useState } from "react";
import { Search, AlertCircle, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { useRoles, type AddressRoleInfo } from "@/hooks/useRoles";
import { isAddress, formatTokenAmount, formatCompact, timeAgo } from "@/lib/formatters";
import { ETHERSCAN_URL, CONTRACTS } from "@/lib/constants";
import AddressTag from "@/components/AddressTag";
import { getWalletTokenTxs } from "@/lib/etherscan";

interface WalletInteraction {
  hash: string;
  eventType: "mint" | "burn" | "transfer";
  tokenSymbol: string;
  amount: string;
  timeStamp: string;
}

function RoleRow({ label, has }: { label: string; has: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="font-mono text-xs text-text-secondary">{label}</span>
      {has ? (
        <span className="flex items-center gap-1 text-xs text-success">
          <CheckCircle2 size={12} /> Yes
        </span>
      ) : (
        <span className="flex items-center gap-1 text-xs text-text-muted">
          <XCircle size={12} /> No
        </span>
      )}
    </div>
  );
}

export default function AddressLookup() {
  const { checkAddress, checking } = useRoles();
  const [input, setInput] = useState("");
  const [result, setResult] = useState<AddressRoleInfo | null>(null);
  const [interactions, setInteractions] = useState<WalletInteraction[]>([]);
  const [loadingTxs, setLoadingTxs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    const addr = input.trim();
    if (!addr || !isAddress(addr)) {
      setError("Enter a valid Ethereum address (0x…)");
      return;
    }

    setError(null);
    setResult(null);
    setInteractions([]);

    try {
      const info = await checkAddress(addr);
      setResult(info);

      // Fetch recent token interactions
      setLoadingTxs(true);
      const [mTBILLTxs, mBASISTxs] = await Promise.allSettled([
        getWalletTokenTxs(addr, CONTRACTS.mTBILL.token, { offset: 20 }),
        getWalletTokenTxs(addr, CONTRACTS.mBASIS.token, { offset: 20 }),
      ]);

      const zero = "0x0000000000000000000000000000000000000000";
      const all: WalletInteraction[] = [];

      for (const res of [mTBILLTxs, mBASISTxs]) {
        if (res.status === "fulfilled") {
          for (const tx of res.value) {
            const type =
              tx.from === zero ? "mint" :
              tx.to === zero ? "burn" : "transfer";
            all.push({
              hash: tx.hash,
              eventType: type,
              tokenSymbol: tx.tokenSymbol,
              amount: tx.value,
              timeStamp: tx.timeStamp,
            });
          }
        }
      }

      all.sort((a, b) => Number(b.timeStamp) - Number(a.timeStamp));
      setInteractions(all.slice(0, 15));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setLoadingTxs(false);
    }
  };

  return (
    <div className="card flex flex-col gap-0">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-text-primary">Address Lookup</h2>
        <p className="text-xs text-text-muted mt-0.5">
          Check balances, roles, and Midas interaction history for any address
        </p>
      </div>

      {/* Input */}
      <div className="px-5 py-4 border-b border-border flex gap-2">
        <input
          className="input flex-1"
          placeholder="0x address…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLookup()}
        />
        <button
          onClick={handleLookup}
          disabled={checking || !input.trim()}
          className="btn-primary shrink-0"
        >
          <Search size={14} className={checking ? "animate-spin" : ""} />
          {checking ? "Checking…" : "Look Up"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-5 mt-4 flex items-start gap-2 text-xs text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">
          <AlertCircle size={13} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* Left: balances + roles */}
          <div className="px-5 py-4 flex flex-col gap-4">
            {/* Address */}
            <div>
              <div className="text-xs text-text-muted mb-1">Address</div>
              <div className="flex items-center gap-2">
                <AddressTag address={result.address} prefixLen={10} suffixLen={6} copyable etherscanLink />
                <a
                  href={`${ETHERSCAN_URL}/address/${result.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:underline flex items-center gap-1"
                >
                  View on Etherscan <ExternalLink size={11} />
                </a>
              </div>
            </div>

            {/* Balances */}
            <div>
              <div className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">
                Token Balances
              </div>
              <div className="space-y-2">
                {(["mTBILL", "mBASIS"] as const).map((sym) => {
                  const bal = formatTokenAmount(result[sym].balance, 18);
                  return (
                    <div
                      key={sym}
                      className="flex items-center justify-between bg-surface-2 rounded-lg px-3 py-2"
                    >
                      <span className="font-mono text-xs font-semibold text-text-primary">
                        {sym}
                      </span>
                      <span className={`font-mono text-sm tabular-nums ${bal > 0 ? "text-text-primary" : "text-text-muted"}`}>
                        {formatCompact(bal)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Roles */}
            {(["mTBILL", "mBASIS"] as const).map((sym) => (
              <div key={sym}>
                <div className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">
                  {sym} Roles
                </div>
                <div className="bg-surface-2 rounded-lg px-3 py-1">
                  <RoleRow label="DEFAULT_ADMIN_ROLE" has={result[sym].hasAdminRole} />
                  <RoleRow label="MINTER_ROLE" has={result[sym].hasMinterRole} />
                  <RoleRow label="BURNER_ROLE" has={result[sym].hasBurnerRole} />
                </div>
              </div>
            ))}
          </div>

          {/* Right: interaction timeline */}
          <div className="px-5 py-4 flex flex-col gap-3">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-widest">
              Midas Interaction Timeline
            </div>
            {loadingTxs ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse h-10 rounded bg-surface-3" />
                ))}
              </div>
            ) : interactions.length === 0 ? (
              <div className="text-sm text-text-muted py-4 text-center">
                No Midas token interactions found
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />
                <div className="space-y-3 pl-8">
                  {interactions.map((tx, i) => {
                    const color =
                      tx.eventType === "mint" ? "bg-mint" :
                      tx.eventType === "burn" ? "bg-burn" : "bg-text-muted";
                    const label =
                      tx.eventType === "mint" ? "Mint" :
                      tx.eventType === "burn" ? "Burn" : "Transfer";
                    const amount = formatCompact(
                      formatTokenAmount(tx.amount, 18)
                    );
                    return (
                      <div key={i} className="relative flex flex-col gap-0.5">
                        {/* Dot */}
                        <div className={`absolute -left-5 top-1.5 w-2 h-2 rounded-full ${color}`} />
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-semibold ${
                            tx.eventType === "mint" ? "text-mint" :
                            tx.eventType === "burn" ? "text-burn" : "text-text-secondary"
                          }`}>
                            {label} {amount} {tx.tokenSymbol}
                          </span>
                          <a
                            href={`${ETHERSCAN_URL}/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-text-muted hover:text-accent transition-colors"
                          >
                            <ExternalLink size={11} />
                          </a>
                        </div>
                        <span className="text-xs text-text-muted">
                          {timeAgo(tx.timeStamp)}
                        </span>
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
