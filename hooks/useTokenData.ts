"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { publicClient } from "@/lib/viem-client";
import { ERC20_ABI, ORACLE_ABI } from "@/lib/contracts";
import { CONTRACTS, TOKEN_META } from "@/lib/constants";
import { getTokenHolderCount } from "@/lib/etherscan";
import { formatTokenAmount, formatOraclePrice } from "@/lib/formatters";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TokenData {
  symbol: string;
  name: string;
  totalSupply: number;
  totalSupplyRaw: bigint;
  decimals: number;
  holderCount: number;
  navPrice: number | null;
  navUpdatedAt: number | null;
  navStaleness: "fresh" | "stale" | "unknown";
  aum: number | null;
}

export interface PortfolioSummary {
  totalAUM: number | null;
  totalHolders: number;
  productCount: number;
  lastUpdated: number;
}

export interface UseTokenDataReturn {
  mTBILL: TokenData | null;
  mBASIS: TokenData | null;
  portfolio: PortfolioSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  countdown: number;
}

const REFRESH_INTERVAL = 60; // seconds

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTokenData(): UseTokenDataReturn {
  const [mTBILL, setMTBILL] = useState<TokenData | null>(null);
  const [mBASIS, setMBASIS] = useState<TokenData | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // ── Parallel RPC reads ──────────────────────────────────────────────
      const [
        mTBILLSupplyRaw,
        mTBILLDecimals,
        mBASISSupplyRaw,
        mBASISDecimals,
        oracleData,
        oracleDecimals,
      ] = await Promise.all([
        publicClient.readContract({
          address: CONTRACTS.mTBILL.token,
          abi: ERC20_ABI,
          functionName: "totalSupply",
        }),
        publicClient.readContract({
          address: CONTRACTS.mTBILL.token,
          abi: ERC20_ABI,
          functionName: "decimals",
        }),
        publicClient.readContract({
          address: CONTRACTS.mBASIS.token,
          abi: ERC20_ABI,
          functionName: "totalSupply",
        }),
        publicClient.readContract({
          address: CONTRACTS.mBASIS.token,
          abi: ERC20_ABI,
          functionName: "decimals",
        }),
        publicClient.readContract({
          address: CONTRACTS.mTBILL.oracle,
          abi: ORACLE_ABI,
          functionName: "latestRoundData",
        }),
        publicClient.readContract({
          address: CONTRACTS.mTBILL.oracle,
          abi: ORACLE_ABI,
          functionName: "decimals",
        }),
      ]);

      // ── Recent unique recipient count (free-tier approximation) ───────────
      const [mTBILLHolders, mBASISHolders] = await Promise.allSettled([
        getTokenHolderCount(CONTRACTS.mTBILL.token),
        getTokenHolderCount(CONTRACTS.mBASIS.token),
      ]);

      // ── mTBILL ──────────────────────────────────────────────────────────
      const mTBILLSupply = formatTokenAmount(mTBILLSupplyRaw, mTBILLDecimals);
      const [, navAnswer, , navUpdatedAt] = oracleData;
      const navPrice = navAnswer > BigInt(0)
        ? formatOraclePrice(navAnswer, oracleDecimals)
        : null;
      const updatedAtNum = Number(navUpdatedAt);
      const staleness =
        navUpdatedAt === BigInt(0)
          ? "unknown"
          : Date.now() / 1000 - updatedAtNum > 86400
            ? "stale"
            : "fresh";

      const mTBILLData: TokenData = {
        symbol: "mTBILL",
        name: TOKEN_META.mTBILL.name,
        totalSupply: mTBILLSupply,
        totalSupplyRaw: mTBILLSupplyRaw,
        decimals: mTBILLDecimals,
        holderCount:
          mTBILLHolders.status === "fulfilled" ? mTBILLHolders.value : 0,
        navPrice,
        navUpdatedAt: updatedAtNum || null,
        navStaleness: staleness,
        aum: navPrice !== null ? mTBILLSupply * navPrice : null,
      };

      // ── mBASIS ──────────────────────────────────────────────────────────
      const mBASISSupply = formatTokenAmount(mBASISSupplyRaw, mBASISDecimals);

      const mBASISData: TokenData = {
        symbol: "mBASIS",
        name: TOKEN_META.mBASIS.name,
        totalSupply: mBASISSupply,
        totalSupplyRaw: mBASISSupplyRaw,
        decimals: mBASISDecimals,
        holderCount:
          mBASISHolders.status === "fulfilled" ? mBASISHolders.value : 0,
        navPrice: null, // mBASIS oracle not publicly available
        navUpdatedAt: null,
        navStaleness: "unknown",
        aum: null,
      };

      // ── Portfolio summary ────────────────────────────────────────────────
      const totalAUM =
        mTBILLData.aum !== null ? mTBILLData.aum : null;

      const portfolioData: PortfolioSummary = {
        totalAUM,
        totalHolders: mTBILLData.holderCount + mBASISData.holderCount,
        productCount: 2,
        lastUpdated: Date.now(),
      };

      setMTBILL(mTBILLData);
      setMBASIS(mBASISData);
      setPortfolio(portfolioData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch token data");
    } finally {
      setLoading(false);
      setCountdown(REFRESH_INTERVAL);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, REFRESH_INTERVAL * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? REFRESH_INTERVAL : prev - 1));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    mTBILL,
    mBASIS,
    portfolio,
    loading,
    error,
    refresh: fetchData,
    countdown,
  };
}
