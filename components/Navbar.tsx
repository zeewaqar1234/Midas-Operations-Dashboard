"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  ShieldCheck,
  Search,
  BookOpen,
  Zap,
} from "lucide-react";

const NAV_ITEMS = [
  {
    href: "/overview",
    label: "Overview",
    shortLabel: "Overview",
    icon: LayoutDashboard,
    description: "Token Overview & NAV Monitor",
  },
  {
    href: "/transactions",
    label: "Transactions",
    shortLabel: "Txns",
    icon: ArrowLeftRight,
    description: "Transaction Monitor & Decoder",
  },
  {
    href: "/whitelist",
    label: "Whitelist",
    shortLabel: "Whitelist",
    icon: ShieldCheck,
    description: "Access Control Manager",
  },
  {
    href: "/explorer",
    label: "Explorer",
    shortLabel: "Explorer",
    icon: Search,
    description: "Block Explorer & Wallet Analyzer",
  },
  {
    href: "/runbook",
    label: "Runbook",
    shortLabel: "Runbook",
    icon: BookOpen,
    description: "Operational Runbook",
  },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-4">

          {/* Logo */}
          <Link
            href="/overview"
            className="flex items-center gap-2.5 shrink-0 group"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 border border-accent/20 group-hover:bg-accent/20 transition-colors">
              <Zap size={14} className="text-accent" />
            </div>
            <div className="hidden sm:block">
              <span className="text-sm font-semibold text-text-primary tracking-tight">
                Midas
              </span>
              <span className="ml-1.5 text-sm font-medium text-text-muted">
                Ops Dashboard
              </span>
            </div>
          </Link>

          {/* Nav tabs */}
          <nav className="flex items-center gap-0.5">
            {NAV_ITEMS.map(({ href, label, shortLabel, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  title={label}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150
                    ${
                      active
                        ? "bg-accent/10 text-accent border border-accent/20"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-2 border border-transparent"
                    }
                  `}
                >
                  <Icon size={15} className="shrink-0" />
                  <span className="hidden md:block">{label}</span>
                  <span className="block md:hidden">{shortLabel}</span>
                </Link>
              );
            })}
          </nav>

          {/* Connection indicator */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-2 border border-border text-xs text-text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="font-mono">Ethereum Mainnet</span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
