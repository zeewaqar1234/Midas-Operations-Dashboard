"use client";

import { useState, useEffect, useCallback } from "react";
import { getMintBurnEvents, type EtherscanTokenTx } from "@/lib/etherscan";
import { getTxInputData } from "@/lib/etherscan";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TxType = "mint" | "burn";
export type TokenFilter = "mTBILL" | "mBASIS" | "all";
export type TxTypeFilter = "mint" | "burn" | "all";

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

export interface UseTransactionsReturn {
  transactions: MintBurnTx[];
  loading: boolean;
  error: string | null;
  tokenFilter: TokenFilter;
  typeFilter: TxTypeFilter;
  setTokenFilter: (f: TokenFilter) => void;
  setTypeFilter: (f: TxTypeFilter) => void;
  refresh: () => void;
  fetchTxDetail: (hash: string) => Promise<TxDetail>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTransactions(): UseTransactionsReturn {
  const [allTxs, setAllTxs] = useState<MintBurnTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenFilter, setTokenFilter] = useState<TokenFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TxTypeFilter>("all");

  const fetchTxs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const txs = await getMintBurnEvents({ token: "all", offset: 100 });
      setAllTxs(txs as MintBurnTx[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTxs();
  }, [fetchTxs]);

  // Derived filtered list
  const transactions = allTxs.filter((tx) => {
    const tokenMatch =
      tokenFilter === "all" ||
      tx.tokenSymbol?.toLowerCase() === tokenFilter.toLowerCase();
    const typeMatch = typeFilter === "all" || tx.eventType === typeFilter;
    return tokenMatch && typeMatch;
  });

  const fetchTxDetail = useCallback(async (hash: string): Promise<TxDetail> => {
    return getTxInputData(hash);
  }, []);

  return {
    transactions,
    loading,
    error,
    tokenFilter,
    typeFilter,
    setTokenFilter,
    setTypeFilter,
    refresh: fetchTxs,
    fetchTxDetail,
  };
}
