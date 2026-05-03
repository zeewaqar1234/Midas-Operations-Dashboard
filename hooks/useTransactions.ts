"use client";

import { useState, useEffect, useCallback } from "react";
import { getMintBurnEvents, type EtherscanTokenTx } from "@/lib/etherscan";
import { getTxInputData } from "@/lib/etherscan";
import { formatTokenAmount } from "@/lib/formatters";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TxType = "mint" | "burn";
export type TokenFilter = "mTBILL" | "mBASIS" | "all";
export type TxTypeFilter = "mint" | "burn" | "all";
export type TimeRange = "24h" | "7d" | "30d" | "all";

export interface MintBurnTx extends EtherscanTokenTx {
  eventType: TxType;
}

export interface TxDetail {
  input: string;
  from: string;
  to: string;
  gasUsed: string;
  blockNumber: string;
  isError: string;
}

export interface FlowSummary {
  totalMinted: number;       // token units
  totalBurned: number;
  totalMintedUSD: number | null;
  totalBurnedUSD: number | null;
  subscriptionCount: number;
  redemptionCount: number;
  netFlow: number;
  netFlowRatio: number | null; // subscriptions / redemptions
}

export interface UseTransactionsReturn {
  transactions: MintBurnTx[];   // filtered view
  allTxs: MintBurnTx[];         // full unfiltered set (for summary calcs)
  loading: boolean;
  error: string | null;
  tokenFilter: TokenFilter;
  typeFilter: TxTypeFilter;
  timeRange: TimeRange;
  setTokenFilter: (f: TokenFilter) => void;
  setTypeFilter: (f: TxTypeFilter) => void;
  setTimeRange: (r: TimeRange) => void;
  refresh: () => void;
  fetchTxDetail: (hash: string) => Promise<TxDetail>;
  getSummary: (navPrice: number | null, range?: TimeRange) => FlowSummary;
}

// ─── Time range cutoff ────────────────────────────────────────────────────────

function getCutoff(range: TimeRange): number {
  const now = Date.now() / 1000;
  if (range === "24h") return now - 86400;
  if (range === "7d")  return now - 7 * 86400;
  if (range === "30d") return now - 30 * 86400;
  return 0;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTransactions(): UseTransactionsReturn {
  const [allTxs, setAllTxs] = useState<MintBurnTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenFilter, setTokenFilter] = useState<TokenFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TxTypeFilter>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const fetchTxs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const txs = await getMintBurnEvents({ token: "all", offset: 100 });
      setAllTxs(txs as MintBurnTx[]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch transactions"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTxs(); }, [fetchTxs]);

  // Derived filtered list
  const cutoff = getCutoff(timeRange);
  const transactions = allTxs.filter((tx) => {
    const tokenMatch =
      tokenFilter === "all" ||
      tx.tokenSymbol?.toLowerCase() === tokenFilter.toLowerCase();
    const typeMatch = typeFilter === "all" || tx.eventType === typeFilter;
    const timeMatch = timeRange === "all" || Number(tx.timeStamp) >= cutoff;
    return tokenMatch && typeMatch && timeMatch;
  });

  // Summary calculation — uses its own range (defaults to current timeRange)
  const getSummary = useCallback(
    (navPrice: number | null, range: TimeRange = timeRange): FlowSummary => {
      const c = getCutoff(range);
      const inRange = allTxs.filter((tx) => Number(tx.timeStamp) >= c);

      let totalMinted = 0;
      let totalBurned = 0;
      let subCount = 0;
      let burnCount = 0;

      for (const tx of inRange) {
        const amt = formatTokenAmount(tx.value, Number(tx.tokenDecimal));
        if (tx.eventType === "mint") {
          totalMinted += amt;
          subCount++;
        } else {
          totalBurned += amt;
          burnCount++;
        }
      }

      return {
        totalMinted,
        totalBurned,
        totalMintedUSD: navPrice !== null ? totalMinted * navPrice : null,
        totalBurnedUSD: navPrice !== null ? totalBurned * navPrice : null,
        subscriptionCount: subCount,
        redemptionCount: burnCount,
        netFlow: totalMinted - totalBurned,
        netFlowRatio: burnCount > 0 ? totalMinted / totalBurned : null,
      };
    },
    [allTxs, timeRange]
  );

  const fetchTxDetail = useCallback(
    async (hash: string): Promise<TxDetail> => getTxInputData(hash),
    []
  );

  return {
    transactions,
    allTxs,
    loading,
    error,
    tokenFilter,
    typeFilter,
    timeRange,
    setTokenFilter,
    setTypeFilter,
    setTimeRange,
    refresh: fetchTxs,
    fetchTxDetail,
    getSummary,
  };
}
