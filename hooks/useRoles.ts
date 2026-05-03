"use client";

import { useState, useEffect, useCallback } from "react";
import { publicClient } from "@/lib/viem-client";
import { ACCESS_CONTROL_ABI } from "@/lib/contracts";
import { CONTRACTS, ROLES, ROLE_LABELS } from "@/lib/constants";
import { getEventLogs, type EtherscanLogEntry } from "@/lib/etherscan";
import { formatDateTime } from "@/lib/formatters";
import { keccak256, toHex } from "viem";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RoleEntry {
  role: string;
  roleLabel: string;
  address: string;
  contract: string;
  contractLabel: string;
}

export interface AddressRoleInfo {
  address: string;
  mTBILL: {
    balance: bigint;
    hasAdminRole: boolean;
    hasMinterRole: boolean;
    hasBurnerRole: boolean;
  };
  mBASIS: {
    balance: bigint;
    hasAdminRole: boolean;
    hasMinterRole: boolean;
    hasBurnerRole: boolean;
  };
}

export interface RoleEvent {
  type: "granted" | "revoked";
  role: string;
  roleLabel: string;
  account: string;
  sender: string;
  txHash: string;
  timestamp: string;
  contract: string;
  contractLabel: string;
}

export interface UseRolesReturn {
  roleEvents: RoleEvent[];
  eventsLoading: boolean;
  eventsError: string | null;
  checkAddress: (address: string) => Promise<AddressRoleInfo>;
  checking: boolean;
}

// Event topic hashes for RoleGranted / RoleRevoked
const ROLE_GRANTED_TOPIC = keccak256(
  toHex("RoleGranted(bytes32,address,address)")
);
const ROLE_REVOKED_TOPIC = keccak256(
  toHex("RoleRevoked(bytes32,address,address)")
);

// ─── Helper: decode a role event log ─────────────────────────────────────────

function decodeRoleEvent(
  log: EtherscanLogEntry,
  type: "granted" | "revoked",
  contractLabel: string
): RoleEvent {
  // topics[0] = event sig, topics[1] = role (bytes32), topics[2] = account (address)
  const role = log.topics[1] ?? "";
  const accountRaw = log.topics[2] ?? "";
  const senderRaw = log.topics[3] ?? "";

  // Pad/trim address from 32-byte topic
  const account = accountRaw.length >= 42
    ? "0x" + accountRaw.slice(-40)
    : accountRaw;
  const sender = senderRaw.length >= 42
    ? "0x" + senderRaw.slice(-40)
    : senderRaw;

  return {
    type,
    role,
    roleLabel: ROLE_LABELS[role.toLowerCase()] ?? role.slice(0, 10) + "...",
    account,
    sender,
    txHash: log.transactionHash,
    timestamp: formatDateTime(log.timeStamp),
    contract: log.address,
    contractLabel,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRoles(): UseRolesReturn {
  const [roleEvents, setRoleEvents] = useState<RoleEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  // Fetch recent RoleGranted + RoleRevoked events from both contracts
  useEffect(() => {
    async function fetchEvents() {
      setEventsLoading(true);
      setEventsError(null);
      try {
        const [
          mTBILLGranted,
          mTBILLRevoked,
          mBASISGranted,
          mBASISRevoked,
        ] = await Promise.allSettled([
          getEventLogs(CONTRACTS.mTBILL.token, ROLE_GRANTED_TOPIC, { offset: 25 }),
          getEventLogs(CONTRACTS.mTBILL.token, ROLE_REVOKED_TOPIC, { offset: 25 }),
          getEventLogs(CONTRACTS.mBASIS.token, ROLE_GRANTED_TOPIC, { offset: 25 }),
          getEventLogs(CONTRACTS.mBASIS.token, ROLE_REVOKED_TOPIC, { offset: 25 }),
        ]);

        const events: RoleEvent[] = [];

        if (mTBILLGranted.status === "fulfilled") {
          events.push(
            ...mTBILLGranted.value.map((log) =>
              decodeRoleEvent(log, "granted", "mTBILL")
            )
          );
        }
        if (mTBILLRevoked.status === "fulfilled") {
          events.push(
            ...mTBILLRevoked.value.map((log) =>
              decodeRoleEvent(log, "revoked", "mTBILL")
            )
          );
        }
        if (mBASISGranted.status === "fulfilled") {
          events.push(
            ...mBASISGranted.value.map((log) =>
              decodeRoleEvent(log, "granted", "mBASIS")
            )
          );
        }
        if (mBASISRevoked.status === "fulfilled") {
          events.push(
            ...mBASISRevoked.value.map((log) =>
              decodeRoleEvent(log, "revoked", "mBASIS")
            )
          );
        }

        // Sort by timestamp descending
        events.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
        setRoleEvents(events.slice(0, 50));
      } catch (err) {
        setEventsError(
          err instanceof Error ? err.message : "Failed to fetch role events"
        );
      } finally {
        setEventsLoading(false);
      }
    }

    fetchEvents();
  }, []);

  // On-demand: check a specific address's roles and balances
  const checkAddress = useCallback(
    async (address: string): Promise<AddressRoleInfo> => {
      setChecking(true);
      try {
        const addr = address as `0x${string}`;

        const { ERC20_ABI: erc20 } = await import("@/lib/contracts");

        // Fetch balances and role checks in a single parallel batch
        const [
          mTBILLBal,
          mTBILLAdmin,
          mTBILLMinter,
          mTBILLBurner,
          mBASISBal,
          mBASISAdmin,
          mBASISMinter,
          mBASISBurner,
        ] = await Promise.all([
          publicClient.readContract({
            address: CONTRACTS.mTBILL.token,
            abi: erc20,
            functionName: "balanceOf",
            args: [addr],
          }).catch(() => BigInt(0)),
          publicClient.readContract({
            address: CONTRACTS.mTBILL.token,
            abi: ACCESS_CONTROL_ABI,
            functionName: "hasRole",
            args: [ROLES.DEFAULT_ADMIN_ROLE, addr],
          }).catch(() => false as boolean),
          publicClient.readContract({
            address: CONTRACTS.mTBILL.token,
            abi: ACCESS_CONTROL_ABI,
            functionName: "hasRole",
            args: [ROLES.MINTER_ROLE, addr],
          }).catch(() => false as boolean),
          publicClient.readContract({
            address: CONTRACTS.mTBILL.token,
            abi: ACCESS_CONTROL_ABI,
            functionName: "hasRole",
            args: [ROLES.BURNER_ROLE, addr],
          }).catch(() => false as boolean),
          publicClient.readContract({
            address: CONTRACTS.mBASIS.token,
            abi: erc20,
            functionName: "balanceOf",
            args: [addr],
          }).catch(() => BigInt(0)),
          publicClient.readContract({
            address: CONTRACTS.mBASIS.token,
            abi: ACCESS_CONTROL_ABI,
            functionName: "hasRole",
            args: [ROLES.DEFAULT_ADMIN_ROLE, addr],
          }).catch(() => false as boolean),
          publicClient.readContract({
            address: CONTRACTS.mBASIS.token,
            abi: ACCESS_CONTROL_ABI,
            functionName: "hasRole",
            args: [ROLES.MINTER_ROLE, addr],
          }).catch(() => false as boolean),
          publicClient.readContract({
            address: CONTRACTS.mBASIS.token,
            abi: ACCESS_CONTROL_ABI,
            functionName: "hasRole",
            args: [ROLES.BURNER_ROLE, addr],
          }).catch(() => false as boolean),
        ]);

        return {
          address,
          mTBILL: {
            balance: mTBILLBal as bigint,
            hasAdminRole: Boolean(mTBILLAdmin),
            hasMinterRole: Boolean(mTBILLMinter),
            hasBurnerRole: Boolean(mTBILLBurner),
          },
          mBASIS: {
            balance: mBASISBal as bigint,
            hasAdminRole: Boolean(mBASISAdmin),
            hasMinterRole: Boolean(mBASISMinter),
            hasBurnerRole: Boolean(mBASISBurner),
          },
        };
      } finally {
        setChecking(false);
      }
    },
    []
  );

  return {
    roleEvents,
    eventsLoading,
    eventsError,
    checkAddress,
    checking,
  };
}
