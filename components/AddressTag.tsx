"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { truncateAddress, labelAddress } from "@/lib/formatters";
import { ETHERSCAN_URL } from "@/lib/constants";

interface AddressTagProps {
  address: string;
  /** Show a human-readable label when known, otherwise truncated */
  showLabel?: boolean;
  /** Link to Etherscan address page */
  etherscanLink?: boolean;
  /** Show copy-to-clipboard button */
  copyable?: boolean;
  /** Prefix/suffix chars for truncation (default 6/4) */
  prefixLen?: number;
  suffixLen?: number;
  className?: string;
}

export default function AddressTag({
  address,
  showLabel = false,
  etherscanLink = false,
  copyable = true,
  prefixLen = 6,
  suffixLen = 4,
  className = "",
}: AddressTagProps) {
  const [copied, setCopied] = useState(false);

  if (!address) return null;

  const display = showLabel
    ? labelAddress(address)
    : truncateAddress(address, prefixLen, suffixLen);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-sm text-text-secondary group ${className}`}
    >
      <span className="text-text-primary">{display}</span>

      {copyable && (
        <button
          onClick={handleCopy}
          title="Copy address"
          className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-accent"
        >
          {copied ? (
            <Check size={12} className="text-success" />
          ) : (
            <Copy size={12} />
          )}
        </button>
      )}

      {etherscanLink && (
        <a
          href={`${ETHERSCAN_URL}/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          title="View on Etherscan"
          onClick={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-accent"
        >
          <ExternalLink size={12} />
        </a>
      )}
    </span>
  );
}
