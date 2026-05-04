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
  Rocket,
  FileText,
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
  shortLabel: string;
  icon: React.ReactNode;
  description: string;
  steps: WorkflowStep[];
  checklist: string[];
}

// ─── Workflow definitions ─────────────────────────────────────────────────────

const WORKFLOWS: Workflow[] = [
  {
    id: "subscription",
    label: "Subscription",
    shortLabel: "Subscribe",
    icon: <TrendingUp size={15} />,
    description: "Investor subscribes to receive mTokens in exchange for USDC",
    steps: [
      {
        id: "s1", title: "Investor submits subscription request",
        detail: "Investor sends a signed subscription request specifying amount, token type (mTBILL/mBASIS), and their whitelisted wallet address.",
      },
      {
        id: "s2", title: "KYC / Eligibility check",
        detail: "Verify investor wallet is whitelisted on the mToken contract. Confirm KYC documentation is current and investor is an eligible counterparty (non-US, non-UK, non-sanctioned).",
        variant: "warning",
      },
      {
        id: "s3", title: "USDC received at deposit address",
        detail: "Investor transfers USDC to the Midas deposit contract. Confirm on Etherscan. Verify amount matches subscription request.",
      },
      {
        id: "s4a", title: "Instant mode: check MSL pool capacity",
        detail: "If investor requests instant settlement, verify the MSL (Market-Stable Liquidity) pool holds sufficient USDC. Pool capacity is ~10% of TVL. If insufficient, fall back to Standard mode.",
        variant: "branch",
      },
      {
        id: "s4b", title: "Instant mode: mint at oracle NAV",
        detail: "mTokens are minted at the current oracle NAV price. Confirm oracle is fresh (<24h). Tokens are sent to the investor's wallet in the same transaction.",
        variant: "success",
      },
      {
        id: "s5a", title: "Standard mode: queue for next NAV window",
        detail: "Subscription is queued. Ops processes within T+2 to T+7 business days. Strategy manager deploys the USDC capital into underlying assets (T-bills for mTBILL, basis positions for mBASIS).",
        variant: "branch",
      },
      {
        id: "s5b", title: "Standard mode: mint to investor",
        detail: "Once capital is deployed, ops mints via the MPC workspace. Requires approver quorum (strategy manager + Midas co-signer). Tokens sent to investor's whitelisted wallet.",
        variant: "success",
      },
      {
        id: "s6", title: "Confirmation & record-keeping",
        detail: "Send investor confirmation with transaction hash and minted amount. Update internal tracking. Log in ops ledger.",
      },
    ],
    checklist: [
      "Verify investor wallet is whitelisted on-chain",
      "Confirm USDC received at correct contract address",
      "Verify NAV oracle is current (< 24h since last update)",
      "Check MSL pool capacity if instant mode requested",
      "Confirm mint transaction success on Etherscan",
      "Verify mTokens arrived in investor wallet",
      "Update internal tracking & send confirmation",
    ],
  },
  {
    id: "redemption",
    label: "Redemption",
    shortLabel: "Redeem",
    icon: <RefreshCw size={15} />,
    description: "Investor redeems mTokens in exchange for USDC",
    steps: [
      {
        id: "r1", title: "Investor submits redemption request",
        detail: "Investor submits a signed redemption request specifying amount of mTokens to burn and the destination USDC address.",
      },
      {
        id: "r2", title: "Eligibility & balance check",
        detail: "Confirm investor holds sufficient mTokens. Verify destination wallet is whitelisted. Check that redemption amount does not exceed daily limits.",
        variant: "warning",
      },
      {
        id: "r3a", title: "Instant mode: verify MSL pool",
        detail: "Check the MSL liquidity pool balance. Instant redemption requires the pool to hold enough USDC. For large amounts (>$1M) this may not be available.",
        variant: "branch",
      },
      {
        id: "r3b", title: "Instant mode: burn at oracle NAV",
        detail: "mTokens are burned and USDC released from the MSL pool at the current oracle NAV price. Investor receives USDC in the same block.",
        variant: "success",
      },
      {
        id: "r4a", title: "Standard mode: T+2 to T+7 settlement",
        detail: "Ops queues the redemption. Strategy manager liquidates underlying assets over T+2 to T+7 business days. For mTBILL this means selling T-bills on the secondary market.",
        variant: "branch",
      },
      {
        id: "r4b", title: "Standard mode: burn & release USDC",
        detail: "Once USDC is available, ops executes the burn via MPC workspace (requires approver quorum). USDC transferred to investor's whitelisted wallet.",
        variant: "success",
      },
    ],
    checklist: [
      "Confirm investor mToken balance is sufficient",
      "Check MSL pool capacity if instant mode requested",
      "Verify oracle NAV is current",
      "Flag redemptions >$1M for extra review",
      "Confirm burn transaction success on Etherscan",
      "Verify USDC transferred to correct wallet",
      "Update investor records",
    ],
  },
  {
    id: "whitelist-update",
    label: "Whitelist Update",
    shortLabel: "Whitelist",
    icon: <Shield size={15} />,
    description: "Add or remove a wallet from mToken access control",
    steps: [
      { id: "w1", title: "Request received from strategy manager", detail: "Strategy manager submits a formal request to add/remove a specific wallet address, specifying the product and reason." },
      { id: "w2", title: "KYC / compliance review", detail: "Midas compliance reviews the address. For additions: verify KYC, investor eligibility, and jurisdiction. For removals: confirm no pending transactions.", variant: "warning" },
      { id: "w3", title: "Internal approver quorum", detail: "The whitelist change must be approved by the required internal quorum (2-of-N approvers). This is enforced by the MPC workspace policy." },
      { id: "w4", title: "Prepare on-chain transaction", detail: "Prepare the role grant or revoke call. Verify the calldata matches the intended action. Double-check the contract address and role." },
      { id: "w5", title: "Execute via MPC workspace", detail: "Submit the transaction through the MPC workspace. Collect required co-signatures. Broadcast to the network.", variant: "warning" },
      { id: "w6", title: "Verify on-chain", detail: "Confirm the RoleGranted or RoleRevoked event was emitted. Call hasRole() to verify the new state. Check Etherscan for transaction success.", variant: "success" },
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
    label: "NAV Update",
    shortLabel: "NAV",
    icon: <Activity size={15} />,
    description: "Daily oracle price update workflow",
    steps: [
      { id: "n1", title: "Strategy manager provides valuation", detail: "Strategy manager submits the daily NAV based on underlying asset prices (T-bill prices from Bloomberg, etc.)." },
      { id: "n2", title: "Midas cross-checks valuation", detail: "Midas independently verifies the NAV calculation against market data. Flag any discrepancy >0.1% for review.", variant: "warning" },
      { id: "n3", title: "Management fee deduction", detail: "Calculate and deduct the accrued management fee for the period before setting the new NAV. Fee is expressed as a daily rate of the annual fee." },
      { id: "n4", title: "Oracle price updated on-chain", detail: "Submit the new price to the oracle contract. The updatedAt timestamp is set to the current block time. Verify latestRoundData() reflects the new price.", variant: "success" },
      { id: "n5", title: "Confirm and log", detail: "Confirm the new timestamp is within the last hour. Check that AUM (supply × NAV) is within expected range vs prior day. Log the update.", variant: "success" },
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
    id: "product-launch",
    label: "Product Launch",
    shortLabel: "Launch",
    icon: <Rocket size={15} />,
    description: "End-to-end checklist for onboarding a new strategy manager and launching a new mToken",
    steps: [
      { id: "pl1", title: "Legal & Compliance", detail: "Strategy Management Agreement executed. Investment mandate and risk parameters documented. Prospectus notification filed with FMA (Liechtenstein). KYC and eligibility criteria defined. Non-US/non-UK investor restriction confirmed. MiCA reporting obligations mapped.", variant: "warning" },
      { id: "pl2", title: "MPC Workspace Setup", detail: "Create MPC workspace (e.g. Fordefi) for the new product. Distribute key shares to strategy manager. Configure approval policy: strategy manager can propose but Midas retains co-signer requirement. Set transaction size limits." },
      { id: "pl3", title: "Smart Contract Deployment", detail: "Deploy mToken contract. Assign admin role to Midas multisig. Assign minter and burner roles to ops wallet. Deploy oracle contract, set initial NAV price, verify it returns correct values on-chain." },
      { id: "pl4", title: "DeFi Integration", detail: "Seed the instant redemption liquidity pool (MSL sleeve) with initial USDC. Target ~10% of TVL for instant capacity. Configure any DeFi protocol integrations if applicable.", },
      { id: "pl5", title: "End-to-End Testing", detail: "Execute a small test subscription: USDC in → whitelist check → mint at NAV → tokens received. Execute a small test redemption: burn request → USDC returned. Confirm both on Etherscan.", variant: "warning" },
      { id: "pl6", title: "Go-Live", detail: "Configure monitoring alerts (oracle staleness, large transactions). Prepare investor communications. Open subscriptions to eligible investors. Monitor first live transactions closely.", variant: "success" },
    ],
    checklist: [],
  },
  {
    id: "incident",
    label: "Incident",
    shortLabel: "Incident",
    icon: <AlertTriangle size={15} />,
    description: "Protocol for handling anomalies and urgent situations",
    steps: [
      { id: "i1", title: "Anomaly detected", detail: "Trigger: oracle price stale (>24h), large unexpected redemption (>5% TVL), unusual mint/burn pattern, contract error, or external alert.", variant: "warning" },
      { id: "i2", title: "Initial triage (< 15 min)", detail: "Identify scope: data issue, smart contract issue, or market event? Check Etherscan for recent transactions. Notify relevant stakeholders." },
      { id: "i3", title: "Pause instant operations if needed", detail: "If oracle is stale: pause instant subscriptions and redemptions. This protects investors from stale pricing. Standard mode remains available.", variant: "warning" },
      { id: "i4", title: "Escalation", detail: "Page the on-call engineer and product lead. If a contract issue: contact the smart contract auditor. If market-related: loop in the strategy manager." },
      { id: "i5", title: "Remediation", detail: "Fix the root cause: refresh oracle, correct a misconfiguration, or coordinate with external parties. All changes require the normal approver quorum — no emergency bypasses." },
      { id: "i6", title: "Post-incident review", detail: "Document the timeline, root cause, and remediation. Update runbooks and monitoring alerts to prevent recurrence.", variant: "success" },
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
    normal:  "border-border   bg-white",
    warning: "border-warning/40 bg-warning/5",
    success: "border-success/40 bg-success/5",
    branch:  "border-accent/40  bg-accent/5  ml-6",
  };

  const dotColors: Record<string, string> = {
    normal:  "bg-text-muted",
    warning: "bg-warning",
    success: "bg-success",
    branch:  "bg-accent",
  };

  const variant = step.variant ?? "normal";

  return (
    <div className="relative flex gap-3">
      {/* Step number + connector line */}
      <div className="flex flex-col items-center shrink-0">
        <div className="w-6 h-6 rounded-full border-2 border-border bg-white flex items-center justify-center text-[10px] font-bold text-text-muted z-10 shadow-sm">
          {index + 1}
        </div>
        <div className="w-px flex-1 bg-border/60 mt-1" />
      </div>

      {/* Content card */}
      <div
        className={`flex-1 mb-2.5 rounded-[8px] border px-3 py-2.5 cursor-pointer transition-all shadow-sm ${variantStyles[variant]} hover:shadow-md`}
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />
            <span className="text-sm font-medium text-text-primary">{step.title}</span>
            {variant === "branch" && (
              <span className="text-[10px] font-medium text-accent border border-accent/30 bg-accent/5 rounded px-1.5 py-0.5 shrink-0">
                branch
              </span>
            )}
          </div>
          {open
            ? <ChevronUp size={13} className="text-text-muted shrink-0" />
            : <ChevronDown size={13} className="text-text-muted shrink-0" />}
        </div>
        {open && (
          <p className="mt-2 text-xs text-text-secondary leading-relaxed pl-3.5 border-l-2 border-border ml-0.5">
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
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  const done = checked.size;
  const total = items.length;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">
          Ops Checklist
        </span>
        <span className="text-xs text-text-secondary tabular-nums">{done}/{total}</span>
      </div>
      <div className="w-full h-1 rounded-full bg-surface-3">
        <div className="h-1 rounded-full bg-success transition-all duration-300" style={{ width: `${(done / total) * 100}%` }} />
      </div>
      <div className="space-y-1">
        {items.map((item, i) => (
          <button key={i} onClick={() => toggle(i)} className="flex items-start gap-2.5 w-full text-left group py-0.5">
            {checked.has(i)
              ? <CheckSquare size={14} className="text-success shrink-0 mt-0.5" />
              : <Square size={14} className="text-text-muted shrink-0 mt-0.5 group-hover:text-text-secondary" />}
            <span className={`text-xs leading-snug transition-colors ${checked.has(i) ? "text-text-muted line-through" : "text-text-secondary group-hover:text-text-primary"}`}>
              {item}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Product Launch Checklist — sectioned ────────────────────────────────────

const LAUNCH_SECTIONS = [
  {
    title: "Legal & Compliance",
    items: [
      "Strategy Management Agreement executed",
      "Investment universe and risk parameters documented",
      "Prospectus notification filed with FMA (Liechtenstein)",
      "KYC/eligibility criteria defined for target investors",
      "Non-US/non-UK investor restriction confirmed",
      "MiCA reporting obligations mapped",
    ],
  },
  {
    title: "Technical Setup",
    items: [
      "MPC workspace created and key shares distributed",
      "Approval policy configured (2-of-N quorum)",
      "Whitelisted destination addresses set",
      "Transaction size limits configured",
    ],
  },
  {
    title: "On-Chain Deployment",
    items: [
      "mToken contract deployed and roles verified",
      "Oracle deployed with initial NAV price set",
      "Contract verified on Etherscan",
    ],
  },
  {
    title: "Integration & Testing",
    items: [
      "Instant redemption liquidity pool seeded (MSL)",
      "Test subscription processed end-to-end",
      "Test redemption processed end-to-end",
      "Monitoring alerts configured (oracle, large tx)",
    ],
  },
  {
    title: "Go-Live",
    items: [
      "Investor communications prepared",
      "Product page live on midas.app",
      "First transactions monitored closely",
    ],
  },
];

function ProductLaunchChecklist() {
  const allItems = LAUNCH_SECTIONS.flatMap((s) => s.items);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const globalIndex = (si: number, ii: number) => {
    let offset = 0;
    for (let i = 0; i < si; i++) offset += LAUNCH_SECTIONS[i].items.length;
    return offset + ii;
  };
  const toggle = (idx: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  const done = checked.size;
  const total = allItems.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">Launch Checklist</span>
        <span className="text-xs text-text-secondary tabular-nums">{done}/{total}</span>
      </div>
      <div className="w-full h-1 rounded-full bg-surface-3">
        <div className="h-1 rounded-full bg-success transition-all duration-300" style={{ width: `${(done / total) * 100}%` }} />
      </div>
      {LAUNCH_SECTIONS.map((section, si) => (
        <div key={section.title} className="flex flex-col gap-1">
          <div className="text-[10px] font-semibold text-accent uppercase tracking-widest mt-1">{section.title}</div>
          {section.items.map((item, ii) => {
            const idx = globalIndex(si, ii);
            return (
              <button key={idx} onClick={() => toggle(idx)} className="flex items-start gap-2 text-left group py-0.5">
                {checked.has(idx)
                  ? <CheckSquare size={13} className="text-success shrink-0 mt-0.5" />
                  : <Square size={13} className="text-text-muted shrink-0 mt-0.5 group-hover:text-text-secondary" />}
                <span className={`text-xs leading-snug transition-colors ${checked.has(idx) ? "text-text-muted line-through" : "text-text-secondary group-hover:text-text-primary"}`}>
                  {item}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Risk flags (live oracle check) ──────────────────────────────────────────

function RiskFlags() {
  const { currentPrice, loading, data } = useNavHistory();
  const lastPoint = data[data.length - 1];
  const oracleStale = lastPoint ? isStale(lastPoint.timestamp / 1000, 86400) : false;

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="animate-pulse h-8 rounded-[8px] bg-surface-3" />
        ))}
      </div>
    );
  }

  const flags = [
    { active: oracleStale, label: "Oracle stale (>24h)", detail: "Pause instant subscriptions and redemptions until the oracle is refreshed." },
    { active: !currentPrice, label: "Oracle price unavailable", detail: "Unable to read NAV from the mTBILL oracle. Check RPC connectivity." },
  ].filter((f) => f.active);

  if (flags.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-success">
        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
        All systems operational — no active risk flags
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {flags.map((f, i) => (
        <div key={i} className="flex items-start gap-2.5 p-3 rounded-[8px] bg-warning/5 border border-warning/30 text-xs">
          <AlertTriangle size={13} className="text-warning shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-warning">{f.label}</div>
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
  const isLaunch = workflow.id === "product-launch";

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Operational Runbook</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Interactive workflow guide for Midas onchain operations
        </p>
      </div>

      {/* Risk flags — only shows when there is an actual flag */}
      <div className="card px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={13} className="text-warning" />
          <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">Live Risk Flags</span>
          <span className="text-xs text-text-muted">— auto-detected from oracle data</span>
        </div>
        <RiskFlags />
      </div>

      {/* Workflow selector — 6 clean pills */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {WORKFLOWS.map((w) => {
          const active = activeWorkflow === w.id;
          return (
            <button
              key={w.id}
              onClick={() => setActiveWorkflow(w.id)}
              className={`flex flex-col items-start gap-1.5 px-3 py-3 rounded-[10px] border text-left transition-all ${
                active
                  ? "bg-accent/10 border-accent/30"
                  : "bg-white border-border hover:border-accent/20 hover:bg-surface"
              }`}
            >
              <span className={active ? "text-accent" : "text-text-muted"}>
                {w.icon}
              </span>
              <span className={`text-xs font-semibold leading-tight ${active ? "text-accent" : "text-text-secondary"}`}>
                {w.shortLabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Workflow content */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

        {/* Steps — 3 cols */}
        <div className="xl:col-span-3 card p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
            <div>
              <div className="flex items-center gap-2 font-semibold text-text-primary">
                <span className="text-text-muted">{workflow.icon}</span>
                {workflow.label}
              </div>
              <p className="text-xs text-text-muted mt-1 leading-snug">{workflow.description}</p>
            </div>
            <span className="text-[10px] text-text-muted italic shrink-0 mt-1">
              Click to expand
            </span>
          </div>
          <div>
            {workflow.steps.map((step, i) => (
              <WorkflowStep key={step.id} step={step} index={i} />
            ))}
          </div>
        </div>

        {/* Sidebar — 2 cols */}
        <div className="xl:col-span-2 flex flex-col gap-4">

          {/* Checklist */}
          <div className="card p-5">
            {isLaunch
              ? <ProductLaunchChecklist />
              : <Checklist items={workflow.checklist} />}
          </div>

          {/* Quick Reference */}
          <div className="card p-5 flex flex-col gap-3">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-widest">Quick Reference</div>
            <div className="space-y-2 text-xs text-text-secondary">
              {[
                { icon: <Clock size={11} />, text: <>Standard settlement: <strong className="text-text-primary">T+2 to T+7 days</strong></> },
                { icon: <Zap size={11} className="text-accent" />, text: <>Instant settlement: <strong className="text-text-primary">same block</strong> (MSL pool)</> },
                { icon: <Shield size={11} />, text: <>MPC approval: <strong className="text-text-primary">2-of-N quorum required</strong></> },
                { icon: <AlertTriangle size={11} className="text-warning" />, text: <>Large tx threshold: <strong className="text-text-primary">&gt;$1M requires review</strong></> },
                { icon: <Activity size={11} />, text: <>Oracle max age: <strong className="text-text-primary">24 hours</strong></> },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-text-muted mt-0.5 shrink-0">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Regulatory Framework — compact table */}
          <div className="card p-5 flex flex-col gap-3">
            <div className="flex items-center gap-1.5">
              <FileText size={12} className="text-text-muted" />
              <div className="text-xs font-semibold text-text-muted uppercase tracking-widest">Regulatory</div>
            </div>
            <div className="space-y-0 text-xs divide-y divide-border">
              {[
                { label: "Issuer", value: "Midas Software GmbH / Luxembourg SPV" },
                { label: "Prospectus", value: "FMA-approved (Liechtenstein)" },
                { label: "Eligible", value: "Non-US, non-UK, non-sanctioned" },
                { label: "Framework", value: "EU Prospectus Regulation, MiCA" },
                { label: "Verification", value: "Ankura Trust (independent)" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-2 py-1.5">
                  <span className="text-text-muted shrink-0 w-20">{label}</span>
                  <span className="text-text-secondary text-right leading-snug">{value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
