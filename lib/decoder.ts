import { decodeFunctionData, parseAbi, isHex } from "viem";
import { KNOWN_SELECTORS, ROLE_LABELS } from "./constants";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DecodedFunction {
  functionName: string;
  args: DecodedArg[];
  selector: string;
  raw: string;
}

export interface DecodedArg {
  name: string;
  type: string;
  value: string;
  label?: string;
}

// ─── Full ABI for decoding (union of all known Midas functions) ───────────────

const DECODE_ABI = parseAbi([
  "function mint(address to, uint256 amount)",
  "function burn(uint256 amount)",
  "function burn(address account, uint256 amount)",
  "function transfer(address to, uint256 value)",
  "function transferFrom(address from, address to, uint256 value)",
  "function approve(address spender, uint256 value)",
  "function grantRole(bytes32 role, address account)",
  "function revokeRole(bytes32 role, address account)",
  "function renounceRole(bytes32 role, address callerConfirmation)",
  "function depositInstant(address tokenIn, uint256 amountIn, uint256 minReceiveAmount, bytes32 referralCode)",
  "function redeemInstant(address tokenOut, uint256 amountIn, uint256 minReceiveAmount)",
  "function redeem(address tokenOut, uint256 amountMTokenIn)",
  "function deposit(address tokenIn, uint256 amountIn)",
]);

// ─── Decode a tx's input data (calldata) ─────────────────────────────────────

export function decodeCalldata(input: string): DecodedFunction | null {
  if (!input || input === "0x" || input.length < 10) return null;

  if (!isHex(input)) return null;

  const selector = input.slice(0, 10).toLowerCase();

  try {
    const decoded = decodeFunctionData({
      abi: DECODE_ABI,
      data: input as `0x${string}`,
    });

    const abiItem = DECODE_ABI.find(
      (item) => "name" in item && item.name === decoded.functionName
    ) as { inputs?: { name: string; type: string }[] } | undefined;

    const inputs = abiItem?.inputs ?? [];

    const args: DecodedArg[] = (decoded.args ?? []).map((val, i) => {
      const param = inputs[i];
      const rawVal = formatArgValue(val, param?.type ?? "");
      const label = getArgLabel(param?.type ?? "", rawVal);
      return {
        name: param?.name ?? `param${i}`,
        type: param?.type ?? "unknown",
        value: rawVal,
        ...(label ? { label } : {}),
      };
    });

    return {
      functionName: decoded.functionName,
      args,
      selector,
      raw: input,
    };
  } catch {
    // Fallback: at least name the function from known selectors
    const known = KNOWN_SELECTORS[selector];
    if (known) {
      return {
        functionName: known,
        args: [],
        selector,
        raw: input,
      };
    }
    return null;
  }
}

// ─── Format a decoded argument value for display ──────────────────────────────

function formatArgValue(val: unknown, type: string): string {
  if (val === null || val === undefined) return "null";

  if (type === "uint256" || type === "int256" || type === "uint80") {
    return String(val);
  }

  if (type === "bytes32") {
    return String(val);
  }

  if (type === "address") {
    return String(val);
  }

  if (typeof val === "bigint") {
    return val.toString();
  }

  return String(val);
}

// ─── Annotate known values (role hashes, token addresses, etc.) ───────────────

function getArgLabel(type: string, value: string): string | undefined {
  if (type === "bytes32") {
    return ROLE_LABELS[value.toLowerCase()];
  }
  return undefined;
}

// ─── Format token amounts for display ────────────────────────────────────────

export function formatTokenAmount(
  raw: string,
  decimals: number = 18
): { formatted: string; units: string } {
  try {
    const bn = BigInt(raw);
    const divisor = BigInt(10 ** decimals);
    const whole = bn / divisor;
    const frac = bn % divisor;
    const fracStr = frac.toString().padStart(decimals, "0").slice(0, 4);
    return {
      formatted: `${whole.toLocaleString()}.${fracStr}`,
      units: raw,
    };
  } catch {
    return { formatted: raw, units: raw };
  }
}
