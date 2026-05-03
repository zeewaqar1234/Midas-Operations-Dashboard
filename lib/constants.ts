import { keccak256, toHex } from "viem";

// ─── Contract Addresses ───────────────────────────────────────────────────────

export const CONTRACTS = {
  mTBILL: {
    token: "0xDD629E5241CbC5919847783e6C96B2De4754e438" as `0x${string}`,
    oracle: "0x056339C044055819E8Db84E71f5f2E1F536b2E5b" as `0x${string}`,
  },
  mBASIS: {
    token: "0x2a8c22E3b10036f3AEF5875d04f8441d4188b656" as `0x${string}`,
  },
} as const;

// ─── Role Hashes (OpenZeppelin AccessControl) ─────────────────────────────────

export const ROLES = {
  DEFAULT_ADMIN_ROLE:
    "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
  MINTER_ROLE: keccak256(toHex("MINTER_ROLE")) as `0x${string}`,
  BURNER_ROLE: keccak256(toHex("BURNER_ROLE")) as `0x${string}`,
  DEPOSITOR_ROLE: keccak256(toHex("DEPOSITOR_ROLE")) as `0x${string}`,
  REDEMPTION_VAULT_ADMIN_ROLE: keccak256(
    toHex("REDEMPTION_VAULT_ADMIN_ROLE")
  ) as `0x${string}`,
} as const;

export const ROLE_LABELS: Record<string, string> = {
  [ROLES.DEFAULT_ADMIN_ROLE]: "DEFAULT_ADMIN",
  [ROLES.MINTER_ROLE]: "MINTER_ROLE",
  [ROLES.BURNER_ROLE]: "BURNER_ROLE",
  [ROLES.DEPOSITOR_ROLE]: "DEPOSITOR_ROLE",
  [ROLES.REDEMPTION_VAULT_ADMIN_ROLE]: "REDEMPTION_VAULT_ADMIN",
};

// ─── Known Address Labels ─────────────────────────────────────────────────────

export const KNOWN_ADDRESSES: Record<string, string> = {
  "0x0000000000000000000000000000000000000000": "Zero Address (Mint/Burn)",
  [CONTRACTS.mTBILL.token]: "mTBILL Token Contract",
  [CONTRACTS.mTBILL.oracle]: "mTBILL Oracle",
  [CONTRACTS.mBASIS.token]: "mBASIS Token Contract",
};

// ─── Token Metadata ───────────────────────────────────────────────────────────

export const TOKEN_META = {
  mTBILL: {
    symbol: "mTBILL",
    name: "Midas Tokenized T-Bill",
    description: "Tokenized US Treasury Bills",
    decimals: 18,
    address: CONTRACTS.mTBILL.token,
    oracle: CONTRACTS.mTBILL.oracle,
    color: "#00D4FF",
    etherscanUrl: `https://etherscan.io/token/${CONTRACTS.mTBILL.token}`,
  },
  mBASIS: {
    symbol: "mBASIS",
    name: "Midas Basis Trading Token",
    description: "Basis Trading Token",
    decimals: 18,
    address: CONTRACTS.mBASIS.token,
    oracle: null,
    color: "#00C48C",
    etherscanUrl: `https://etherscan.io/token/${CONTRACTS.mBASIS.token}`,
  },
} as const;

export type TokenSymbol = keyof typeof TOKEN_META;

// ─── Etherscan ────────────────────────────────────────────────────────────────

export const ETHERSCAN_BASE = "https://api.etherscan.io/v2/api?chainid=1";
export const ETHERSCAN_URL = "https://etherscan.io";

// ─── Zero / burn address ──────────────────────────────────────────────────────

export const ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000" as `0x${string}`;

// ─── Known DeFi Protocol Addresses ───────────────────────────────────────────
// Used by the Protocol Distribution tab to check balanceOf on each protocol

export const PROTOCOL_ADDRESSES: Record<
  string,
  { label: string; address: `0x${string}`; type: string; url: string }
> = {
  morpho: {
    label: "Morpho Blue",
    address: "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
    type: "Lending Protocol",
    url: "https://app.morpho.org",
  },
};

// ─── Known Midas function signatures ─────────────────────────────────────────

export const KNOWN_SELECTORS: Record<string, string> = {
  "0x40c10f19": "mint(address,uint256)",
  "0x42966c68": "burn(uint256)",
  "0x9dc29fac": "burn(address,uint256)",
  "0x2e1a7d4d": "withdraw(uint256)",
  "0x2f4f21e2": "depositInstant(address,uint256,uint256,bytes32)",
  "0x1e9a6950": "redeemInstant(address,uint256,uint256)",
  "0x2e17de78": "redeem(uint256)",
  "0xa9059cbb": "transfer(address,uint256)",
  "0x23b872dd": "transferFrom(address,address,uint256)",
  "0x2f2ff15d": "grantRole(bytes32,address)",
  "0xd547741f": "revokeRole(bytes32,address)",
  "0x47e7ef24": "deposit(address,uint256)",
  "0xba087652": "depositRequest(uint256,address,address)",
  "0x9470b0bd": "withdrawRequest(uint256,address,address)",
};
