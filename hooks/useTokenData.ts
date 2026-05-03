"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { publicClient } from "@/lib/viem-client";
import { ERC20_ABI, ORACLE_ABI } from "@/lib/contracts";
import { CONTRACTS, TOKEN_META } from "@/lib/constants";
import { getTokenHolderCount, getTokenTransfers } from "@/lib/etherscan";
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
  // Flow metrics
  netFlow24h: number;       // minted - burned in last 24h (token units)
  supplyChange7d: number;   // absolute supply change over 7d
  supplyChangePct7d: number; // % change in supply over 7d
  mintVolume7d: number;     // total minted in last 7d (useful for mBASIS without oracle)
}

export interface PortfolioSummary {
  totalAUM: number | null;
  totalHolders: number;
  productCount: number;
  netFlow24h: number; // combined across both tokens
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
const ZERO = "0x0000000000000000000000000000000000000000";

// ─── Flow metric calculation from transfer events ─────────────────────────────

function calcFlowMetrics(
  txs: Awaited<ReturnType<typeof getTokenTransfers>>,
  decimals: number
) {
  const now = Date.now() / 1000;
  const since24h = now - 86400;
  const since7d = now - 7 * 86400;

  let minted24h = BigInt(0);
  let burned24h = BigInt(0);
  let netMinted7d = BigInt(0);
  let netBurned7d = BigInt(0);
  let mintedTotal7d = BigInt(0);

  for (const tx of txs) {
    const ts = Number(tx.timeStamp);
    const val = BigInt(tx.value);
    const from = tx.from.toLowerCase();
    const to = tx.to.toLowerCase();

    if (ts >= since24h) {
      if (from === ZERO) minted24h += val;
      if (to === ZERO) burned24h += val;
    }
    if (ts >= since7d) {
      if (from === ZERO) { netMinted7d += val; mintedTotal7d += val; }
      if (to === ZERO) netBurned7d += val;
    }
  }

  const divisor = BigInt(10 ** decimals);
  const netFlow24h = Number(minted24h - burned24h) / Number(divisor);
  const supplyChange7d = Number(netMinted7d - netBurned7d) / Number(divisor);
  const mintVolume7d = Number(mintedTotal7d) / Number(divisor);

  return { netFlow24h, supplyChange7d, mintVolume7d };
}

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

      // ── Holder counts + recent transfers for flow metrics ──────────────
      const [
        mTBILLHolders,
        mBASISHolders,
        mTBILLTxs,
        mBASISTxs,
      ] = await Promise.allSettled([
        getTokenHolderCount(CONTRACTS.mTBILL.token),
        getTokenHolderCount(CONTRACTS.mBASIS.token),
        getTokenTransfers(CONTRACTS.mTBILL.token, { offset: 200, sort: "desc" }),
        getTokenTransfers(CONTRACTS.mBASIS.token, { offset: 100, sort: "desc" }),
      ]);

      // ── mTBILL ──────────────────────────────────────────────────────────
      const mTBILLSupply = formatTokenAmount(mTBILLSupplyRaw, mTBILLDecimals);
      const [, navAnswer, , navUpdatedAt] = oracleData;
      const navPrice =
        navAnswer > BigInt(0)
          ? formatOraclePrice(navAnswer, oracleDecimals)
          : null;
      const updatedAtNum = Number(navUpdatedAt);
      const staleness =
        navUpdatedAt === BigInt(0)
          ? "unknown"
          : Date.now() / 1000 - updatedAtNum > 86400
            ? "stale"
            : "fresh";

      const mTBILLFlow =
        mTBILLTxs.status === "fulfilled"
          ? calcFlowMetrics(mTBILLTxs.value, mTBILLDecimals)
          : { netFlow24h: 0, supplyChange7d: 0, mintVolume7d: 0 };

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
        netFlow24h: mTBILLFlow.netFlow24h,
        supplyChange7d: mTBILLFlow.supplyChange7d,
        supplyChangePct7d:
          mTBILLSupply > 0
            ? (mTBILLFlow.supplyChange7d / (mTBILLSupply - mTBILLFlow.supplyChange7d)) * 100
            : 0,
        mintVolume7d: mTBILLFlow.mintVolume7d,
      };

      // ── mBASIS ──────────────────────────────────────────────────────────
      const mBASISSupply = formatTokenAmount(mBASISSupplyRaw, mBASISDecimals);

      const mBASISFlow =
        mBASISTxs.status === "fulfilled"
          ? calcFlowMetrics(mBASISTxs.value, mBASISDecimals)
          : { netFlow24h: 0, supplyChange7d: 0, mintVolume7d: 0 };

      const mBASISData: TokenData = {
        symbol: "mBASIS",
        name: TOKEN_META.mBASIS.name,
        totalSupply: mBASISSupply,
        totalSupplyRaw: mBASISSupplyRaw,
        decimals: mBASISDecimals,
        holderCount:
          mBASISHolders.status === "fulfilled" ? mBASISHolders.value : 0,
        navPrice: null,
        navUpdatedAt: null,
        navStaleness: "unknown",
        aum: null,
        netFlow24h: mBASISFlow.netFlow24h,
        supplyChange7d: mBASISFlow.supplyChange7d,
        supplyChangePct7d:
          mBASISSupply > 0
            ? (mBASISFlow.supplyChange7d / (mBASISSupply - mBASISFlow.supplyChange7d)) * 100
            : 0,
        mintVolume7d: mBASISFlow.mintVolume7d,
      };

      // ── Portfolio summary ────────────────────────────────────────────────
      const portfolioData: PortfolioSummary = {
        totalAUM: mTBILLData.aum,
        totalHolders: mTBILLData.holderCount + mBASISData.holderCount,
        productCount: 2,
        netFlow24h: mTBILLData.netFlow24h + mBASISData.netFlow24h,
        lastUpdated: Date.now(),
      };

      setMTBILL(mTBILLData);
      setMBASIS(mBASISData);
      setPortfolio(portfolioData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch token data"
      );
    } finally {
      setLoading(false);
      setCountdown(REFRESH_INTERVAL);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(fetchData, REFRESH_INTERVAL * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? REFRESH_INTERVAL : prev - 1));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { mTBILL, mBASIS, portfolio, loading, error, refresh: fetchData, countdown };
}
