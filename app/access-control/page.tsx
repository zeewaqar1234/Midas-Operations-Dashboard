"use client";

import { ShieldAlert, ExternalLink } from "lucide-react";
import RoleDisplay from "@/components/RoleDisplay";
import AddressLookup from "@/components/AddressLookup";
import WhitelistSimulator from "@/components/WhitelistSimulator";
import { useRoles } from "@/hooks/useRoles";
import { CONTRACTS, ETHERSCAN_URL } from "@/lib/constants";
import StatusBadge from "@/components/StatusBadge";
import AddressTag from "@/components/AddressTag";

function RoleEventFeed() {
  const { roleEvents, eventsLoading, eventsError } = useRoles();

  return (
    <div className="card flex flex-col">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert size={15} className="text-text-muted" />
          <span className="text-sm font-semibold text-text-primary">
            Recent Role Events
          </span>
        </div>
        <span className="text-xs text-text-muted">On-chain · both contracts</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[540px]">
          <thead>
            <tr className="border-b border-border bg-surface-2/40">
              {["Event", "Role", "Account", "Contract", "Time"].map((h) => (
                <th
                  key={h}
                  className="py-2.5 px-4 text-left text-xs font-medium text-text-muted uppercase tracking-widest"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {eventsLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[60, 100, 140, 60, 60].map((w, j) => (
                    <td key={j} className="py-3 px-4 border-b border-border/40">
                      <div
                        className="animate-pulse h-4 rounded bg-surface-3"
                        style={{ width: w }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : eventsError ? (
              <tr>
                <td colSpan={5} className="py-6 px-5 text-xs text-danger text-center">
                  {eventsError}
                </td>
              </tr>
            ) : roleEvents.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 px-5 text-sm text-text-muted text-center">
                  No role events found
                </td>
              </tr>
            ) : (
              roleEvents.map((ev, i) => (
                <tr
                  key={i}
                  className="hover:bg-surface-2/40 transition-colors border-b border-border/40 last:border-0"
                >
                  <td className="py-2.5 px-4">
                    <StatusBadge
                      variant={ev.type === "granted" ? "success" : "danger"}
                      label={ev.type === "granted" ? "Granted" : "Revoked"}
                      size="sm"
                    />
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="font-mono text-xs text-accent">
                      {ev.roleLabel}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <AddressTag address={ev.account} etherscanLink copyable />
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono text-text-secondary">
                        {ev.contractLabel}
                      </span>
                      <a
                        href={`${ETHERSCAN_URL}/tx/${ev.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-muted hover:text-accent"
                      >
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-xs text-text-muted whitespace-nowrap">
                    {/* timeAgo needs unix seconds, ev.timestamp is already formatted */}
                    {ev.timestamp}
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

export default function WhitelistPage() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary">
          Access Control
        </h1>
        <p className="text-sm text-text-muted mt-0.5">
          MPC workspace map — who controls each contract and what they can do
        </p>
      </div>

      {/* Strategy Manager Workspace Map — both contracts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <RoleDisplay
          contract={CONTRACTS.mTBILL.token}
          contractLabel="mTBILL"
        />
        <RoleDisplay
          contract={CONTRACTS.mBASIS.token}
          contractLabel="mBASIS"
        />
      </div>

      {/* Address lookup */}
      <AddressLookup />

      {/* Whitelist simulator */}
      <WhitelistSimulator />

      {/* Recent role events */}
      <RoleEventFeed />
    </div>
  );
}
