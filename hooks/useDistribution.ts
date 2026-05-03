"use client";

import { useState, useEffect, useCallback } from "react";
import { publicClient } from "@/lib/viem-client";
import { ERC20_ABI } from "@/lib/contracts";
import { CONTRACTS, PROTOCOL_ADDRESSES } from "@/lib/constants";
import { formatTokenAmount } from "@/lib/formatters";
import { getTokenTransfers } from "@/lib/etherscan";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProtocolAllocation {
  key: string;
  label: string;
  address: `0x${string}`;
  type: string;
  url: string;
  mTBILLBalance: number;
  mBASISBalance: number;
  mTBILLPct: number;
  mBASISPct: number;
}

export interface HolderConcentration {
  address: string;
  balance: number;
  pctOfSupply: number;
  rank: number;
}

export interface DistributionData {
  mTBILL: {
    totalSupply: number;
    protocolHeld: number;
    investorHeld: number;
    protocolPct: number;
    investorPct: number;
  };
  mBASIS: {
    totalSupply: number;
    protocolHeld: number;
    investorHeld: number;
    protocolPct: number;
    investorPct: number;
  };
  protocols: ProtocolAllocation[];
  mTBILLConcentration: HolderConcentration[];
  top5PctMTBILL: number;
  concentrationLevel: "low" | "medium" | "high"; // <50% low, 50-75% medium, >75% high
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDistribution() {
  const [data, setData] = useState<DistributionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // ── Supply reads ─────────────────────────────────────────────────────
      const [
        mTBILLSupplyRaw,
        mTBILLDecimals,
        mBASISSupplyRaw,
        mBASISDecimals,
      ] = await Promise.all([
        publicClient.readContract({ address: CONTRACTS.mTBILL.token, abi: ERC20_ABI, functionName: "totalSupply" }),
        publicClient.readContract({ address: CONTRACTS.mTBILL.token, abi: ERC20_ABI, functionName: "decimals" }),
        publicClient.readContract({ address: CONTRACTS.mBASIS.token, abi: ERC20_ABI, functionName: "totalSupply" }),
        publicClient.readContract({ address: CONTRACTS.mBASIS.token, abi: ERC20_ABI, functionName: "decimals" }),
      ]);

      const mTBILLTotalSupply = formatTokenAmount(mTBILLSupplyRaw, mTBILLDecimals);
      const mBASISTotalSupply = formatTokenAmount(mBASISSupplyRaw, mBASISDecimals);

      // ── Protocol balances ────────────────────────────────────────────────
      const protocolKeys = Object.keys(PROTOCOL_ADDRESSES);
      const protocolList = protocolKeys.map((k) => PROTOCOL_ADDRESSES[k]);

      const protocolBalances = await Promise.allSettled(
        protocolList.flatMap((p) => [
          publicClient.readContract({ address: CONTRACTS.mTBILL.token, abi: ERC20_ABI, functionName: "balanceOf", args: [p.address] }),
          publicClient.readContract({ address: CONTRACTS.mBASIS.token, abi: ERC20_ABI, functionName: "balanceOf", args: [p.address] }),
        ])
      );

      const protocols: ProtocolAllocation[] = protocolList.map((p, i) => {
        const r1 = protocolBalances[i * 2];
        const r2 = protocolBalances[i * 2 + 1];
        const mTBILLRaw = r1.status === "fulfilled" ? r1.value as bigint : BigInt(0);
        const mBASISRaw = r2.status === "fulfilled" ? r2.value as bigint : BigInt(0);
        const mTBILLBal = formatTokenAmount(mTBILLRaw, mTBILLDecimals);
        const mBASISBal = formatTokenAmount(mBASISRaw, mBASISDecimals);

        return {
          key: protocolKeys[i],
          label: p.label,
          address: p.address,
          type: p.type,
          url: p.url,
          mTBILLBalance: mTBILLBal,
          mBASISBalance: mBASISBal,
          mTBILLPct: mTBILLTotalSupply > 0 ? (mTBILLBal / mTBILLTotalSupply) * 100 : 0,
          mBASISPct: mBASISTotalSupply > 0 ? (mBASISBal / mBASISTotalSupply) * 100 : 0,
        };
      });

      const mTBILLProtocolHeld = protocols.reduce((s, p) => s + p.mTBILLBalance, 0);
      const mBASISProtocolHeld = protocols.reduce((s, p) => s + p.mBASISBalance, 0);

      // ── Holder concentration — derive from recent mint events ─────────────
      // Get unique recipient addresses from recent mints, verify balances via RPC
      const mTBILLTxs = await getTokenTransfers(CONTRACTS.mTBILL.token, { offset: 200, sort: "desc" }).catch(() => []);

      const zero = "0x0000000000000000000000000000000000000000";
      const mintRecipients = new Set<string>();
      for (const tx of mTBILLTxs) {
        if (tx.from.toLowerCase() === zero) mintRecipients.add(tx.to.toLowerCase());
      }

      const topAddresses = Array.from(mintRecipients).slice(0, 10);
      const balanceChecks = await Promise.allSettled(
        topAddresses.map((addr) =>
          publicClient.readContract({
            address: CONTRACTS.mTBILL.token,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [addr as `0x${string}`],
          })
        )
      );

      const addressBalances = topAddresses
        .map((addr, i) => ({
          address: addr,
          balance: balanceChecks[i].status === "fulfilled"
            ? formatTokenAmount(balanceChecks[i].value as bigint, mTBILLDecimals)
            : 0,
        }))
        .filter((a) => a.balance > 0)
        .sort((a, b) => b.balance - a.balance)
        .slice(0, 5);

      const mTBILLConcentration: HolderConcentration[] = addressBalances.map((a, i) => ({
        address: a.address,
        balance: a.balance,
        pctOfSupply: mTBILLTotalSupply > 0 ? (a.balance / mTBILLTotalSupply) * 100 : 0,
        rank: i + 1,
      }));

      const top5Pct = mTBILLConcentration.reduce((s, h) => s + h.pctOfSupply, 0);
      const concentrationLevel: "low" | "medium" | "high" =
        top5Pct < 50 ? "low" : top5Pct < 75 ? "medium" : "high";

      setData({
        mTBILL: {
          totalSupply: mTBILLTotalSupply,
          protocolHeld: mTBILLProtocolHeld,
          investorHeld: mTBILLTotalSupply - mTBILLProtocolHeld,
          protocolPct: mTBILLTotalSupply > 0 ? (mTBILLProtocolHeld / mTBILLTotalSupply) * 100 : 0,
          investorPct: mTBILLTotalSupply > 0 ? ((mTBILLTotalSupply - mTBILLProtocolHeld) / mTBILLTotalSupply) * 100 : 0,
        },
        mBASIS: {
          totalSupply: mBASISTotalSupply,
          protocolHeld: mBASISProtocolHeld,
          investorHeld: mBASISTotalSupply - mBASISProtocolHeld,
          protocolPct: mBASISTotalSupply > 0 ? (mBASISProtocolHeld / mBASISTotalSupply) * 100 : 0,
          investorPct: mBASISTotalSupply > 0 ? ((mBASISTotalSupply - mBASISProtocolHeld) / mBASISTotalSupply) * 100 : 0,
        },
        protocols,
        mTBILLConcentration,
        top5PctMTBILL: top5Pct,
        concentrationLevel,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch distribution data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
