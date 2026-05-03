"use client";

import { useState, useEffect } from "react";
import { getEventLogs } from "@/lib/etherscan";
import { CONTRACTS } from "@/lib/constants";
import { formatOraclePrice } from "@/lib/formatters";
import { keccak256, toHex } from "viem";
import { publicClient } from "@/lib/viem-client";
import { ORACLE_ABI } from "@/lib/contracts";

export interface NavPoint {
  date: string;       // "Apr 15"
  timestamp: number;
  price: number;
}

export interface UseNavHistoryReturn {
  data: NavPoint[];
  loading: boolean;
  error: string | null;
  currentPrice: number | null;
  oracleDecimals: number;
}

// Chainlink oracle AnswerUpdated(int256,uint256,uint256)
const ANSWER_UPDATED_TOPIC = keccak256(
  toHex("AnswerUpdated(int256,uint256,uint256)")
);

export function useNavHistory(): UseNavHistoryReturn {
  const [data, setData] = useState<NavPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [oracleDecimals, setOracleDecimals] = useState(8);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      setError(null);
      try {
        // Get oracle decimals + latest price
        const [decimals, latest] = await Promise.all([
          publicClient.readContract({
            address: CONTRACTS.mTBILL.oracle,
            abi: ORACLE_ABI,
            functionName: "decimals",
          }),
          publicClient.readContract({
            address: CONTRACTS.mTBILL.oracle,
            abi: ORACLE_ABI,
            functionName: "latestRoundData",
          }),
        ]);

        setOracleDecimals(decimals);
        const [, latestAnswer] = latest;
        const latestPrice =
          latestAnswer > BigInt(0)
            ? formatOraclePrice(latestAnswer, decimals)
            : null;
        setCurrentPrice(latestPrice);

        // Pull AnswerUpdated events (last ~100 oracle updates)
        const logs = await getEventLogs(
          CONTRACTS.mTBILL.oracle,
          ANSWER_UPDATED_TOPIC,
          { offset: 100 }
        );

        if (logs.length === 0) {
          // No event history — build a flat line from latest price
          if (latestPrice) {
            const now = Date.now();
            const points: NavPoint[] = Array.from({ length: 30 }, (_, i) => {
              const ts = now - (29 - i) * 86400 * 1000;
              return {
                date: new Date(ts).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                }),
                timestamp: ts,
                price: latestPrice,
              };
            });
            setData(points);
          }
          return;
        }

        // Parse event logs: topics[1] = current (int256, indexed)
        const points: NavPoint[] = logs
          .map((log) => {
            const rawAnswer = log.topics[1];
            if (!rawAnswer) return null;
            // topics are 32-byte hex — parse as signed int256
            const answer = BigInt(rawAnswer);
            // Handle two's complement for negative (shouldn't be for NAV but be safe)
            const price = formatOraclePrice(answer > BigInt(0) ? answer : BigInt(0), decimals);
            const ts = parseInt(log.timeStamp, 16) * 1000;
            return {
              date: new Date(ts).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              }),
              timestamp: ts,
              price,
            } satisfies NavPoint;
          })
          .filter((p): p is NavPoint => p !== null && p.price > 0)
          .sort((a, b) => a.timestamp - b.timestamp);

        // Deduplicate by day — keep last reading per day
        const byDay = new Map<string, NavPoint>();
        for (const p of points) {
          byDay.set(p.date, p);
        }

        setData(Array.from(byDay.values()).slice(-30));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch NAV history"
        );
      } finally {
        setLoading(false);
      }
    }

    fetch();
  }, []);

  return { data, loading, error, currentPrice, oracleDecimals };
}
