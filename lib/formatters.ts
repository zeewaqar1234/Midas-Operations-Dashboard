import { KNOWN_ADDRESSES } from "./constants";

// ─── Address Formatting ───────────────────────────────────────────────────────

/**
 * Truncates an Ethereum address to 0xABCD...1234 format.
 */
export function truncateAddress(
  address: string,
  prefixLen = 6,
  suffixLen = 4
): string {
  if (!address || address.length < prefixLen + suffixLen + 3) return address;
  return `${address.slice(0, prefixLen)}...${address.slice(-suffixLen)}`;
}

/**
 * Returns a human-readable label for an address if known, otherwise truncated.
 */
export function labelAddress(address: string): string {
  if (!address) return "";
  const norm = address.toLowerCase();
  const known = Object.entries(KNOWN_ADDRESSES).find(
    ([k]) => k.toLowerCase() === norm
  );
  return known ? known[1] : truncateAddress(address);
}

/**
 * Checks if a string looks like a valid Ethereum address.
 */
export function isAddress(value: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(value);
}

/**
 * Checks if a string looks like a valid tx hash.
 */
export function isTxHash(value: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(value);
}

// ─── Number Formatting ────────────────────────────────────────────────────────

/**
 * Converts a raw uint256 token amount (18 decimals) to a human-readable number.
 */
export function formatTokenAmount(raw: string | bigint, decimals = 18): number {
  try {
    const bn = typeof raw === "bigint" ? raw : BigInt(raw);
    const div = BigInt(10 ** decimals);
    const whole = bn / div;
    const frac = bn % div;
    return parseFloat(`${whole}.${frac.toString().padStart(decimals, "0").slice(0, 6)}`);
  } catch {
    return 0;
  }
}

/**
 * Formats a token supply or balance as a compact string (e.g. 1.23M, 456k).
 */
export function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/**
 * Formats a USD dollar value with $ prefix and appropriate decimal places.
 */
export function formatUSD(value: number): string {
  if (value >= 1_000_000_000)
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  return `$${value.toFixed(2)}`;
}

/**
 * Format a NAV price from oracle (8 or 18 decimal answer).
 */
export function formatOraclePrice(answer: bigint, decimals: number): number {
  const div = BigInt(10 ** decimals);
  const whole = answer / div;
  const frac = answer % div;
  return parseFloat(`${whole}.${frac.toString().padStart(decimals, "0").slice(0, 8)}`);
}

/**
 * Format a percentage change with sign (e.g. +1.23% or -0.45%).
 */
export function formatPctChange(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

// ─── Time Formatting ──────────────────────────────────────────────────────────

/**
 * Returns relative time string (e.g. "2h ago", "3d ago").
 */
export function timeAgo(timestamp: number | string): string {
  const ts = typeof timestamp === "string" ? parseInt(timestamp, 10) * 1000 : timestamp;
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 86400 * 7) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(ts).toLocaleDateString();
}

/**
 * Format a Unix timestamp as a readable date string.
 */
export function formatDate(timestamp: number | string): string {
  const ts = typeof timestamp === "string" ? parseInt(timestamp, 10) * 1000 : timestamp;
  return new Date(ts).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a Unix timestamp as full datetime string.
 */
export function formatDateTime(timestamp: number | string): string {
  const ts = typeof timestamp === "string" ? parseInt(timestamp, 10) * 1000 : timestamp;
  return new Date(ts).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

/**
 * Check if a timestamp is stale (older than maxAgeSeconds).
 */
export function isStale(timestamp: number | string, maxAgeSeconds = 86400): boolean {
  const ts = typeof timestamp === "string" ? parseInt(timestamp, 10) : timestamp;
  return Date.now() / 1000 - ts > maxAgeSeconds;
}

// ─── Gas Formatting ───────────────────────────────────────────────────────────

export function formatGas(gasUsed: string | number): string {
  const n = typeof gasUsed === "string" ? parseInt(gasUsed, 10) : gasUsed;
  return n.toLocaleString();
}

// ─── Block number formatting ───────────────────────────────────────────────────

export function formatBlock(blockNumber: string | number): string {
  const n = typeof blockNumber === "string" ? parseInt(blockNumber, 10) : blockNumber;
  return n.toLocaleString();
}
