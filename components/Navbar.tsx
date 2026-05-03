"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Activity,
  TrendingUp,
  ShieldCheck,
  PieChart,
  BookOpen,
} from "lucide-react";

const NAV_ITEMS = [
  {
    href: "/operations",
    label: "Operations",
    icon: Activity,
    description: "Morning ops dashboard — health, NAV, recent activity",
  },
  {
    href: "/capital-flows",
    label: "Capital Flows",
    icon: TrendingUp,
    description: "Subscription & redemption management",
  },
  {
    href: "/access-control",
    label: "Access Control",
    icon: ShieldCheck,
    description: "MPC workspace & role management",
  },
  {
    href: "/distribution",
    label: "Protocol Distribution",
    icon: PieChart,
    description: "Where mTokens are deployed across protocols",
  },
  {
    href: "/runbook",
    label: "Runbook",
    icon: BookOpen,
    description: "Operational procedures & compliance",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="
        fixed top-0 left-0 z-50 h-screen w-[220px]
        flex flex-col
        bg-white border-r border-border
        shadow-[1px_0_0_0_#E5E5E7]
      "
    >
      {/* ── Logo ───────────────────────────────────────────── */}
      <Link
        href="/operations"
        className="flex items-center gap-2.5 px-5 py-5 border-b border-border shrink-0 group"
      >
        <Image
          src="/midas-logo.png"
          alt="Midas"
          width={100}
          height={28}
          className="object-contain h-7 w-auto"
          priority
        />
      </Link>

      {/* ── Navigation ─────────────────────────────────────── */}
      <nav className="flex flex-col gap-0.5 px-3 py-4 flex-1 overflow-y-auto">
        <p className="px-2 mb-2 text-[10px] font-semibold text-text-muted uppercase tracking-widest">
          Dashboard
        </p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`
                flex items-center gap-2.5 px-3 py-2 rounded-[8px]
                text-sm font-medium transition-all duration-150
                ${
                  active
                    ? "bg-accent/10 text-accent font-semibold"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
                }
              `}
            >
              <Icon
                size={15}
                className={`shrink-0 ${active ? "text-accent" : "text-text-muted"}`}
              />
              <span className="truncate">{label}</span>
              {active && (
                <span className="ml-auto w-1 h-4 rounded-full bg-accent shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ─────────────────────────────────────────── */}
      <div className="px-5 py-4 border-t border-border shrink-0">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shrink-0" />
          <span className="font-mono text-[11px]">Ethereum Mainnet</span>
        </div>
      </div>
    </aside>
  );
}
