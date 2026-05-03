"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, ExternalLink, RefreshCw } from "lucide-react";
import { publicClient } from "@/lib/viem-client";
import { ACCESS_CONTROL_ABI } from "@/lib/contracts";
import { ROLES, ROLE_LABELS, ETHERSCAN_URL } from "@/lib/constants";
import StatusBadge from "@/components/StatusBadge";
import AddressTag from "@/components/AddressTag";
import { getEventLogs } from "@/lib/etherscan";
import { keccak256, toHex } from "viem";

// All roles we want to check
const ROLE_LIST = [
  { key: "DEFAULT_ADMIN_ROLE", hash: ROLES.DEFAULT_ADMIN_ROLE, label: "DEFAULT_ADMIN" },
  { key: "MINTER_ROLE", hash: ROLES.MINTER_ROLE, label: "MINTER_ROLE" },
  { key: "BURNER_ROLE", hash: ROLES.BURNER_ROLE, label: "BURNER_ROLE" },
  { key: "DEPOSITOR_ROLE", hash: ROLES.DEPOSITOR_ROLE, label: "DEPOSITOR_ROLE" },
];

// Candidate role holders — discovered from RoleGranted events
interface RoleHolder {
  role: string;
  roleLabel: string;
  address: string;
  active: boolean;
}

const ROLE_GRANTED_TOPIC = keccak256(toHex("RoleGranted(bytes32,address,address)"));
const ROLE_REVOKED_TOPIC = keccak256(toHex("RoleRevoked(bytes32,address,address)"));

function addressFromTopic(topic: string): string {
  return "0x" + topic.slice(-40);
}

export default function RoleDisplay({
  contract,
  contractLabel,
}: {
  contract: `0x${string}`;
  contractLabel: string;
}) {
  const [holders, setHolders] = useState<RoleHolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // Pull all RoleGranted events to find who ever received a role
      const [granted, revoked] = await Promise.allSettled([
        getEventLogs(contract, ROLE_GRANTED_TOPIC, { offset: 100 }),
        getEventLogs(contract, ROLE_REVOKED_TOPIC, { offset: 100 }),
      ]);

      // Build a set of (role, address) pairs that were ever granted
      const grantedPairs = new Map<string, { role: string; address: string }>();

      if (granted.status === "fulfilled") {
        for (const log of granted.value) {
          const role = log.topics[1] ?? "";
          const address = addressFromTopic(log.topics[2] ?? "");
          grantedPairs.set(`${role}-${address}`, { role, address });
        }
      }

      // Build set of revoked (role, address) pairs
      const revokedPairs = new Set<string>();
      if (revoked.status === "fulfilled") {
        for (const log of revoked.value) {
          const role = log.topics[1] ?? "";
          const address = addressFromTopic(log.topics[2] ?? "");
          revokedPairs.add(`${role}-${address}`);
        }
      }

      // For each unique (role, address) pair, verify current status on-chain
      const pairs = Array.from(grantedPairs.values());
      const checks = await Promise.allSettled(
        pairs.map(({ role, address }) =>
          publicClient.readContract({
            address: contract,
            abi: ACCESS_CONTROL_ABI,
            functionName: "hasRole",
            args: [role as `0x${string}`, address as `0x${string}`],
          })
        )
      );

      const result: RoleHolder[] = pairs.map(({ role, address }, i) => ({
        role,
        roleLabel: ROLE_LABELS[role.toLowerCase()] ?? role.slice(0, 10) + "…",
        address,
        active:
          checks[i].status === "fulfilled"
            ? Boolean(checks[i].value)
            : !revokedPairs.has(`${role}-${address}`),
      }));

      // Sort: active first, then by role label
      result.sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1;
        return a.roleLabel.localeCompare(b.roleLabel);
      });

      setHolders(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  return (
    <div className="card flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <ShieldCheck size={15} className="text-accent" />
          <span className="text-sm font-semibold text-text-primary">
            Contract Roles — {contractLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`${ETHERSCAN_URL}/address/${contract}#readContract`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted hover:text-accent transition-colors"
          >
            <ExternalLink size={13} />
          </a>
          <button
            onClick={load}
            disabled={loading}
            className="btn-ghost py-1 px-2"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Role hash reference */}
      <div className="px-5 py-3 border-b border-border bg-surface-2/40 flex flex-wrap gap-3">
        {ROLE_LIST.map((r) => (
          <div key={r.key} className="flex flex-col gap-0.5">
            <span className="text-[10px] font-medium text-text-muted uppercase tracking-widest">
              {r.label}
            </span>
            <span className="font-mono text-[10px] text-text-secondary">
              {r.hash.slice(0, 10)}…
            </span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2.5 px-5 text-left text-xs font-medium text-text-muted uppercase tracking-widest">Role</th>
              <th className="py-2.5 px-5 text-left text-xs font-medium text-text-muted uppercase tracking-widest">Address</th>
              <th className="py-2.5 px-5 text-left text-xs font-medium text-text-muted uppercase tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i}>
                  {[100, 180, 60].map((w, j) => (
                    <td key={j} className="py-3 px-5 border-b border-border/40">
                      <div className="animate-pulse h-4 rounded bg-surface-3" style={{ width: w }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={3} className="py-6 px-5 text-xs text-danger">
                  {error}
                </td>
              </tr>
            ) : holders.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-6 px-5 text-sm text-text-muted text-center">
                  No role grants found in event history
                </td>
              </tr>
            ) : (
              holders.map((h, i) => (
                <tr key={i} className="hover:bg-surface-2/40 transition-colors border-b border-border/40 last:border-0">
                  <td className="py-3 px-5">
                    <span className="font-mono text-xs font-medium text-accent">
                      {h.roleLabel}
                    </span>
                  </td>
                  <td className="py-3 px-5">
                    <AddressTag address={h.address} showLabel etherscanLink copyable />
                  </td>
                  <td className="py-3 px-5">
                    <StatusBadge
                      variant={h.active ? "success" : "muted"}
                      label={h.active ? "Active" : "Revoked"}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
