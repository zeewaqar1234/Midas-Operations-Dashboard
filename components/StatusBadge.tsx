import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

type BadgeVariant =
  | "success"
  | "danger"
  | "warning"
  | "accent"
  | "muted"
  | "mint"
  | "burn";

interface StatusBadgeProps {
  variant: BadgeVariant;
  label: string;
  icon?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  success: "bg-success/10 text-success border-success/20",
  danger: "bg-danger/10 text-danger border-danger/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  accent: "bg-accent/10 text-accent border-accent/20",
  muted: "bg-surface-2 text-text-muted border-border",
  mint: "bg-mint/10 text-mint border-mint/20",
  burn: "bg-burn/10 text-burn border-burn/20",
};

function VariantIcon({ variant }: { variant: BadgeVariant }) {
  switch (variant) {
    case "success":
      return <CheckCircle2 size={10} />;
    case "danger":
    case "burn":
      return <XCircle size={10} />;
    case "warning":
      return <AlertTriangle size={10} />;
    case "accent":
    case "muted":
      return <Clock size={10} />;
    case "mint":
      return <TrendingUp size={10} />;
    default:
      return <Minus size={10} />;
  }
}

export default function StatusBadge({
  variant,
  label,
  icon = true,
  size = "md",
  className = "",
}: StatusBadgeProps) {
  const sizeClass = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium border ${sizeClass} ${VARIANT_STYLES[variant]} ${className}`}
    >
      {icon && <VariantIcon variant={variant} />}
      {label}
    </span>
  );
}

// ─── Specialised convenience exports ─────────────────────────────────────────

export function MintBadge({ size }: { size?: "sm" | "md" }) {
  return <StatusBadge variant="mint" label="MINT" icon size={size} />;
}

export function BurnBadge({ size }: { size?: "sm" | "md" }) {
  return <StatusBadge variant="burn" label="BURN" icon size={size} />;
}

export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
      LIVE
    </span>
  );
}

export function StaleBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-warning">
      <AlertTriangle size={11} />
      STALE
    </span>
  );
}

export function TxStatusBadge({ isError }: { isError: string | boolean }) {
  const failed = isError === "1" || isError === true;
  return failed ? (
    <StatusBadge variant="danger" label="Failed" />
  ) : (
    <StatusBadge variant="success" label="Success" />
  );
}

export function PctChangeBadge({ value }: { value: number }) {
  if (value > 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-success">
        <TrendingUp size={11} />+{value.toFixed(2)}%
      </span>
    );
  if (value < 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-danger">
        <TrendingDown size={11} />
        {value.toFixed(2)}%
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-text-muted">
      <Minus size={11} />
      0.00%
    </span>
  );
}
