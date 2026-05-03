"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getTokenHolders,
  getTokenTransfers,
  getWalletTokenTxs,
  type EtherscanTokenHolder,
  type EtherscanTokenTx,
} from "@/lib/etherscan";
import { publicClient } from "@/lib/viem-client";
import { ERC20_ABI } from "@/lib/contracts";
import { CONTRACTS, KNOWN_ADDRESSES } from "@/lib/constants";
import { formatTokenAmount, formatDate } from "@/lib/formatters";

export type ExplorerToken = "mTBILL" | "mBASIS";

// ─── Holder types ─────────────────────────────────────────────────────────────

export interface HolderEntry {
  rank: number;
  address: string;
  label: string | null;
  balance: number;
  pctOfSupply: number;
}

// ─── Daily flow types ─────────────────────────────────────────────────────────

export interface DailyFlow {
  date: string;
  minted: number;
  burned: number;
  net: number;
}

// ─── Wallet deep-dive types ───────────────────────────────────────────────────

export interface WalletInfo {
  address: string;
  ethBalance: number;
  mTBILLBalance: number;
  mBASISBalance: number;
  interactions: WalletInteraction[];
}

export interface WalletInteraction {
  hash: string;
  date: string;
  eventType: "mint" | "burn" | "transfer";
  tokenSymbol: string;
  amount: number;
  counterparty: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveLabel(address: string): string | null {
  const norm = address.toLowerCase();
  for (const [k, v] of Object.entries(KNOWN_ADDRESSES)) {
    if (k.toLowerCase() === norm) return v;
  }
  return null;
}

function getContractForToken(token: ExplorerToken): `0x${string}` {
  return token === "mTBILL" ? CONTRACTS.mTBILL.token : CONTRACTS.mBASIS.token;
}

// ─── Top Holders hook ─────────────────────────────────────────────────────────

export function useTopHolders(token: ExplorerToken) {
  const [holders, setHolders] = useState<HolderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSupply, setTotalSupply] = useState<number>(0);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      setError(null);
      try {
        const contract = getContractForToken(token);

        const [rawHolders, supplyRaw, decimalsRaw] = await Promise.all([
          getTokenHolders(contract, { offset: 25 }),
          publicClient.readContract({ address: contract, abi: ERC20_ABI, functionName: "totalSupply" }),
          publicClient.readContract({ address: contract, abi: ERC20_ABI, functionName: "decimals" }),
        ]);

        const supply = formatTokenAmount(supplyRaw, decimalsRaw);
        setTotalSupply(supply);

        // Verify live balances via RPC (free tier — rawHolders has approximate values)
        const liveBalances = await Promise.allSettled(
          rawHolders.map((h: EtherscanTokenHolder) =>
            publicClient.readContract({
              address: contract,
              abi: ERC20_ABI,
              functionName: "balanceOf",
              args: [h.TokenHolderAddress as `0x${string}`],
            })
          )
        );

        const entries: HolderEntry[] = rawHolders
          .map((h: EtherscanTokenHolder, i: number) => {
            const rawBal =
              liveBalances[i].status === "fulfilled"
                ? (liveBalances[i] as PromiseFulfilledResult<bigint>).value
                : BigInt(h.TokenHolderQuantity);
            const bal = formatTokenAmount(rawBal, decimalsRaw);
            return {
              rank: i + 1,
              address: h.TokenHolderAddress,
              label: resolveLabel(h.TokenHolderAddress),
              balance: bal,
              pctOfSupply: supply > 0 ? (bal / supply) * 100 : 0,
            };
          })
          .filter((e: HolderEntry) => e.balance > 0)
          .sort((a: HolderEntry, b: HolderEntry) => b.balance - a.balance)
          .map((e: HolderEntry, i: number) => ({ ...e, rank: i + 1 }));

        setHolders(entries);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load holders");
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [token]);

  return { holders, loading, error, totalSupply };
}

// ─── Daily Flow hook ──────────────────────────────────────────────────────────

export function useDailyFlow(token: ExplorerToken) {
  const [data, setData] = useState<DailyFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      setError(null);
      try {
        const contract = getContractForToken(token);
        const decimalsRaw = await publicClient.readContract({
          address: contract,
          abi: ERC20_ABI,
          functionName: "decimals",
        });

        const txs = await getTokenTransfers(contract, { offset: 200, sort: "desc" });

        const zero = "0x0000000000000000000000000000000000000000";
        const byDay = new Map<string, { minted: number; burned: number }>();

        // Last 30 days
        const cutoff = Date.now() / 1000 - 30 * 86400;

        for (const tx of txs) {
          if (Number(tx.timeStamp) < cutoff) continue;
          const from = tx.from.toLowerCase();
          const to = tx.to.toLowerCase();
          const isMint = from === zero;
          const isBurn = to === zero;
          if (!isMint && !isBurn) continue;

          const date = formatDate(tx.timeStamp);
          const amount = formatTokenAmount(tx.value, decimalsRaw);
          const entry = byDay.get(date) ?? { minted: 0, burned: 0 };
          if (isMint) entry.minted += amount;
          else entry.burned += amount;
          byDay.set(date, entry);
        }

        // Build a sorted array filling gaps
        const now = Date.now();
        const result: DailyFlow[] = [];
        for (let i = 29; i >= 0; i--) {
          const ts = now - i * 86400 * 1000;
          const date = new Date(ts).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          const entry = byDay.get(date) ?? { minted: 0, burned: 0 };
          result.push({ date, minted: entry.minted, burned: -entry.burned, net: entry.minted - entry.burned });
        }

        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load flow data");
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [token]);

  return { data, loading, error };
}

// ─── Wallet analyzer hook ─────────────────────────────────────────────────────

export function useWalletAnalyzer() {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (address: string) => {
    setLoading(true);
    setError(null);
    setWallet(null);
    try {
      const addr = address as `0x${string}`;

      const [ethBal, mTBILLBal, mTBILLDec, mBASISBal, mBASISDec] = await Promise.all([
        publicClient.getBalance({ address: addr }),
        publicClient.readContract({ address: CONTRACTS.mTBILL.token, abi: ERC20_ABI, functionName: "balanceOf", args: [addr] }),
        publicClient.readContract({ address: CONTRACTS.mTBILL.token, abi: ERC20_ABI, functionName: "decimals" }),
        publicClient.readContract({ address: CONTRACTS.mBASIS.token, abi: ERC20_ABI, functionName: "balanceOf", args: [addr] }),
        publicClient.readContract({ address: CONTRACTS.mBASIS.token, abi: ERC20_ABI, functionName: "decimals" }),
      ]);

      // All midas token interactions
      const [mTBILLTxs, mBASISTxs] = await Promise.allSettled([
        getWalletTokenTxs(address, CONTRACTS.mTBILL.token, { offset: 30 }),
        getWalletTokenTxs(address, CONTRACTS.mBASIS.token, { offset: 30 }),
      ]);

      const zero = "0x0000000000000000000000000000000000000000";
      const interactions: WalletInteraction[] = [];

      const processTxs = (txs: EtherscanTokenTx[], dec: number) => {
        for (const tx of txs) {
          const from = tx.from.toLowerCase();
          const to = tx.to.toLowerCase();
          const addrLow = address.toLowerCase();
          const type: "mint" | "burn" | "transfer" =
            from === zero ? "mint" : to === zero ? "burn" : "transfer";
          const counterparty = type === "mint" ? tx.to : type === "burn" ? tx.from : (from === addrLow ? tx.to : tx.from);
          interactions.push({
            hash: tx.hash,
            date: formatDate(tx.timeStamp),
            eventType: type,
            tokenSymbol: tx.tokenSymbol,
            amount: formatTokenAmount(tx.value, dec),
            counterparty,
          });
        }
      };

      if (mTBILLTxs.status === "fulfilled") processTxs(mTBILLTxs.value, mTBILLDec);
      if (mBASISTxs.status === "fulfilled") processTxs(mBASISTxs.value, mBASISDec);

      interactions.sort((a, b) => (a.date < b.date ? 1 : -1));

      setWallet({
        address,
        ethBalance: formatTokenAmount(ethBal, 18),
        mTBILLBalance: formatTokenAmount(mTBILLBal, mTBILLDec),
        mBASISBalance: formatTokenAmount(mBASISBal, mBASISDec),
        interactions: interactions.slice(0, 20),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet analysis failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return { wallet, loading, error, analyze };
}
