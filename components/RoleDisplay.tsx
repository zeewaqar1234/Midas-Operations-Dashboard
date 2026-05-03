"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, ExternalLink, RefreshCw, Key, Flame, Coins, PlusCircle } from "lucide-react";
import { publicClient } from "@/lib/viem-client";
import { ACCESS_CONTROL_ABI } from "@/lib/contracts";
import { ROLES, ROLE_LABELS, ETHERSCAN_URL } from "@/lib/constants";
import AddressTag from "@/components/AddressTag";
import { getEventLogs } from "@/lib/etherscan";
import { keccak256, toHex } from "viem";

// ─── Role group definitions — operational framing ─────────────────────────────

const ROLE_GROUPS = [
  {
    key: "DEFAULT_ADMIN_ROLE",
    hash: ROLES.DEFAULT_ADMIN_ROLE,
    label: "Admin",
    description: "Controls the contract — can grant/revoke all roles",
    icon: Key,
    color: "text-warning",
    bg: "bg-warning/10",
  },
  {
    key: "MINTER_ROLE",
    hash: ROLES.MINTER_ROLE,
    label: "Minter",
    description: "Can process subscriptions — creates new tokens",
    icon: PlusCircle,
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    key: "BURNER_ROLE",
    hash: ROLES.BURNER_ROLE,
    label: "Burner",
    description: "Can process redemptions — destroys tokens",
    icon: Flame,
    color: "text-danger",
    bg: "bg-danger/10",
  },
  {
    key: "DEPOSITOR_ROLE",
    hash: ROLES.DEPOSITOR_ROLE,
    label: "Depositor",
    description: "Can deposit into the contract",
    icon: Coins,
    color: "text-accent",
    bg: "bg-accent/10",
  },
] as const;

interface RoleHolder {
  role: string;
  address: string;
  active: boolean;
}

const ROLE_GRANTED_TOPIC = keccak256(toHex("RoleGranted(bytes32,address,address)"));
const ROLE_REVOKED_TOPIC = keccak256(toHex("RoleRevoked(bytes32,address,address)"));

function addressFromTopic(topic: string): string {
  return "0x" + topic.slice(-40);
}

// ─── Single role group card ───────────────────────────────────────────────────

function RoleGroupCard({
  group,
  holders,
  loading,
}: {
  group: (typeof ROLE_GROUPS)[number];
  holders: RoleHolder[];
  loading: boolean;
}) {
  const Icon = group.icon;
  const active = holders.filter((h) => h.active);
  const revoked = holders.filter((h) => !h.active);

  return (
    <div className="flex flex-col gap-2.5 p-4 rounded-[8px] bg-surface-2/50 border border-border/50">
      {/* Role header */}
      <div className="flex items-start gap-2.5">
        <div className={`w-7 h-7 rounded-[6px] ${group.bg} flex items-center justify-center shrink-0 mt-0.5`}>
          <Icon size={13} className={group.color} />
        </div>
        <div>
          <div className={`text-xs font-semibold ${group.color}`}>{group.label}</div>
          <div className="text-[11px] text-text-muted leading-snug mt-0.5">{group.description}</div>
        </div>
      </div>

      {/* Role hash */}
      <div className="font-mono text-[10px] text-text-muted truncate">
        {group.hash.slice(0, 18)}…
      </div>

      {/* Address list */}
      {loading ? (
        <div className="space-y-1.5">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="animate-pulse h-7 rounded-[6px] bg-surface-3" />
          ))}
        </div>
      ) : active.length === 0 && revoked.length === 0 ? (
        <div className="text-[11px] text-text-muted italic">No addresses on record</div>
      ) : (
        <div className="space-y-1.5">
          {active.map((h) => (
            <div key={h.address} className="flex items-center justify-between gap-2 bg-surface rounded-[6px] px-2.5 py-1.5 border border-border/40">
              <AddressTag address={h.address} showLabel etherscanLink copyable />
              <span className="flex items-center gap-1 text-[10px] text-success shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                Active
              </span>
            </div>
          ))}
          {revoked.map((h) => (
            <div key={h.address} className="flex items-center justify-between gap-2 bg-surface rounded-[6px] px-2.5 py-1.5 border border-border/40 opacity-50">
              <AddressTag address={h.address} showLabel copyable />
              <span className="flex items-center gap-1 text-[10px] text-text-muted shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-text-muted" />
                Revoked
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

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
      const [granted, revoked] = await Promise.allSettled([
        getEventLogs(contract, ROLE_GRANTED_TOPIC, { offset: 100 }),
        getEventLogs(contract, ROLE_REVOKED_TOPIC, { offset: 100 }),
      ]);

      const grantedPairs = new Map<string, { role: string; address: string }>();
      if (granted.status === "fulfilled") {
        for (const log of granted.value) {
          const role = log.topics[1] ?? "";
          const address = addressFromTopic(log.topics[2] ?? "");
          grantedPairs.set(`${role}-${address}`, { role, address });
        }
      }

      const revokedPairs = new Set<string>();
      if (revoked.status === "fulfilled") {
        for (const log of revoked.value) {
          const role = log.topics[1] ?? "";
          const address = addressFromTopic(log.topics[2] ?? "");
          revokedPairs.add(`${role}-${address}`);
        }
      }

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
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <ShieldCheck size={15} className="text-accent" />
          <div>
            <span className="text-sm font-semibold text-text-primary">{contractLabel}</span>
            <span className="text-xs text-text-muted ml-2">Workspace</span>
          </div>
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
          <button onClick={load} disabled={loading} className="btn-ghost py-1 px-2">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Contract address */}
      <div className="px-5 py-2.5 border-b border-border/40 bg-surface-2/30">
        <span className="text-[11px] text-text-muted">Contract: </span>
        <a
          href={`${ETHERSCAN_URL}/address/${contract}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[11px] text-text-secondary hover:text-accent transition-colors"
        >
          {contract.slice(0, 12)}…{contract.slice(-8)}
        </a>
      </div>

      {/* Error */}
      {error && (
        <div className="px-5 py-3 text-xs text-danger">{error}</div>
      )}

      {/* Role groups */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ROLE_GROUPS.map((group) => (
          <RoleGroupCard
            key={group.key}
            group={group}
            holders={holders.filter(
              (h) => h.role.toLowerCase() === group.hash.toLowerCase()
            )}
            loading={loading}
          />
        ))}
      </div>
    </div>
  );
}
