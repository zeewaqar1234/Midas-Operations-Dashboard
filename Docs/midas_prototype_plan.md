# Midas Onchain Operations Dashboard — Prototype Specification

## Purpose & Context
This is a working prototype for a **second-round interview working session** at **Midas** (midas.app) for the **Onchain Operations Associate** role. The COO (Felix Stremmer) specifically mentioned skills around **interpreting smart contracts, whitelisting addresses, and reading block explorers**. The Product Ops Lead (Antoine Bourgois) will evaluate this in a working session.

The prototype should demonstrate hands-on operational competency with Midas's actual onchain infrastructure — not a generic crypto dashboard.

---

## Tech Stack

- **Framework**: Next.js 14+ (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **Blockchain Data**: Etherscan API (free tier), Alchemy/Infura RPC (free tier), or direct public RPC
- **Charts**: Recharts or Tremor
- **Wallet Data**: viem library for contract reads
- **Deployment**: Vercel (free tier) — have a live URL ready for the session

---

## Real Midas Contract Addresses to Use

These are Midas's actual deployed contracts on Ethereum mainnet. Use them to pull REAL data:

### mTBILL (Tokenized US Treasury Bills)
- **Token**: `0xDD629E5241CbC5919847783e6C96B2De4754e438`
- **Oracle (mTBILL/USD)**: `0x056339C044055819E8Db84E71f5f2E1F536b2E5b`

### mBASIS (Basis Trading Token)
- **Token**: `0x2a8c22E3b10036f3AEF5875d04f8441d4188b656`

### Key Facts
- All mTokens are **ERC-20 tokens** behind **TransparentUpgradeableProxy** (OpenZeppelin pattern)
- They use **role-based access control (RBAC)** — roles like MINTER_ROLE, BURNER_ROLE
- Subscription = minting new tokens to investor wallet
- Redemption = burning tokens from investor wallet
- NAV is published via onchain oracle contracts
- Whitelisting controls who can hold/transfer tokens

---

## Dashboard Modules (5 Tabs)

### TAB 1: Token Overview & NAV Monitor
**What it shows**: A live snapshot of Midas's mToken universe — the kind of screen an ops associate would check every morning.

**Data to fetch (use Etherscan API + RPC calls)**:
- Total supply of mTBILL and mBASIS (call `totalSupply()` on each contract)
- Number of holders (Etherscan token holder count API)
- Current NAV/price from the oracle contract (`latestAnswer()` or equivalent read function on `0x056339C044055819E8Db84E71f5f2E1F536b2E5b`)
- Calculate implied AUM = totalSupply × NAV price

**UI Layout**:
```
┌─────────────────────────────────────────────────────┐
│  MIDAS OPERATIONS DASHBOARD          [Connected: Ξ] │
├──────────────┬──────────────┬───────────────────────┤
│  mTBILL      │  mBASIS      │  Portfolio Summary    │
│  NAV: $X.XX  │  NAV: $X.XX  │  Total AUM: $XXM     │
│  Supply: XXk │  Supply: XXk │  Total Holders: XXX   │
│  Holders: XX │  Holders: XX │  Products: 2          │
│  24h Δ: +X%  │  24h Δ: +X%  │                       │
└──────────────┴──────────────┴───────────────────────┘
│  NAV Price History Chart (line chart, 30 days)       │
└─────────────────────────────────────────────────────┘
```

**Implementation details**:
- Use `viem` to create a public client connected to Ethereum mainnet
- Read `totalSupply()` from each token contract using the ERC-20 ABI
- Read the oracle contract for price data — it follows Chainlink-style interface, so try `latestRoundData()` which returns `(roundId, answer, startedAt, updatedAt, answeredInRound)`
- For historical NAV data, use Etherscan's token price history API or pull oracle update events
- Auto-refresh every 60 seconds with a countdown timer visible in the UI
- Show a small "Last Updated: X seconds ago" timestamp

---

### TAB 2: Transaction Monitor & Smart Contract Interpreter
**What it shows**: Recent mint (subscription) and burn (redemption) events from the mToken contracts — the core daily workflow of the ops role.

**This is the most important tab — it directly maps to Felix's interview focus areas.**

**Data to fetch**:
- Pull `Transfer` events from the mTBILL contract where `from == 0x0` (mints/subscriptions) or `to == 0x0` (burns/redemptions)
- Use Etherscan API: `api.etherscan.io/api?module=account&action=tokentx&contractaddress=0xDD629E5241CbC5919847783e6C96B2De4754e438`
- For each transaction, fetch the full tx details to show method name, gas used, block number

**UI Layout**:
```
┌─────────────────────────────────────────────────────┐
│  TRANSACTION MONITOR                   [Filter ▼]   │
├─────────────────────────────────────────────────────┤
│  Type  │  Token  │  Amount  │  Wallet    │  Time    │
│  ──────┼─────────┼──────────┼────────────┼────────  │
│  🟢 MINT│ mTBILL │ 50,000   │ 0xab..12  │ 2h ago   │
│  🔴 BURN│ mTBILL │ 10,000   │ 0xcd..34  │ 5h ago   │
│  🟢 MINT│ mBASIS │ 25,000   │ 0xef..56  │ 1d ago   │
├─────────────────────────────────────────────────────┤
│  TRANSACTION DETAIL (click to expand)               │
│  ┌─────────────────────────────────────────────┐    │
│  │ Tx Hash: 0x1234...abcd  [View on Etherscan]│    │
│  │ Block: 19,234,567                           │    │
│  │ Method: mint(address,uint256)               │    │
│  │ From: 0xABCD (Midas: Minter Role)          │    │
│  │ To: 0x1234 (Investor Wallet)               │    │
│  │ Amount: 50,000 mTBILL                      │    │
│  │ Gas Used: 85,432                            │    │
│  │ Status: ✅ Success                          │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  SMART CONTRACT FUNCTION DECODER                    │
│  ┌─────────────────────────────────────────────┐    │
│  │ Paste any tx hash or calldata here:         │    │
│  │ [________________________________________]  │    │
│  │                                              │    │
│  │ Decoded:                                     │    │
│  │ Function: depositInstant(address,uint256,..)│    │
│  │ Parameter 1 (tokenIn): 0xA0b8... (USDC)    │    │
│  │ Parameter 2 (amountIn): 100000000000 (100k) │    │
│  │ Parameter 3 (minReceive): 99500...          │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

**Implementation details**:
- Create a utility function that decodes ERC-20 Transfer event logs
- Identify mints (from = 0x000...000) and burns (to = 0x000...000)
- The "Smart Contract Function Decoder" should accept a raw transaction hash, fetch the input data via Etherscan API, and decode it against known Midas contract ABIs
- Include known function signatures: `mint(address,uint256)`, `burn(uint256)`, `depositInstant(...)`, `redeemInstant(...)`
- For the decoder, use `viem`'s `decodeFunctionData` with the contract ABI
- Link each tx hash to `https://etherscan.io/tx/{hash}` opening in new tab
- Add filter controls: by token (mTBILL / mBASIS / All), by type (Mint / Burn / All), by date range

---

### TAB 3: Whitelist & Access Control Manager
**What it shows**: Simulates the operational workflow of managing which addresses are authorized to interact with mTokens.

**This directly addresses Felix's mention of "whitelisting of addresses".**

**Data to fetch**:
- Read role-based access data from the mToken contracts
- The contracts use OpenZeppelin AccessControl, so look for `RoleGranted` and `RoleRevoked` events
- Role hashes: `MINTER_ROLE = keccak256("MINTER_ROLE")`, `BURNER_ROLE = keccak256("BURNER_ROLE")`, `DEFAULT_ADMIN_ROLE = 0x00`
- Check `hasRole(bytes32 role, address account)` for known addresses
- Pull the list of addresses that have received tokens (potential whitelist members)

**UI Layout**:
```
┌─────────────────────────────────────────────────────┐
│  WHITELIST & ACCESS CONTROL                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  CONTRACT ROLES (mTBILL)                            │
│  ┌─────────────────────────────────────────────┐    │
│  │ Role          │ Addresses │ Status           │    │
│  │ DEFAULT_ADMIN │ 0xab..12  │ ✅ Active         │    │
│  │ MINTER_ROLE   │ 0xcd..34  │ ✅ Active         │    │
│  │ BURNER_ROLE   │ 0xef..56  │ ✅ Active         │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ADDRESS LOOKUP                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ Enter address: [0x________________________] │    │
│  │ [Check Whitelist Status]                     │    │
│  │                                              │    │
│  │ Results:                                     │    │
│  │ Address: 0x1234...abcd                       │    │
│  │ mTBILL Balance: 50,000                       │    │
│  │ mBASIS Balance: 0                            │    │
│  │ Has MINTER_ROLE: ❌ No                       │    │
│  │ Has BURNER_ROLE: ❌ No                       │    │
│  │ First Interaction: 2024-03-15                │    │
│  │ Last Interaction: 2025-04-20                 │    │
│  │ Total Txs with Midas: 12                     │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  WHITELIST SIMULATION (Mock — NOT on-chain)         │
│  ┌─────────────────────────────────────────────┐    │
│  │ This section simulates the ops workflow      │    │
│  │ of adding/removing addresses from whitelist  │    │
│  │                                              │    │
│  │ Address: [____________________________]      │    │
│  │ Action:  [Add to Whitelist ▼]                │    │
│  │ Product: [mTBILL ▼]                          │    │
│  │ Reason:  [New institutional investor     ]   │    │
│  │ [Submit Request]                             │    │
│  │                                              │    │
│  │ ⚠ Mock mode: generates a simulated tx       │    │
│  │   preview showing what the on-chain call     │    │
│  │   would look like (calldata + gas estimate)  │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  RECENT ROLE EVENTS (from blockchain)               │
│  ┌─────────────────────────────────────────────┐    │
│  │ RoleGranted: MINTER_ROLE → 0xab..  │ 3d ago │    │
│  │ RoleRevoked: BURNER_ROLE → 0xcd..  │ 1w ago │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

**Implementation details**:
- Use `viem` to call `hasRole(bytes32,address)` on the contract — this is a standard OpenZeppelin function
- Compute role hashes: `keccak256(toHex("MINTER_ROLE"))` etc.
- For the whitelist simulation, generate the raw calldata that would be sent to the contract using `encodeFunctionData` — this shows you understand how contract interactions work without actually executing
- Show the simulated transaction object: `{ to: contractAddress, data: calldata, value: 0, gasEstimate: ~XXk }`
- Pull `RoleGranted` and `RoleRevoked` event logs from the contract using Etherscan event log API

---

### TAB 4: Block Explorer & Wallet Analyzer
**What it shows**: An embedded explorer view focused on Midas-relevant activity. Demonstrates "being able to read the explorer" as Felix mentioned.

**Data to fetch**:
- Top mTBILL and mBASIS holders (Etherscan token holder API)
- For any selected wallet: full transaction history with Midas contracts
- Token flow analysis: net inflows vs outflows per period

**UI Layout**:
```
┌─────────────────────────────────────────────────────┐
│  BLOCK EXPLORER & WALLET ANALYSIS                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  TOP HOLDERS                                        │
│  ┌──────────────────────────────────────────┐       │
│  │ Rank │ Address    │ Balance  │ % Supply  │       │
│  │  1   │ 0xab..12  │ 250,000  │ 24.2%     │       │
│  │  2   │ 0xcd..34  │ 120,000  │ 11.6%     │       │
│  │  3   │ 0xef..56  │ 80,000   │  7.7%     │       │
│  │  ... │ ...       │ ...      │ ...       │       │
│  └──────────────────────────────────────────┘       │
│                                                     │
│  HOLDER CONCENTRATION (Pie chart)                   │
│  [Top 5 holders vs rest — shows concentration risk] │
│                                                     │
│  WALLET DEEP DIVE                                   │
│  ┌──────────────────────────────────────────┐       │
│  │ Enter wallet: [0x_______________________]│       │
│  │ [Analyze]                                 │       │
│  │                                           │       │
│  │ Wallet: 0xABCD...1234                     │       │
│  │ ETH Balance: X.XX ETH                     │       │
│  │ mTBILL: 50,000 ($XX,XXX)                 │       │
│  │ mBASIS: 25,000 ($XX,XXX)                 │       │
│  │ USDC: 100,000                             │       │
│  │                                           │       │
│  │ MIDAS INTERACTION TIMELINE                │       │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━           │       │
│  │ Mar 15 ──── Mint 50k mTBILL              │       │
│  │ Apr 01 ──── Mint 25k mBASIS              │       │
│  │ Apr 20 ──── Redeem 10k mTBILL            │       │
│  └──────────────────────────────────────────┘       │
│                                                     │
│  TOKEN FLOW ANALYSIS (Bar chart)                    │
│  [Daily net mint/burn volume over last 30 days]     │
└─────────────────────────────────────────────────────┘
```

**Implementation details**:
- Use Etherscan API `tokentx` endpoint to get all token transfers for a given wallet filtered by Midas contract addresses
- Calculate running balances from transfer history
- Build a timeline component that shows chronological interactions
- Pie chart for holder concentration using Recharts
- Bar chart for daily mint/burn volume (aggregate Transfer events by day, classify as mint or burn)
- Label known addresses: if an address matches a known Midas contract (minter, admin), tag it with a label like "Midas: Minter", "Midas: Admin"

---

### TAB 5: Operational Runbook & Process Simulator
**What it shows**: Interactive documentation of Midas operational workflows — demonstrates you've studied their processes and can articulate them.

**This is NOT data-fetching — it's a process visualization that shows deep understanding of Midas operations.**

**UI Layout**:
```
┌─────────────────────────────────────────────────────┐
│  OPERATIONAL RUNBOOK                                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  SELECT WORKFLOW:                                   │
│  [1. Subscription (Mint)]  [2. Redemption (Burn)]   │
│  [3. New Product Launch]   [4. Whitelist Update]    │
│  [5. NAV Price Update]     [6. Incident Response]   │
│                                                     │
│  ──── WORKFLOW: TOKEN SUBSCRIPTION ────             │
│                                                     │
│  STEP-BY-STEP FLOW DIAGRAM                          │
│  ┌─────────────────────────────────────────────┐    │
│  │                                              │    │
│  │  [Investor]                                  │    │
│  │     │                                        │    │
│  │     ▼                                        │    │
│  │  [KYC/Eligibility Check]                     │    │
│  │     │                                        │    │
│  │     ▼                                        │    │
│  │  [Sends USDC to Midas Contract]              │    │
│  │     │                                        │    │
│  │     ├── Instant Mode ──► [MSL Liquidity      │    │
│  │     │                     Pool check]        │    │
│  │     │                        │               │    │
│  │     │                        ▼               │    │
│  │     │                  [Atomic mint at        │    │
│  │     │                   oracle NAV price]     │    │
│  │     │                        │               │    │
│  │     │                        ▼               │    │
│  │     │                  [mTokens sent to       │    │
│  │     │                   investor wallet]      │    │
│  │     │                                        │    │
│  │     └── Standard Mode ──► [Request queued]   │    │
│  │                               │              │    │
│  │                               ▼              │    │
│  │                         [Ops processes       │    │
│  │                          within T+2 days]    │    │
│  │                               │              │    │
│  │                               ▼              │    │
│  │                         [Strategy Manager    │    │
│  │                          deploys capital]    │    │
│  │                               │              │    │
│  │                               ▼              │    │
│  │                         [mTokens minted      │    │
│  │                          to investor]        │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  OPERATIONAL CHECKLIST (interactive)                 │
│  ☐ Verify investor wallet is whitelisted            │
│  ☐ Confirm USDC received at correct address         │
│  ☐ Check instant redemption pool capacity           │
│  ☐ Verify NAV oracle is current (< 1 day old)       │
│  ☐ Confirm mint transaction success on explorer     │
│  ☐ Update internal tracking spreadsheet             │
│  ☐ Send investor confirmation                       │
│                                                     │
│  RISK FLAGS (auto-detected)                         │
│  ⚠ Large transaction (>$1M) — requires extra review│
│  ⚠ New wallet — first interaction, verify KYC       │
│  ⚠ Oracle stale (>24h since last update)            │
└─────────────────────────────────────────────────────┘
```

**Implementation details**:
- Build 6 interactive workflow diagrams using a simple SVG or React flow component
- Each workflow should be clickable — expanding into step-by-step details
- The **operational checklist** should be interactive checkboxes that track completion
- The **risk flags** section should pull from real data (e.g., check if the oracle's `updatedAt` timestamp is more than 24 hours old)
- Workflow content is based on Midas documentation:
  - **Subscription**: Investor sends USDC → eligibility check → instant or standard mode → mint at NAV → tokens to wallet
  - **Redemption**: Investor submits burn → instant (MSL pool) or standard (T+2 to T+7) → USDC returned
  - **New Product Launch**: Partner onboarding → MPC workspace setup → whitelist config → oracle deployment → go-live
  - **Whitelist Update**: Request from strategy manager → Midas reviews → approver quorum → on-chain update
  - **NAV Update**: Strategy manager provides valuation → Midas cross-checks → fees deducted → oracle updated
  - **Incident Response**: Oracle stale / large unexpected redemption / contract anomaly → escalation flow

---

## Design & Styling

### Color Palette (match Midas branding)
- Primary: Deep dark backgrounds (#0A0A0F or similar — Midas uses dark themes)
- Accent: Electric blue/cyan (#00D4FF) or their brand green
- Success: Green (#00C48C)
- Warning: Amber (#FFB800)
- Error: Red (#FF4444)
- Text: White/Light gray on dark
- Cards: Slightly elevated dark surfaces with subtle borders

### Typography
- Headings: "Space Grotesk" or "Outfit" (modern, crypto-native feel)
- Body: "IBM Plex Mono" for data/addresses (monospace is essential for hex values)
- Numbers: Tabular figures for alignment in tables

### Key Design Principles
- Dark mode only (matches crypto/DeFi industry standard)
- Monospace font for all blockchain addresses and hashes
- Truncated addresses with copy-to-clipboard (0xABCD...1234 format)
- Green for mints, red for burns — consistent color coding
- Subtle pulse animation on live data indicators
- Responsive but optimized for desktop (it's an ops tool)

---

## API Keys & Setup Required

1. **Etherscan API Key** (free): Sign up at etherscan.io/apis — needed for transaction history, token holders, event logs
2. **RPC Provider** (free tier): Alchemy (alchemy.com) or Infura — needed for direct contract reads via `viem`
3. **Environment Variables**:
   ```
   NEXT_PUBLIC_ETHERSCAN_API_KEY=your_key_here
   NEXT_PUBLIC_ALCHEMY_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your_key
   ```

---

## File Structure

```
midas-ops-dashboard/
├── app/
│   ├── layout.tsx              # Root layout with dark theme, nav
│   ├── page.tsx                # Landing → redirects to /overview
│   ├── overview/page.tsx       # Tab 1: Token Overview & NAV
│   ├── transactions/page.tsx   # Tab 2: Transaction Monitor
│   ├── whitelist/page.tsx      # Tab 3: Whitelist Manager
│   ├── explorer/page.tsx       # Tab 4: Block Explorer
│   └── runbook/page.tsx        # Tab 5: Operational Runbook
├── components/
│   ├── Navbar.tsx              # Top navigation with tab switching
│   ├── TokenCard.tsx           # mToken summary card
│   ├── TransactionTable.tsx    # Sortable tx table
│   ├── TxDecoder.tsx           # Smart contract calldata decoder
│   ├── AddressLookup.tsx       # Whitelist checker component
│   ├── RoleDisplay.tsx         # Access control role viewer
│   ├── HolderChart.tsx         # Pie chart for holder distribution
│   ├── FlowChart.tsx           # Mint/burn volume bar chart
│   ├── WorkflowDiagram.tsx     # SVG-based process flow
│   ├── AddressTag.tsx          # Truncated address with copy
│   └── StatusBadge.tsx         # Status indicator component
├── lib/
│   ├── contracts.ts            # Contract addresses & ABIs
│   ├── etherscan.ts            # Etherscan API wrapper functions
│   ├── viem-client.ts          # viem public client config
│   ├── decoder.ts              # ABI decoder utilities
│   ├── formatters.ts           # Number/address formatting
│   └── constants.ts            # Role hashes, known addresses
├── hooks/
│   ├── useTokenData.ts         # Hook for token supply/price
│   ├── useTransactions.ts      # Hook for tx history
│   └── useRoles.ts             # Hook for access control data
├── .env.local                  # API keys (not committed)
├── package.json
└── tailwind.config.ts
```

---

## Key Contract ABIs (Minimal — include these in `lib/contracts.ts`)

```typescript
// ERC-20 standard functions
const ERC20_ABI = [
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
] as const;

// OpenZeppelin AccessControl functions
const ACCESS_CONTROL_ABI = [
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function getRoleAdmin(bytes32 role) view returns (bytes32)",
  "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
  "event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)",
  "event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)",
] as const;

// Midas-specific functions (from their implementation contract)
const MIDAS_TOKEN_ABI = [
  "function mint(address to, uint256 amount)",
  "function burn(uint256 amount)",
  ...ERC20_ABI,
  ...ACCESS_CONTROL_ABI,
] as const;

// Chainlink-style Oracle ABI
const ORACLE_ABI = [
  "function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
  "function decimals() view returns (uint8)",
  "function description() view returns (string)",
] as const;

// Contract addresses
const CONTRACTS = {
  mTBILL: {
    token: "0xDD629E5241CbC5919847783e6C96B2De4754e438",
    oracle: "0x056339C044055819E8Db84E71f5f2E1F536b2E5b",
  },
  mBASIS: {
    token: "0x2a8c22E3b10036f3AEF5875d04f8441d4188b656",
  },
} as const;

// Known role hashes
const ROLES = {
  DEFAULT_ADMIN_ROLE: "0x0000000000000000000000000000000000000000000000000000000000000000",
  MINTER_ROLE: keccak256(toHex("MINTER_ROLE")),
  BURNER_ROLE: keccak256(toHex("BURNER_ROLE")),
} as const;
```

---

## What to Say in the Working Session

When presenting this prototype, emphasize these points:

1. **"I built this using Midas's actual deployed contracts"** — not mock data. This shows you can navigate real blockchain infrastructure.

2. **"The Transaction Monitor decodes raw calldata"** — demonstrates you can interpret smart contract interactions, which Felix specifically asked about.

3. **"The Whitelist Manager shows how RBAC works in practice"** — demonstrates understanding of Midas's security model (strategy managers operate within bounds, Midas holds the keys).

4. **"I studied your operational workflows from docs.midas.app"** — the Runbook tab shows you understand the subscription/redemption lifecycle, the MSL liquidity architecture, the approver quorum system, and the oracle price verification flow.

5. **"This is the kind of tool I'd build on day one to make operations more efficient"** — positions the prototype as a practical contribution, not just an interview exercise.

---

## Build Priority (if short on time)

If you can't build all 5 tabs, prioritize in this order:

1. **Tab 2 (Transaction Monitor + Decoder)** — HIGHEST PRIORITY — directly maps to Felix's questions
2. **Tab 3 (Whitelist Manager)** — directly maps to Felix's whitelisting mention
3. **Tab 1 (Token Overview)** — shows you can read live blockchain data
4. **Tab 5 (Runbook)** — shows deep product understanding (no API needed, pure frontend)
5. **Tab 4 (Explorer)** — nice-to-have, most complex to build

---

## Potential Questions They Might Ask & How to Answer

**Q: "How would you handle a situation where the oracle price hasn't updated in 24 hours?"**
A: "I'd flag it immediately in our monitoring — you can see in the dashboard I check the `updatedAt` timestamp from the oracle. The ops workflow would be: (1) check if it's a known maintenance window, (2) contact the oracle operator, (3) if it persists, pause instant redemptions to standard mode to protect investors from stale pricing, (4) escalate to the strategy manager and compliance."

**Q: "Walk me through what happens when an investor wants to redeem 500k mTBILL."**
A: "First I'd check instant redemption capacity — the MSL pool typically holds ~10% of TVL in USDC. If 500k exceeds that, it falls back to Standard Mode with T+2 to T+7 settlement. I'd verify the wallet's whitelist status, confirm the NAV oracle is current, process the burn transaction through the MPC workspace (which requires approver quorum — both strategy manager and Midas signers), and then coordinate the USDC transfer from the liquidity sleeve."

**Q: "How would you verify that a new strategy manager's wallet is correctly set up?"**
A: "I'd check the on-chain roles using `hasRole()` — verify they have the appropriate role grants but NOT admin roles (separation of powers). Then verify their workspace's whitelisted addresses match the approved destination list. I'd test with a small transaction first, verify it hits the correct vault, and confirm the policy engine (Fordefi in Midas's case) correctly routes the approval flow through the quorum."

---

## Final Notes

- Deploy to Vercel so you have a live URL to share during the session
- Test with real contract reads before the session — make sure RPC calls work
- Have the Etherscan pages for mTBILL and mBASIS open in browser tabs as backup
- Print the Runbook workflows as a fallback if the live demo has issues
- The prototype doesn't need to be perfect — it needs to demonstrate you can operate in the onchain environment they work in every day
