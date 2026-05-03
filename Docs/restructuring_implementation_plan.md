# Midas Dashboard Restructuring — Phase-Wise Implementation Plan

Based on feedback in `Restructuring_feedback.md`. The goal is to transform the dashboard from a blockchain data viewer into an **operational command center** that answers: "What do I need to do right now?"

---

## Phase 1 — Design System Overhaul

**Goal:** Update the visual identity from "crypto hacker terminal" to Midas's institutional premium aesthetic.

### 1.1 Tailwind Config Update (`tailwind.config.ts`)
- Replace the current color palette with the new institutional palette:
  - `background: #0B0E17` (deep navy, not pure black)
  - `surface: #111827`, `surface-2: #1A2035`, `surface-3: #232B42`
  - `border: #2A3350` (blue-tinted borders)
  - `accent: #3B82F6` (clean blue, not neon cyan)
  - `success/mint: #10B981`, `warning: #F59E0B`, `danger/burn: #EF4444`
  - `text-primary: #F1F5F9`, `text-secondary: #94A3B8`, `text-muted: #64748B`
- Update border radius tokens: cards 12px, buttons/inputs 8px

### 1.2 Typography Update (`globals.css` + `layout.tsx`)
- Replace Space Grotesk / IBM Plex Mono with:
  - **Inter** (headings + body) — industry standard for institutional DeFi
  - **JetBrains Mono** (addresses, hashes, calldata only)
- Import from Google Fonts
- Update font family references throughout globals.css

### 1.3 Global Styles Refresh (`globals.css`)
- Remove glow effects and neon aesthetics
- Cards: very subtle 1px borders (low opacity), slight background differentiation
- Remove heavy zebra striping from tables — use subtle hover states
- Status indicators: small colored dots (4-6px), not flashy badges
- Overall feel: "Bloomberg terminal meets modern SaaS"

---

## Phase 2 — Navigation Restructuring

**Goal:** Rename tabs to reflect operational intent, not blockchain terminology.

### 2.1 Rename Routes
| Old Route | New Route | New Label |
|-----------|-----------|-----------|
| `/overview` | `/operations` | Operations |
| `/transactions` | `/capital-flows` | Capital Flows |
| `/whitelist` | `/access-control` | Access Control |
| `/explorer` | `/distribution` | Protocol Distribution |
| `/runbook` | `/runbook` | Runbook (unchanged) |

### 2.2 Update Files
- Rename `app/overview/` → `app/operations/`
- Rename `app/transactions/` → `app/capital-flows/`
- Rename `app/whitelist/` → `app/access-control/`
- Rename `app/explorer/` → `app/distribution/`
- Update `app/page.tsx` redirect to `/operations`
- Update `Navbar.tsx` with new labels and paths

---

## Phase 3 — Tab 1: Operations (Morning Ops Dashboard)

**Goal:** Build the screen an ops associate opens every morning. Answer: "Is everything healthy? What needs attention?"

### 3.1 Operational Health Strip (NEW)
A horizontal row of 4 compact status indicators at the top:

1. **Oracle Status** — Call `latestRoundData()`, compute `hoursAgo`, display green/red dot with staleness
2. **24h Net Flow** — Sum mints minus burns from last 24h Transfer events, display as net capital flow with direction
3. **Supply Trend** — Compare current `totalSupply()` to 7d ago (cumulative events), show % change
4. **Active Products** — Static: "2 Active · Ethereum Mainnet"

### 3.2 Token Cards Enhancement
- **mTBILL Card:** Add **Implied Yield** calculation:
  - Pull oracle price from 30 days ago (AnswerUpdated events)
  - Calculate: `annualizedYield = ((currentNAV / nav30dAgo) ^ (365/30) - 1) * 100`
  - Display: "~4.8% APY (30d)"
- **mBASIS Card:** Show "NAV: via strategy manager" (no oracle) + 7d subscription volume
- **Portfolio Summary Card:** Combined AUM, unique wallets, net 24h flow

### 3.3 NAV Chart Update
- Keep existing Recharts line chart
- Add horizontal reference line at $1.00 to visually show yield accumulation

### 3.4 Recent Activity Summary (NEW)
- Replace the "data sources footer" with a compact 5-item activity feed:
  - `3h ago — Subscription: +25,000 mTBILL to 0xAB..12`
  - One-line descriptions, quick operational awareness

### 3.5 Hook Updates (`useTokenData.ts`, `useNavHistory.ts`)
- Add `netFlow24h` calculation to useTokenData
- Add `supplyChange7d` calculation
- Add `impliedYield30d` calculation
- Extend `useNavHistory` to return 30-day-ago price for yield computation

---

## Phase 4 — Tab 2: Capital Flows (Subscription & Redemption Management)

**Goal:** Reframe from raw blockchain data to capital lifecycle management.

### 4.1 Flow Summary Cards (NEW — top row)
Three aggregate cards for last 30 days:
1. **Subscriptions** — Total minted × NAV = USD value, tx count
2. **Redemptions** — Total burned × NAV = USD value, tx count
3. **Net Capital Flow** — Difference, ratio ("3.0x more subscriptions than redemptions")

### 4.2 Transaction Table Refactor (`TransactionTable.tsx`)
- Rename columns: Type → "Subscription"/"Redemption" (not MINT/BURN)
- Add "USD Value" column (amount × NAV price)
- Rename "Wallet" → "Counterparty"
- Rename "Time" → "Processed"
- Keep expandable detail panel with decoded calldata

### 4.3 Smart Contract Decoder Repositioning
- Move `TxDecoder` below the table under a collapsible "Tools" section
- Don't let it dominate the page visually

### 4.4 Filter Bar Enhancement
- Keep token and type filters
- Add time range filter: "24h | 7d | 30d | All"

### 4.5 Hook Updates (`useTransactions.ts`)
- Add 30-day aggregate calculations (total minted, burned, USD values)
- Add time range filtering support

---

## Phase 5 — Tab 3: Access Control (MPC Workspace & Role Management)

**Goal:** Minor refactor — reframe as MPC workspace management, unified view.

### 5.1 Workspace Overview (Refactor `RoleDisplay.tsx`)
- Replace two identical side-by-side role tables with a **unified workspace map**
- For each mToken contract, show:
  - Contract name + address
  - Roles grouped by function:
    - ADMIN: Control the contract
    - MINTER: Process subscriptions
    - BURNER: Process redemptions
    - DEPOSITOR: Deposit operations
- This framing demonstrates understanding of MPC workspace concept

### 5.2 Keep Existing Components
- `AddressLookup.tsx` — keep as-is
- `WhitelistSimulator.tsx` — keep as-is (demonstrates "managing transaction policies")
- Role Event History — keep as-is (audit trail)

---

## Phase 6 — Tab 4: Protocol Distribution (NEW — replaces Explorer)

**Goal:** Answer "Where are our mTokens deployed?" — protocol-level capital allocation view.

### 6.1 Constants Update (`lib/constants.ts`)
- Add `PROTOCOL_ADDRESSES` map:
  - Morpho Blue: `0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb`
  - (Expandable as more integrations discovered)

### 6.2 New Hook: `useDistribution.ts`
- Call `totalSupply()` on mTBILL/mBASIS
- Call `balanceOf(morpho_address)` for each known protocol
- Calculate: investor wallets = totalSupply - sum(protocol_holdings)
- Return distribution percentages

### 6.3 Distribution Summary (Section A)
- Horizontal stacked bar chart showing supply allocation:
  - Investor Wallets: X% | Morpho Markets: Y% | Other Protocols: Z%
- Operational significance: tokens locked in DeFi may constrain instant redemption capacity

### 6.4 Protocol Integration Table (Section B)
- Table: Protocol | Contract | mTBILL Held | mBASIS Held | % of Supply | Status

### 6.5 Holder Concentration Analysis (Section C)
- Top 5 holders with balances (verified via `balanceOf` RPC)
- Concentration metric: "Top 5 control X% of supply"
- Color-coded bar: Green (<50%), Amber (50-75%), Red (>75%)
- Risk indicator for single-large-redemption scenarios

### 6.6 Wallet Deep Dive (Simplified)
- Keep address input → balances + interaction history
- Remove pie chart and daily flow chart (analytics ≠ ops)
- Simpler, focused output

---

## Phase 7 — Tab 5: Runbook Additions

**Goal:** Add Product Launch Tracker + Regulatory Reference to demonstrate deep Midas knowledge.

### 7.1 Product Launch Tracker (7th Workflow)
- Add a comprehensive interactive checklist with sections:
  - **Legal & Compliance:** SMA executed, investment universe documented, FMA prospectus filed, Luxembourg compartment confirmed, KYC criteria defined, non-US/UK restriction verified, MiCA Art. 50 mapped
  - **Technical Setup:** Fordefi MPC workspace, key shares distributed, approval policy (2-of-N), whitelisted destinations, tx size limits
  - **Smart Contract Deployment:** mToken deployed, admin role to multisig, minter/burner to ops wallet, oracle deployed, contract verified
  - **DeFi Integration:** Morpho market proposal, Pendle config, MSL sleeve seeded, instant redemption capacity target
  - **Go-Live:** Test subscription/redemption, monitoring alerts, investor comms, product page live

### 7.2 Regulatory Quick Reference Card
- Static reference card in sidebar:
  - Issuer: Midas Software GmbH (Berlin) / Luxembourg SPV
  - Prospectus: FMA-approved (Liechtenstein)
  - Structure: Tokenized certificates (German law), qualified subordinated debt
  - Eligible: Non-US, non-UK, non-sanctioned
  - Framework: EU Prospectus Regulation, MiCA
  - Verification: Ankura Trust

---

## Phase 8 — Bug Fixes & Code Improvements

**Goal:** Fix known issues and add missing data.

### 8.1 Fix `useRoles.ts`
- The `checkAddress` function incorrectly calls `hasRole(DEFAULT_ADMIN_ROLE)` twice per contract
- Restructure to clearly separate balance checks and role checks

### 8.2 Fix `etherscan.ts` — Holder Data Disclaimer
- `getTokenHolders` approximates from mint events
- Add "Estimated from on-chain activity" disclaimer where this data is shown
- Prefer verified data via `balanceOf` RPC calls where possible

### 8.3 Add to `constants.ts`
- Add `PROTOCOL_ADDRESSES` for Protocol Distribution tab (Morpho, etc.)
- Add missing `KNOWN_SELECTORS`:
  - `"0x47e7ef24": "deposit(address,uint256)"`
  - `"0xba087652": "depositRequest(uint256,address,address)"`
  - `"0x9470b0bd": "withdrawRequest(uint256,address,address)"`

---

## Phase 9 — Cleanup & Final Polish

**Goal:** Remove interview artifacts, final QA.

### 9.1 Delete Files
- `Docs/implementation_plan`
- `Docs/midas_prototype_plan.md`
- `Docs/Restructuring_feedback.md`
- `Docs/restructuring_implementation_plan.md` (this file)
- `LICENSE` (or change to private/proprietary)

### 9.2 Final QA
- Verify all pages load correctly
- Confirm data fetching works with live API keys
- Test responsiveness (desktop-optimized but functional on tablet)
- Verify Vercel deployment builds clean

### 9.3 Push & Deploy
- Commit all changes
- Push to GitHub → auto-deploy on Vercel
- Verify live URL is functional

---

## Summary Table

| Phase | Description | Key Deliverables |
|-------|-------------|------------------|
| 1 | Design System Overhaul | New colors, fonts, global styles |
| 2 | Navigation Restructuring | Renamed routes + navbar |
| 3 | Tab 1: Operations | Health strip, implied yield, activity feed |
| 4 | Tab 2: Capital Flows | Flow summaries, USD values, reframed table |
| 5 | Tab 3: Access Control | Unified workspace view |
| 6 | Tab 4: Protocol Distribution | New tab — supply allocation + concentration |
| 7 | Tab 5: Runbook Additions | Product launch tracker + regulatory card |
| 8 | Bug Fixes | useRoles fix, selectors, disclaimers |
| 9 | Cleanup & Deploy | Delete docs, final push |

---

## Design Philosophy

Every element on screen must pass this test:

> "Would an ops associate at Midas check this number/use this tool in their daily workflow?"

If the answer is no, it doesn't belong. We're building a tool that demonstrates **operational thinking**, not blockchain literacy.
