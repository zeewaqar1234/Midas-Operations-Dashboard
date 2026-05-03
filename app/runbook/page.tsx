"use client";

import { useState } from "react";
import {
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Clock,
  Shield,
  TrendingUp,
  Zap,
  RefreshCw,
  Activity,
} from "lucide-react";
import { useNavHistory } from "@/hooks/useNavHistory";
import { isStale } from "@/lib/formatters";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkflowStep {
  id: string;
  title: string;
  detail: string;
  variant?: "normal" | "warning" | "success" | "branch";
}

interface Workflow {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  steps: WorkflowStep[];
  checklist: string[];
}

// ─── Workflow definitions ─────────────────────────────────────────────────────

const WORKFLOWS: Workflow[] = [
  {
    id: "subscription",
    label: "Subscription (Mint)",
    icon: <TrendingUp size={15} />,
    description: "Investor subscribes to receive mTokens in exchange for USDC",
    steps: [
      {
        id: "s1", title: "Investor submits subscription",
        detail: "Investor sends a signed subscription request specifying amount, token type (mTBILL/mBASIS), and their whitelisted wallet address.",
      },
      {
        id: "s2", title: "KYC / Eligibility check",
        detail: "Verify investor wallet is whitelisted on the mToken contract via hasRole() or the whitelist mapping. Confirm KYC documentation is current and investor is an eligible counterparty.",
        variant: "warning",
      },
      {
        id: "s3", title: "USDC received at deposit address",
        detail: "Investor transfers USDC to the Midas deposit contract. Confirm transaction on Etherscan. Verify amount matches subscription request.",
      },
      {
        id: "s4a", title: "Instant mode: check MSL pool capacity",
        detail: "If investor requests instant settlement, verify the MSL (Market-Stable Liquidity) pool holds sufficient USDC. Pool capacity is typically ~10% of TVL. If capacity is insufficient, fall back to Standard mode.",
        variant: "branch",
      },
      {
        id: "s4b", title: "Instant mode: atomic mint at oracle NAV",
        detail: "The depositInstant() function mints mTokens at the current oracle NAV price atomically. Call latestRoundData() to confirm oracle is fresh (<24h). Tokens are sent directly to investor wallet in the same transaction.",
        variant: "success",
      },
      {
        id: "s5a", title: "Standard mode: queue for next NAV window",
        detail: "Subscription is queued. Ops processes the request within T+2 settlement days. Strategy manager deploys the USDC capital into the underlying assets (T-bills for mTBILL, basis positions for mBASIS).",
        variant: "branch",
      },
      {
        id: "s5b", title: "Standard mode: mTokens minted to investor",
        detail: "Once capital is deployed, ops triggers the mint() function through the MPC workspace. Requires approver quorum (strategy manager + Midas co-signer). mTokens are sent to the investor's whitelisted wallet.",
        variant: "success",
      },
      {
        id: "s6", title: "Confirmation & record-keeping",
        detail: "Send investor confirmation with tx hash and minted amount. Update internal tracking. Log the interaction in the ops ledger.",
      },
    ],
    checklist: [
      "Verify investor wallet is whitelisted on-chain",
      "Confirm USDC received at correct contract address",
      "Verify NAV oracle is current (< 24h since last update)",
      "Check instant redemption pool capacity (if instant mode)",
      "Confirm mint transaction success on Etherscan",
      "Verify mTokens arrived in investor wallet",
      "Update internal tracking & send confirmation",
    ],
  },
  {
    id: "redemption",
    label: "Redemption (Burn)",
    icon: <RefreshCw size={15} />,
    description: "Investor redeems mTokens in exchange for USDC",
    steps: [
      {
        id: "r1", title: "Investor submits redemption request",
        detail: "Investor submits a signed redemption request specifying amount of mTokens to burn and the destination USDC address.",
      },
      {
        id: "r2", title: "Eligibility & balance check",
        detail: "Confirm investor holds sufficient mTokens via balanceOf(). Verify destination wallet is whitelisted. Check that redemption amount does not exceed daily limits.",
        variant: "warning",
      },
      {
        id: "r3a", title: "Instant mode: verify MSL pool capacity",
        detail: "Check the MSL liquidity pool balance. Instant redemption is only available if the pool holds enough USDC to cover the redemption. For large amounts (>$1M) this may not be possible.",
        variant: "branch",
      },
      {
        id: "r3b", title: "Instant mode: atomic burn at oracle NAV",
        detail: "The redeemInstant() function burns mTokens and releases USDC from the MSL pool atomically at the current oracle NAV price. Investor receives USDC in the same block.",
        variant: "success",
      },
      {
        id: "r4a", title: "Standard mode: T+2 to T+7 settlement",
        detail: "Ops queues the redemption. Strategy manager liquidates the underlying assets over T+2 to T+7 business days. For mTBILL this means selling T-bills on the secondary market.",
        variant: "branch",
      },
      {
        id: "r4b", title: "Standard mode: burn mTokens & release USDC",
        detail: "Once USDC is available, ops executes burn() via MPC workspace (requires approver quorum). USDC is transferred to the investor's whitelisted wallet.",
        variant: "success",
      },
    ],
    checklist: [
      "Confirm investor mToken balance is sufficient",
      "Check instant redemption pool capacity (>= requested amount)",
      "Verify oracle NAV is current",
      "Flag if redemption >$1M for extra review",
      "Confirm burn transaction success on Etherscan",
      "Verify USDC transferred to correct wallet",
      "Update investor records",
    ],
  },
  {
    id: "product-launch",
    label: "New Product Launch",
    icon: <Zap size={15} />,
    description: "End-to-end workflow for launching a new mToken product",
    steps: [
      { id: "p1", title: "Partner / strategy manager onboarding", detail: "Legal agreement signed. Strategy manager's identity verified. Investment mandate and risk parameters documented." },
      { id: "p2", title: "MPC workspace setup", detail: "Create a Fordefi (or equivalent) MPC workspace for the new product. Configure approval policy: strategy manager can propose but not unilaterally execute. Midas retains co-signer requirement." },
      { id: "p3", title: "Deploy token contract", detail: "Deploy a new mToken ERC-20 contract (TransparentUpgradeableProxy pattern). Assign admin, minter, and burner roles via grantRole(). Verify deployment on Etherscan." },
      { id: "p4", title: "Configure whitelist", detail: "Set up the initial whitelist for the product — at minimum the strategy manager's operational wallets and any seed investors. Test hasRole() for all configured addresses." },
      { id: "p5", title: "Deploy oracle contract", detail: "Deploy Chainlink-compatible oracle. Set initial NAV price. Verify latestRoundData() returns correct values and description()." },
      { id: "p6", title: "Integration testing", detail: "Execute a small test mint and burn on a staging network or with a small amount on mainnet. Verify the full cycle: deposit → mint at NAV → transfer → burn → redemption." },
      { id: "p7", title: "Go-live", detail: "Announce product to eligible investors. Open subscriptions. Monitor first transactions closely.", variant: "success" },
    ],
    checklist: [
      "Legal agreement signed and on file",
      "MPC workspace configured with correct approval policy",
      "Token contract deployed and roles verified",
      "Oracle deployed and returning correct NAV",
      "Whitelist configured for seed investors",
      "Test mint/burn cycle completed successfully",
      "Investor communications sent",
    ],
  },
  {
    id: "whitelist-update",
    label: "Whitelist Update",
    icon: <Shield size={15} />,
    description: "Add or remove an address from the mToken access control",
    steps: [
      { id: "w1", title: "Request received from strategy manager", detail: "Strategy manager submits a formal request (via email or internal system) to add/remove a specific wallet address, specifying the product and reason." },
      { id: "w2", title: "KYC / compliance review", detail: "Midas compliance team reviews the address. For additions: verify KYC documentation, investor eligibility, and jurisdiction. For removals: confirm no pending transactions.", variant: "warning" },
      { id: "w3", title: "Internal approver quorum", detail: "The whitelist change must be approved by the required internal quorum (e.g. 2-of-3 approvers within Midas). This is enforced by the MPC workspace policy." },
      { id: "w4", title: "Prepare on-chain transaction", detail: "Prepare a grantRole(MINTER_ROLE, address) or equivalent call. Generate the calldata and verify it matches the intended action. Double-check the contract address and role hash." },
      { id: "w5", title: "Execute via MPC workspace", detail: "Submit the transaction through Fordefi. Collect required co-signatures. Broadcast to the network.", variant: "warning" },
      { id: "w6", title: "Verify on-chain", detail: "Confirm the RoleGranted event was emitted. Call hasRole() to verify the new state. Check Etherscan for transaction success.", variant: "success" },
    ],
    checklist: [
      "Formal request received and documented",
      "KYC / compliance review completed",
      "Internal approver quorum reached",
      "Calldata verified before signing",
      "Transaction executed and confirmed",
      "hasRole() verified post-execution",
      "Requester notified of completion",
    ],
  },
  {
    id: "nav-update",
    label: "NAV Price Update",
    icon: <Activity size={15} />,
    description: "Daily oracle price update workflow",
    steps: [
      { id: "n1", title: "Strategy manager provides valuation", detail: "Strategy manager submits the daily NAV based on the underlying asset prices (T-bill prices from Bloomberg, etc.)." },
      { id: "n2", title: "Midas cross-checks valuation", detail: "Midas independently verifies the NAV calculation against market data. Flag any discrepancy >0.1% for review.", variant: "warning" },
      { id: "n3", title: "Management fee deduction", detail: "Calculate and deduct the accrued management fee for the period before setting the new NAV. Fee is expressed as a daily rate of the annual fee." },
      { id: "n4", title: "Oracle price updated on-chain", detail: "Submit the new price to the Chainlink-compatible oracle contract. The updatedAt timestamp is set to the current block time. Verify latestRoundData() reflects the new price.", variant: "success" },
      { id: "n5", title: "Verify staleness", detail: "Confirm the new updatedAt timestamp is within the last hour. Check that the AUM calculation (supply × NAV) is within expected range vs prior day.", variant: "success" },
    ],
    checklist: [
      "Valuation received from strategy manager",
      "Independent cross-check completed",
      "Management fee correctly calculated and deducted",
      "Oracle update transaction confirmed",
      "latestRoundData() returns new price",
      "AUM calculation within expected range",
      "Price update logged in ops record",
    ],
  },
  {
    id: "incident",
    label: "Incident Response",
    icon: <AlertTriangle size={15} />,
    description: "Protocol for handling anomalies and urgent situations",
    steps: [
      { id: "i1", title: "Anomaly detected", detail: "Trigger: oracle price stale (>24h), large unexpected redemption (>5% TVL), unusual mint/burn pattern, contract error, or external alert.", variant: "warning" },
      { id: "i2", title: "Initial triage (< 15 min)", detail: "Identify the scope: is it a data issue, smart contract issue, or external market event? Check Etherscan for recent transactions. Notify relevant stakeholders." },
      { id: "i3", title: "Pause instant operations if needed", detail: "If oracle is stale: pause instant subscriptions and redemptions by switching to Standard mode only. This protects investors from stale pricing.", variant: "warning" },
      { id: "i4", title: "Escalation", detail: "Page the on-call engineer and product lead. If a contract issue is suspected, contact the smart contract auditor. If market-related, loop in the strategy manager." },
      { id: "i5", title: "Remediation", detail: "Fix the root cause: update oracle, correct a misconfiguration, or coordinate with external parties. All changes require the normal approver quorum — no emergency bypasses." },
      { id: "i6", title: "Post-incident review", detail: "Document the timeline, root cause, and remediation steps. Update runbooks and monitoring alerts to prevent recurrence.", variant: "success" },
    ],
    checklist: [
      "Anomaly identified and documented",
      "Instant operations paused if oracle is stale",
      "Relevant stakeholders notified",
      "Root cause identified",
      "Remediation applied with proper approver quorum",
      "Investor communications sent if needed",
      "Post-incident review completed",
    ],
  },
];

// ─── Step component ───────────────────────────────────────────────────────────

function WorkflowStep({ step, index }: { step: WorkflowStep; index: number }) {
  const [open, setOpen] = useState(false);

  const variantStyles: Record<string, string> = {
    normal: "border-border bg-surface-2",
    warning: "border-warning/30 bg-warning/5",
    success: "border-success/30 bg-success/5",
    branch: "border-accent/30 bg-accent/5 ml-4",
  };

  const dotStyles: Record<string, string> = {
    normal: "bg-text-muted",
    warning: "bg-warning",
    success: "bg-success",
    branch: "bg-accent",
  };

  const variant = step.variant ?? "normal";

  return (
    <div className="relative flex gap-3">
      {/* Connector line */}
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-6 h-6 rounded-full border-2 border-border flex items-center justify-center text-[10px] font-bold text-text-muted bg-surface z-10`}>
          {index + 1}
        </div>
        <div className="w-px flex-1 bg-border mt-1" />
      </div>

      {/* Content */}
      <div
        className={`flex-1 mb-3 rounded-lg border p-3 cursor-pointer transition-all ${variantStyles[variant]} hover:border-opacity-80`}
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full shrink-0 ${dotStyles[variant]}`} />
            <span className="text-sm font-medium text-text-primary">{step.title}</span>
            {variant === "branch" && (
              <span className="text-[10px] font-medium text-accent border border-accent/30 rounded px-1.5 py-0.5">branch</span>
            )}
          </div>
          {open ? <ChevronUp size={13} className="text-text-muted shrink-0" /> : <ChevronDown size={13} className="text-text-muted shrink-0" />}
        </div>
        {open && (
          <p className="mt-2 text-xs text-text-secondary leading-relaxed pl-4">
            {step.detail}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Checklist component ──────────────────────────────────────────────────────

function Checklist({ items }: { items: string[] }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (i: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) { next.delete(i); } else { next.add(i); }
      return next;
    });

  const done = checked.size;
  const total = items.length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">Operational Checklist</span>
        <span className="text-xs text-text-secondary tabular-nums">
          {done}/{total} completed
        </span>
      </div>
      <div className="w-full h-1 rounded-full bg-surface-3">
        <div
          className="h-1 rounded-full bg-success transition-all duration-300"
          style={{ width: `${(done / total) * 100}%` }}
        />
      </div>
      <div className="mt-1 space-y-1.5">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className="flex items-start gap-2.5 w-full text-left group"
          >
            {checked.has(i) ? (
              <CheckSquare size={15} className="text-success shrink-0 mt-0.5" />
            ) : (
              <Square size={15} className="text-text-muted shrink-0 mt-0.5 group-hover:text-text-secondary" />
            )}
            <span className={`text-sm transition-colors ${checked.has(i) ? "text-text-muted line-through" : "text-text-secondary group-hover:text-text-primary"}`}>
              {item}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Risk flags (live oracle check) ──────────────────────────────────────────

function RiskFlags() {
  const { currentPrice, loading, data } = useNavHistory();

  const lastPoint = data[data.length - 1];
  const oracleStale = lastPoint
    ? isStale(lastPoint.timestamp / 1000, 86400)
    : false;

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="animate-pulse h-8 rounded bg-surface-3" />
        ))}
      </div>
    );
  }

  const flags = [
    {
      active: oracleStale,
      label: "Oracle stale (>24h since last update)",
      detail: "Instant subscriptions and redemptions should be paused until the oracle is refreshed.",
    },
    {
      active: !currentPrice,
      label: "Oracle price unavailable",
      detail: "Unable to read NAV price from the mTBILL oracle contract. Check RPC connectivity.",
    },
  ].filter((f) => f.active);

  if (flags.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-success">
        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
        No active risk flags detected
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {flags.map((f, i) => (
        <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-warning/5 border border-warning/20 text-xs">
          <AlertTriangle size={13} className="text-warning shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-warning">{f.label}</div>
            <div className="text-text-secondary mt-0.5">{f.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RunbookPage() {
  const [activeWorkflow, setActiveWorkflow] = useState<string>("subscription");
  const workflow = WORKFLOWS.find((w) => w.id === activeWorkflow)!;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Operational Runbook</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Interactive workflow guide for Midas onchain operations
        </p>
      </div>

      {/* Risk flags */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={14} className="text-warning" />
          <span className="text-sm font-semibold text-text-primary">Live Risk Flags</span>
          <span className="text-xs text-text-muted">— auto-detected from oracle data</span>
        </div>
        <RiskFlags />
      </div>

      {/* Workflow selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {WORKFLOWS.map((w) => (
          <button
            key={w.id}
            onClick={() => setActiveWorkflow(w.id)}
            className={`flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all ${
              activeWorkflow === w.id
                ? "bg-accent/10 border-accent/30 text-accent"
                : "bg-surface border-border text-text-secondary hover:border-text-muted hover:text-text-primary"
            }`}
          >
            <span className={activeWorkflow === w.id ? "text-accent" : "text-text-muted"}>
              {w.icon}
            </span>
            <span className="text-xs font-semibold leading-tight">{w.label}</span>
          </button>
        ))}
      </div>

      {/* Workflow content */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Steps — 3 cols */}
        <div className="xl:col-span-3 card p-5 flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              {workflow.icon}
              {workflow.label}
            </div>
            <p className="text-xs text-text-muted mt-1">{workflow.description}</p>
          </div>
          <div className="text-xs text-text-muted italic">
            Click any step to expand details
          </div>
          <div>
            {workflow.steps.map((step, i) => (
              <WorkflowStep key={step.id} step={step} index={i} />
            ))}
          </div>
        </div>

        {/* Checklist + reference — 2 cols */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          <div className="card p-5">
            <Checklist items={workflow.checklist} />
          </div>

          <div className="card p-5 flex flex-col gap-3">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-widest">
              Quick Reference
            </div>
            <div className="space-y-2 text-xs text-text-secondary">
              <div className="flex gap-2">
                <Clock size={12} className="text-text-muted shrink-0 mt-0.5" />
                <span>Standard settlement: <strong className="text-text-primary">T+2 to T+7 days</strong></span>
              </div>
              <div className="flex gap-2">
                <Zap size={12} className="text-accent shrink-0 mt-0.5" />
                <span>Instant settlement: <strong className="text-text-primary">same block</strong> (MSL pool)</span>
              </div>
              <div className="flex gap-2">
                <Shield size={12} className="text-text-muted shrink-0 mt-0.5" />
                <span>MPC workspace: <strong className="text-text-primary">2-of-N approver quorum</strong></span>
              </div>
              <div className="flex gap-2">
                <AlertTriangle size={12} className="text-warning shrink-0 mt-0.5" />
                <span>Large tx threshold: <strong className="text-text-primary">&gt;$1M requires extra review</strong></span>
              </div>
              <div className="flex gap-2">
                <Activity size={12} className="text-text-muted shrink-0 mt-0.5" />
                <span>Oracle max age: <strong className="text-text-primary">24 hours</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
