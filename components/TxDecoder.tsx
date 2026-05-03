"use client";

import { useState } from "react";
import { Search, ExternalLink, AlertCircle, Copy, Check } from "lucide-react";
import { decodeCalldata } from "@/lib/decoder";
import { getTxInputData } from "@/lib/etherscan";
import { isTxHash } from "@/lib/formatters";
import { ETHERSCAN_URL } from "@/lib/constants";
import AddressTag from "@/components/AddressTag";
import { TxStatusBadge } from "@/components/StatusBadge";

interface DecodedResult {
  hash: string;
  from: string;
  to: string;
  gasUsed: string;
  blockNumber: string;
  isError: string;
  functionName: string | null;
  selector: string | null;
  args: Array<{ name: string; type: string; value: string; label?: string }>;
  rawInput: string;
}

export default function TxDecoder() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DecodedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleDecode = async () => {
    const val = input.trim();
    if (!val) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let rawInput = val;
      let from = "";
      let to = "";
      let gasUsed = "";
      let blockNumber = "";
      let isError = "0";

      if (isTxHash(val)) {
        // Fetch from Etherscan
        const detail = await getTxInputData(val);
        rawInput = detail.input;
        from = detail.from;
        to = detail.to;
        gasUsed = detail.gasUsed;
        blockNumber = detail.blockNumber;
        isError = detail.isError;
      }

      const decoded = decodeCalldata(rawInput);

      setResult({
        hash: isTxHash(val) ? val : "",
        from,
        to,
        gasUsed,
        blockNumber,
        isError,
        functionName: decoded?.functionName ?? null,
        selector: decoded?.selector ?? null,
        args: decoded?.args ?? [],
        rawInput,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to decode transaction"
      );
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="card p-5 flex flex-col gap-4">
      {/* Header */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary">
          Smart Contract Function Decoder
        </h2>
        <p className="text-xs text-text-muted mt-0.5">
          Paste a transaction hash or raw calldata to decode the function call
        </p>
      </div>

      {/* Input row */}
      <div className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="0x transaction hash or 0x calldata…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleDecode()}
        />
        <button
          onClick={handleDecode}
          disabled={loading || !input.trim()}
          className="btn-primary shrink-0"
        >
          <Search size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "Decoding…" : "Decode"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 text-xs text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">
          <AlertCircle size={13} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="flex flex-col gap-3 animate-fade-in">
          {/* TX meta (only when hash was provided) */}
          {result.hash && (
            <div className="bg-surface-2 rounded-lg p-3 space-y-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-text-muted w-20">Tx Hash</span>
                <span className="font-mono text-text-secondary">
                  {result.hash.slice(0, 14)}…{result.hash.slice(-8)}
                </span>
                <button onClick={() => copy(result.hash)} className="text-text-muted hover:text-accent">
                  {copied ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                </button>
                <a
                  href={`${ETHERSCAN_URL}/tx/${result.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-accent hover:underline"
                >
                  Etherscan <ExternalLink size={11} />
                </a>
              </div>
              {result.from && (
                <div className="flex items-center gap-2">
                  <span className="text-text-muted w-20">From</span>
                  <AddressTag address={result.from} showLabel etherscanLink copyable />
                </div>
              )}
              {result.to && (
                <div className="flex items-center gap-2">
                  <span className="text-text-muted w-20">To</span>
                  <AddressTag address={result.to} showLabel etherscanLink copyable />
                </div>
              )}
              {result.blockNumber !== "0" && (
                <div className="flex items-center gap-2">
                  <span className="text-text-muted w-20">Block</span>
                  <a
                    href={`${ETHERSCAN_URL}/block/${result.blockNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-accent hover:underline"
                  >
                    {parseInt(result.blockNumber).toLocaleString()}
                  </a>
                </div>
              )}
              {result.gasUsed !== "0" && (
                <div className="flex items-center gap-2">
                  <span className="text-text-muted w-20">Gas Used</span>
                  <span className="font-mono text-text-primary">
                    {parseInt(result.gasUsed).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-text-muted w-20">Status</span>
                <TxStatusBadge isError={result.isError} />
              </div>
            </div>
          )}

          {/* Decoded function */}
          <div className="bg-surface rounded-lg border border-border p-4 font-mono text-xs">
            {result.functionName ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-text-muted">Function</span>
                  <span className="text-accent font-semibold text-sm">
                    {result.functionName}
                  </span>
                  {result.selector && (
                    <span className="text-text-muted text-[10px] border border-border px-1.5 py-0.5 rounded">
                      {result.selector}
                    </span>
                  )}
                </div>

                {result.args.length > 0 && (
                  <div className="border-t border-border pt-3 space-y-2.5">
                    <div className="text-[10px] text-text-muted uppercase tracking-widest">
                      Parameters
                    </div>
                    {result.args.map((arg, i) => (
                      <div
                        key={i}
                        className="flex flex-col gap-0.5 pl-3 border-l-2 border-border"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-warning">{arg.name}</span>
                          <span className="text-text-muted text-[10px]">
                            ({arg.type})
                          </span>
                          {arg.label && (
                            <span className="text-success text-[10px]">
                              → {arg.label}
                            </span>
                          )}
                        </div>
                        <div className="text-text-primary break-all text-[11px]">
                          {arg.value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-warning">Unknown function</div>
                {result.rawInput && result.rawInput !== "0x" && (
                  <>
                    <div className="text-[10px] text-text-muted uppercase tracking-widest">
                      Raw Calldata
                    </div>
                    <div className="text-text-muted break-all text-[10px] leading-5">
                      {result.rawInput}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick reference */}
      {!result && !error && (
        <div className="text-xs text-text-muted border-t border-border pt-3">
          <div className="mb-1.5 font-medium text-text-secondary">Known Midas functions:</div>
          <div className="grid grid-cols-2 gap-1 font-mono">
            {[
              "mint(address, uint256)",
              "burn(uint256)",
              "grantRole(bytes32, address)",
              "depositInstant(...)",
              "redeemInstant(...)",
              "revokeRole(bytes32, address)",
            ].map((fn) => (
              <span key={fn} className="text-[10px] text-text-muted">
                {fn}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
