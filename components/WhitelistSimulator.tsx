"use client";

import { useState } from "react";
import { AlertTriangle, Code2, Send } from "lucide-react";
import { encodeFunctionData } from "viem";
import { ACCESS_CONTROL_ABI } from "@/lib/contracts";
import { CONTRACTS, ROLES, ROLE_LABELS } from "@/lib/constants";
import { isAddress } from "@/lib/formatters";

type Action = "grant" | "revoke";
type Product = "mTBILL" | "mBASIS";
type RoleKey = keyof typeof ROLES;

interface SimulatedTx {
  to: string;
  functionName: string;
  calldata: string;
  gasEstimate: string;
  value: "0 ETH";
  role: string;
  roleLabel: string;
  account: string;
}

const ROLE_OPTIONS: { value: RoleKey; label: string }[] = [
  { value: "MINTER_ROLE", label: "MINTER_ROLE" },
  { value: "BURNER_ROLE", label: "BURNER_ROLE" },
  { value: "DEFAULT_ADMIN_ROLE", label: "DEFAULT_ADMIN_ROLE" },
  { value: "DEPOSITOR_ROLE", label: "DEPOSITOR_ROLE" },
];

export default function WhitelistSimulator() {
  const [address, setAddress] = useState("");
  const [action, setAction] = useState<Action>("grant");
  const [product, setProduct] = useState<Product>("mTBILL");
  const [role, setRole] = useState<RoleKey>("MINTER_ROLE");
  const [reason, setReason] = useState("");
  const [simulated, setSimulated] = useState<SimulatedTx | null>(null);
  const [error, setError] = useState<string | null>(null);

  const contractAddress =
    product === "mTBILL" ? CONTRACTS.mTBILL.token : CONTRACTS.mBASIS.token;

  const simulate = () => {
    const addr = address.trim();
    if (!isAddress(addr)) {
      setError("Enter a valid Ethereum address (0x…)");
      return;
    }
    setError(null);

    const roleHash = ROLES[role];
    const fnName = action === "grant" ? "grantRole" : "revokeRole";

    const calldata = encodeFunctionData({
      abi: ACCESS_CONTROL_ABI,
      functionName: fnName,
      args: [roleHash, addr as `0x${string}`],
    });

    // Realistic gas estimates based on OpenZeppelin AccessControl operations
    const gasEstimate = action === "grant" ? "~47,000" : "~30,000";

    setSimulated({
      to: contractAddress,
      functionName: fnName,
      calldata,
      gasEstimate,
      value: "0 ETH",
      role: roleHash,
      roleLabel: ROLE_LABELS[roleHash.toLowerCase()] ?? role,
      account: addr,
    });
  };

  return (
    <div className="card flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Code2 size={15} className="text-warning" />
          <h2 className="text-sm font-semibold text-text-primary">
            Whitelist Simulation
          </h2>
          <span className="badge badge-warning ml-1">Mock — Read Only</span>
        </div>
        <p className="text-xs text-text-muted mt-1">
          Simulates the ops workflow of adding/removing addresses. Generates the
          exact on-chain calldata without executing anything.
        </p>
      </div>

      {/* Form */}
      <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-border">
        {/* Address */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-text-muted mb-1.5">
            Target Address
          </label>
          <input
            className="input"
            placeholder="0x investor or operator address…"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        {/* Action */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">
            Action
          </label>
          <div className="flex gap-2">
            {(["grant", "revoke"] as Action[]).map((a) => (
              <button
                key={a}
                onClick={() => setAction(a)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  action === a
                    ? a === "grant"
                      ? "bg-success/10 text-success border-success/30"
                      : "bg-danger/10 text-danger border-danger/30"
                    : "bg-surface-2 text-text-secondary border-border hover:border-text-muted"
                }`}
              >
                {a === "grant" ? "Grant Role" : "Revoke Role"}
              </button>
            ))}
          </div>
        </div>

        {/* Product */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">
            Product
          </label>
          <div className="flex gap-2">
            {(["mTBILL", "mBASIS"] as Product[]).map((p) => (
              <button
                key={p}
                onClick={() => setProduct(p)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  product === p
                    ? "bg-accent/10 text-accent border-accent/30"
                    : "bg-surface-2 text-text-secondary border-border hover:border-text-muted"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Role */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">
            Role
          </label>
          <select
            className="input font-mono text-xs"
            value={role}
            onChange={(e) => setRole(e.target.value as RoleKey)}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">
            Reason (internal note)
          </label>
          <input
            className="input"
            placeholder="New institutional investor…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {/* Submit */}
        <div className="sm:col-span-2">
          <button onClick={simulate} className="btn-primary w-full">
            <Send size={14} />
            Generate Simulated Transaction
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-5 mt-4 flex items-center gap-2 text-xs text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">
          <AlertTriangle size={13} />
          {error}
        </div>
      )}

      {/* Simulated result */}
      {simulated && (
        <div className="px-5 py-4 flex flex-col gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
            <span className="text-xs font-semibold text-warning uppercase tracking-widest">
              Simulated Transaction Preview
            </span>
          </div>

          <div className="bg-surface rounded-lg border border-border p-4 font-mono text-xs space-y-2.5">
            <div className="flex gap-3">
              <span className="text-text-muted w-28 shrink-0">Function</span>
              <span className="text-accent font-semibold">{simulated.functionName}(bytes32, address)</span>
            </div>
            <div className="flex gap-3">
              <span className="text-text-muted w-28 shrink-0">To (contract)</span>
              <span className="text-text-primary break-all">{simulated.to}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-text-muted w-28 shrink-0">Role (param 1)</span>
              <div className="flex flex-col gap-0.5">
                <span className="text-warning">{simulated.roleLabel}</span>
                <span className="text-text-secondary text-[10px] break-all">
                  {simulated.role}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-text-muted w-28 shrink-0">Account (param 2)</span>
              <span className="text-text-primary break-all">{simulated.account}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-text-muted w-28 shrink-0">Value</span>
              <span className="text-text-muted">{simulated.value}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-text-muted w-28 shrink-0">Gas Estimate</span>
              <span className="text-text-primary">{simulated.gasEstimate} gas units</span>
            </div>
            <div className="pt-2 border-t border-border flex flex-col gap-0.5">
              <span className="text-text-muted text-[10px] uppercase tracking-widest">Calldata (hex)</span>
              <span className="text-text-secondary break-all text-[10px] leading-5">
                {simulated.calldata}
              </span>
            </div>
          </div>

          {reason && (
            <div className="text-xs text-text-muted border border-border rounded-lg px-3 py-2">
              <span className="font-medium text-text-secondary">Internal note: </span>
              {reason}
            </div>
          )}

          <div className="flex items-start gap-2 text-xs text-warning bg-warning/5 border border-warning/20 rounded-lg px-3 py-2">
            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
            Mock mode: this transaction has NOT been submitted. In production,
            this calldata would be signed by the admin multisig and executed via
            the Midas MPC workspace with approver quorum.
          </div>
        </div>
      )}
    </div>
  );
}
