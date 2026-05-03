"use client";

import Link from "next/link";
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
    shortLabel: "Ops",
    icon: Activity,
    description: "Morning ops dashboard — health, NAV, recent activity",
  },
  {
    href: "/capital-flows",
    label: "Capital Flows",
    shortLabel: "Flows",
    icon: TrendingUp,
    description: "Subscription & redemption management",
  },
  {
    href: "/access-control",
    label: "Access Control",
    shortLabel: "Access",
    icon: ShieldCheck,
    description: "MPC workspace & role management",
  },
  {
    href: "/distribution",
    label: "Protocol Distribution",
    shortLabel: "Distrib.",
    icon: PieChart,
    description: "Where mTokens are deployed across protocols",
  },
  {
    href: "/runbook",
    label: "Runbook",
    shortLabel: "Runbook",
    icon: BookOpen,
    description: "Operational procedures & compliance",
  },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-md">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-4">

          {/* Logo */}
          <Link
            href="/operations"
            className="flex items-center gap-2.5 shrink-0 group"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-accent/10 border border-accent/20 group-hover:bg-accent/15 transition-colors">
              {/* Simple M mark */}
              <span className="text-accent text-xs font-bold tracking-tighter">M</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-sm font-semibold text-text-primary tracking-tight">
                Midas
              </span>
              <span className="ml-1.5 text-sm font-normal text-text-muted">
                Operations
              </span>
            </div>
          </Link>

          {/* Nav tabs */}
          <nav className="flex items-center gap-0.5">
            {NAV_ITEMS.map(({ href, label, shortLabel, icon: Icon }) => {
              const active =
                pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  title={label}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-sm font-medium transition-all duration-150
                    ${
                      active
                        ? "bg-accent/10 text-accent"
                        : "text-text-muted hover:text-text-primary hover:bg-surface-2"
                    }
                  `}
                >
                  <Icon size={14} className="shrink-0" />
                  <span className="hidden lg:block">{label}</span>
                  <span className="hidden md:block lg:hidden">{shortLabel}</span>
                </Link>
              );
            })}
          </nav>

          {/* Connection indicator */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-surface-2 border border-border/60 text-xs text-text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="font-mono text-[11px]">Mainnet</span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
