# Midas Operations Dashboard — Rebuild Instructions for Cursor

## IMPORTANT: Read This First

This is NOT an Etherscan clone. This is an **internal operations tool** for someone who processes subscriptions, manages redemptions, monitors liquidity, coordinates with strategy managers, and keeps Midas's operational machine running daily.

Every screen should answer the question: **"What do I need to do right now?"** — not "What happened on the blockchain?"

We have access to: Etherscan API (free tier), Ethereum RPC via viem, and public smart contract reads. We do NOT have access to Midas's internal systems, customer databases, or pending order queues. Where we lack internal data, we derive operational insights from on-chain data through calculations and classification — not just raw display.

---

## DESIGN SYSTEM — Match Midas's Visual Language

Midas (midas.app) uses an institutional, premium dark theme. NOT the "crypto hacker terminal" black (#000) look. Study these specifics:

### Color Palette (update tailwind.config.ts)

```
background:       #0B0E17       (deep navy, NOT pure black)
surface:          #111827       (card backgrounds — dark slate with blue undertone)
surface-2:        #1A2035       (elevated surfaces, inputs)
surface-3:        #232B42       (hover states, active elements)
border:           #2A3350       (subtle borders with blue tint)
accent:           #3B82F6       (Midas uses a clean blue, not neon cyan)
accent-hover:     #2563EB       (slightly deeper blue on hover)
success:          #10B981       (emerald green — not neon)
warning:          #F59E0B       (amber)
danger:           #EF4444       (red)
text-primary:     #F1F5F9       (near-white with cool tint)
text-secondary:   #94A3B8       (slate gray)
text-muted:       #64748B       (dimmer slate)
mint:             #10B981       (same as success — for subscriptions/mints)
burn:             #EF4444       (same as danger — for redemptions/burns)
```

### Typography (update globals.css)

```
Font family: Inter (headings and body) — this is what Midas and most institutional DeFi products use
Monospace: JetBrains Mono (addresses, hashes, calldata only)
```

Replace Space Grotesk and IBM Plex Mono. Load Inter from Google Fonts:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
```

### Design Principles

- Cards should have very subtle borders (1px, low opacity), slight background differentiation, NO harsh outlines
- No glow effects or neon aesthetics
- Use subtle background gradients on the page (not cards)
- Rounded corners: 12px for cards, 8px for buttons/inputs
- Tables should be clean — no heavy zebra striping, just subtle hover states
- Status indicators: small colored dots (4-6px), not flashy badges
- The overall feel should be: "Bloomberg terminal meets modern SaaS" — professional, information-dense but readable

---

## NAVIGATION — 5 Tabs

Rename and restructure the navigation:

1. **Operations** (was Overview) — Morning ops dashboard
2. **Capital Flows** (was Transactions) — Subscription & redemption management
3. **Access Control** (was Whitelist) — MPC workspace & role management
4. **Protocol Distribution** (was Explorer) — Where are mTokens deployed
5. **Runbook** (keep) — Operational procedures & compliance

---

## TAB 1: OPERATIONS (Daily Ops Dashboard)

**Purpose:** The first screen an ops associate opens every morning. Answers: "Is everything healthy? What needs attention?"

### Section A: Operational Health Strip (top of page)

A horizontal row of 4-5 compact status indicators. Each one is a small card with a colored dot (green/amber/red), a label, and a single value.

**Data sources and what they output:**

1. **Oracle Status**
   - Call `latestRoundData()` on mTBILL oracle (`0x056339C044055819E8Db84E71f5f2E1F536b2E5b`)
   - Extract `updatedAt` timestamp
   - Calculate: `hoursAgo = (Date.now()/1000 - updatedAt) / 3600`
   - Display: Green dot + "Oracle Fresh" + "Updated 3h ago" if < 24h
   - Display: Red dot + "Oracle Stale" + "Last update 26h ago" if > 24h
   - This matters because: stale oracle means instant subscriptions/redemptions should be paused

2. **24h Net Flow**
   - Pull Transfer events from mTBILL contract (last 24h)
   - Calculate: total minted (from=0x0) minus total burned (to=0x0)
   - Display: Green dot + "+125,000 mTBILL" if net positive (more subscriptions than redemptions)
   - Display: Red dot + "−50,000 mTBILL" if net negative (redemption pressure)
   - This matters because: consistent net outflows signal liquidity pressure

3. **Supply Trend**
   - Call `totalSupply()` on mTBILL and mBASIS
   - Compare to supply 7 days ago (calculate from cumulative mint/burn events)
   - Display: "mTBILL +2.3% 7d" with green/red coloring
   - This matters because: growing supply = business health

4. **Active Products**
   - Static count: "2 Active" (mTBILL, mBASIS)
   - Small text: "Ethereum Mainnet"
   - This is context, not dynamic

### Section B: Token Cards (row of 3 cards)

Keep the existing TokenCard component structure but add computed metrics:

**mTBILL Card:**
- NAV Price: from oracle (e.g., $1.0847)
- Total Supply: from contract (e.g., 103,454 mTBILL)
- AUM: supply × NAV (e.g., $11.2M)
- **Implied Yield (CALCULATE THIS):**
  - Pull oracle price from 30 days ago (from AnswerUpdated event history)
  - Calculate: `annualizedYield = ((currentNAV / nav30dAgo) ^ (365/30) - 1) * 100`
  - Display: "~4.8% APY (30d)" — this shows you understand the product generates yield
  - This is a meaningful computation that ops tracks, not just raw data

**mBASIS Card:**
- Total Supply: from contract
- No oracle available, so display "NAV: via strategy manager" in muted text
- Show recent subscription volume (sum of mints last 7 days)

**Portfolio Summary Card:**
- Combined AUM (where calculable)
- Total unique wallets holding mTokens (count unique recipients from mint events)
- Net 24h capital flow across both products

### Section C: NAV Price Chart (keep existing)

Keep the Recharts line chart showing mTBILL NAV over time. Add a horizontal reference line at $1.00 to show the yield accumulation visually — the NAV climbing above $1 IS the yield.

### Section D: Recent Activity Summary (NEW — replaces the data sources footer)

A compact list showing the 5 most recent operational events across both contracts — mints and burns — with one-line descriptions. Not a full table, just quick context:

```
3h ago — Subscription: +25,000 mTBILL to 0xAB..12
5h ago — Redemption: −10,000 mTBILL from 0xCD..34
1d ago — Subscription: +50,000 mBASIS to 0xEF..56
```

This gives the ops person instant awareness of what happened since they last checked.

---

## TAB 2: CAPITAL FLOWS (Subscription & Redemption Management)

**Purpose:** Track the lifecycle of capital flowing in and out. This is the core of "day-to-day investment ops."

### Section A: Flow Summary Cards (top row)

Three cards showing aggregate metrics for the last 30 days:

1. **Subscriptions (Mints)**
   - Total minted tokens (sum of all from=0x0 transfers, last 30d)
   - Convert to USD using NAV: `totalMinted × navPrice`
   - Count of individual subscription transactions
   - Display: "247,000 mTBILL ($268k) across 14 subscriptions"

2. **Redemptions (Burns)**
   - Total burned tokens (sum of all to=0x0 transfers, last 30d)
   - Convert to USD
   - Count of transactions
   - Display: "82,000 mTBILL ($89k) across 6 redemptions"

3. **Net Capital Flow**
   - Subscriptions minus redemptions
   - Show as a positive/negative number with color
   - Show the ratio: "3.0x more subscriptions than redemptions"
   - This is what ops reports to leadership

### Section B: Transaction Table (refactored)

Keep the existing sortable table but change the framing:

- Column headers: **Type** | **Product** | **Amount** | **USD Value** | **Counterparty** | **Processed**
- "Type" column: Show "Subscription" (green) or "Redemption" (red) — NOT "MINT"/"BURN" which is blockchain jargon
- "USD Value" column: multiply amount by NAV price — this is what the business cares about
- "Counterparty" column: the investor wallet address (truncated with copy)
- "Processed" column: relative time (3h ago, 2d ago)
- Clicking a row still expands to show the transaction detail panel with decoded calldata

### Section C: Smart Contract Decoder (keep existing TxDecoder)

Keep this utility as-is. It's a practical tool that directly addresses Felix's interview question about interpreting smart contracts. Just move it below the table under a collapsible "Tools" section so it doesn't dominate the page.

### Filter Bar

Keep the existing token and type filters. Add a time range filter: "24h | 7d | 30d | All"

---

## TAB 3: ACCESS CONTROL (MPC Workspace & Role Management)

**Purpose:** Manage who can do what on each contract. This maps to "orchestrate MPC wallet operations."

### Section A: Workspace Overview (NEW — replaces side-by-side role tables)

Instead of two identical role tables, create a single unified view that maps the operational structure:

**Strategy Manager Workspace Map:**

For each mToken contract, show a card with:
- Contract name and address
- A table of assigned roles: Role | Address | Status (Active/Revoked)
- Group addresses by their role to show the separation of powers visually:
  - ADMIN: These addresses control the contract
  - MINTER: These addresses can process subscriptions (create tokens)
  - BURNER: These addresses can process redemptions (destroy tokens)
  - DEPOSITOR: These addresses can deposit (if the role exists)

This reframing shows you understand the MPC workspace concept — admins hold the keys, minters/burners are the operational roles assigned to strategy managers or ops wallets.

**How to populate:** Keep the existing `useRoles` hook logic (RoleGranted/RoleRevoked events + hasRole verification). Just restructure the display.

### Section B: Address Lookup (keep existing)

The address lookup component is good. It shows balances and role assignments for any address. Keep as-is.

### Section C: Whitelist Simulation (keep existing)

The whitelist simulator generating calldata is excellent. Keep as-is. This directly demonstrates "managing transaction policies and whitelists."

### Section D: Role Event History (keep existing)

Keep the event feed showing recent RoleGranted/RoleRevoked events. This is the audit trail for access control changes.

---

## TAB 4: PROTOCOL DISTRIBUTION (NEW — replaces Explorer)

**Purpose:** Answer "Where are our mTokens being used?" This maps to "analyze and process blockchain data — wallet activity, token flows, and DeFi transactions."

### IMPORTANT: What data is actually available

We can call `balanceOf(address)` on mTBILL/mBASIS contracts for ANY address. The key insight: we know the addresses of major DeFi protocols where Midas tokens are integrated. We can check how much of the token supply sits in each protocol.

The Morpho core contract on Ethereum is `0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb`. We can check mTBILL and mBASIS balances there.

### Section A: Distribution Summary

Show a breakdown of where the total mTBILL/mBASIS supply is allocated:

**For each token, calculate:**
1. Call `totalSupply()` — this is the total
2. Call `balanceOf(morpho_address)` — tokens deployed in Morpho markets
3. Call `balanceOf(known_vault_addresses)` — tokens in other known protocol contracts
4. Remainder = tokens in investor wallets (totalSupply - protocol_holdings)

**Display as a horizontal stacked bar chart:**
```
mTBILL Supply Distribution
[████████████████░░░░░░░░] 
Investor Wallets: 72%  |  Morpho Markets: 18%  |  Other Protocols: 10%
```

Why this matters operationally: if too much supply is locked in DeFi protocols, instant redemption capacity could be constrained because those tokens can't be immediately burned.

### Section B: Protocol Integration Table

A table showing each known protocol integration:

| Protocol | Contract | mTBILL Held | mBASIS Held | % of Supply | Status |
|----------|----------|-------------|-------------|-------------|--------|
| Morpho   | 0xBBBB.. | 18,500      | 10.5        | 17.9%       | Active |
| (others) | ...      | ...         | ...         | ...         | ...    |

**Known addresses to check (add to constants.ts):**
```typescript
const PROTOCOL_ADDRESSES = {
  morpho: {
    label: "Morpho Blue",
    address: "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
    url: "https://app.morpho.org",
  },
  // Add more as discovered from transfer event analysis
} as const;
```

To discover more protocol addresses: scan recent Transfer events and identify recipient addresses that are contracts (i.e., addresses that appear frequently as recipients and have code). Label known ones, flag unknown contract recipients for ops review.

### Section C: Holder Concentration Analysis

This is a risk metric that ops monitors:

**Calculate from transfer data (existing logic in useExplorerData):**
- Top 5 holder addresses and their balances (via balanceOf RPC calls)
- Calculate Herfindahl-Hirschman Index (HHI) or simpler concentration ratio:
  - `top5Concentration = (sum of top 5 balances / totalSupply) * 100`
- Display: "Top 5 holders control 62% of mTBILL supply"
- Add a simple horizontal bar showing the concentration
- Color code: Green (< 50%), Amber (50-75%), Red (> 75%)

Why this matters: high concentration means a single large redemption could significantly impact liquidity.

### Section D: Wallet Deep Dive (simplified from old Explorer)

Keep the wallet analysis functionality but simplify:
- Input: paste any address
- Output: ETH balance, mTBILL balance, mBASIS balance, recent interaction history
- Remove the pie chart and daily flow chart (they belonged to analytics, not ops)

---

## TAB 5: RUNBOOK (Operational Procedures & Compliance)

**Purpose:** Interactive operational documentation. Maps to "support internal knowledge management."

### Keep the existing structure but make two additions:

### Addition 1: Product Launch Tracker

Add a 7th workflow option: "Product Launch Checklist"

This should be an interactive checklist (like the existing operational checklists) but specifically for onboarding a new strategy manager and launching a new mToken. Steps:

```
LEGAL & COMPLIANCE
☐ Strategy Management Agreement executed
☐ Investment universe and risk parameters documented
☐ Prospectus notification filed with FMA (Liechtenstein)
☐ Luxembourg compartment structure confirmed (if applicable)
☐ KYC/eligibility criteria defined for target investors
☐ Non-US/non-UK investor restriction verified
☐ MiCA Article 50 reporting obligations mapped

TECHNICAL SETUP
☐ Fordefi MPC workspace created
☐ MPC key shares distributed to strategy manager
☐ Approval policy configured (2-of-N quorum)
☐ Whitelisted destination addresses set
☐ Transaction size limits configured

SMART CONTRACT DEPLOYMENT
☐ mToken contract deployed (TransparentUpgradeableProxy)
☐ Admin role assigned to Midas admin multisig
☐ Minter/Burner roles assigned to ops wallet
☐ Oracle contract deployed and initial NAV set
☐ Contract verified on Etherscan

DEFI INTEGRATION
☐ Morpho market proposal submitted
☐ Pendle integration configured (if applicable)
☐ MSL liquidity sleeve seeded with initial USDC
☐ Instant redemption capacity target set (~10% of TVL)

GO-LIVE
☐ Test subscription (small amount) processed end-to-end
☐ Test redemption (small amount) processed end-to-end
☐ Monitoring alerts configured (oracle staleness, large tx)
☐ Investor communications prepared
☐ Product page live on midas.app
```

This checklist demonstrates deep understanding of Midas operations AND regulatory awareness (MiCA, FMA, Luxembourg structure). This is where your CV differentiates you.

### Addition 2: Regulatory Quick Reference Card

Add a small reference card to the Runbook sidebar (below the existing Quick Reference):

```
REGULATORY FRAMEWORK
─────────────────────
Issuer: Midas Software GmbH (Berlin) / Luxembourg SPV
Prospectus: FMA-approved (Liechtenstein) 
Structure: Tokenized certificates (German law)
           Qualified subordinated debt instruments
Eligible:  Non-US, non-UK, non-sanctioned jurisdictions
Framework: EU Prospectus Regulation, MiCA (where applicable)
Verification: Ankura Trust (independent verification agent)
```

This is static content but operationally critical context that the ops person needs to reference.

---

## FILES TO DELETE

Remove these files from the repository before the session:
- `Docs/implementation_plan`
- `Docs/midas_prototype_plan.md`
- `LICENSE` (or change to private/proprietary)

These reveal the project is an interview artifact.

---

## CODE FIXES

### Fix useRoles.ts

The `checkAddress` function calls `hasRole(DEFAULT_ADMIN_ROLE)` twice per contract instead of once for admin and once for balance. Fix the Promise.all array — the first call in each group should be `balanceOf`, not `hasRole(DEFAULT_ADMIN_ROLE)` again. Or better: restructure to separate the balance and role checks clearly.

### Fix etherscan.ts

The `getTokenHolders` function approximates holders from mint events. Add a disclaimer in the UI where this data is shown: "Estimated from on-chain activity" — or better, use the holder data only where it's verified via actual `balanceOf` RPC calls.

### Add to constants.ts

Add known protocol addresses for the Protocol Distribution tab:
```typescript
export const PROTOCOL_ADDRESSES: Record<string, { label: string; address: `0x${string}`; type: string }> = {
  morpho: {
    label: "Morpho Blue",
    address: "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
    type: "Lending Protocol",
  },
};
```

### Add KNOWN_SELECTORS

Add these function signatures that the decoder should recognize:
```typescript
"0x47e7ef24": "deposit(address,uint256)",
"0xba087652": "depositRequest(uint256,address,address)",
"0x9470b0bd": "withdrawRequest(uint256,address,address)",
```

---

## WHAT THE FINAL OUTPUT SHOULD FEEL LIKE

When Antoine opens this dashboard in the working session, he should think:

"This person didn't just connect to an API and dump data on screen. They thought about what I actually do every day — check oracle health, track capital flows, manage access control, monitor where our tokens are deployed, and follow operational procedures. They even included our regulatory structure. This is someone who could sit down at our ops desk tomorrow."

The dashboard is a conversation starter, not a finished product. Every screen should give the candidate something concrete to talk about during the working session.

---

## BUILD ORDER (priority)

1. Update design system (colors, fonts, global styles) — 30 min
2. Rebuild Tab 1 (Operations) with health strip and computed yield — 2 hours
3. Refactor Tab 2 (Capital Flows) with USD values and operational framing — 1.5 hours
4. Minor refactor Tab 3 (Access Control) — unified workspace view — 1 hour
5. Build Tab 4 (Protocol Distribution) — new — 2 hours
6. Add Product Launch Tracker + Regulatory card to Tab 5 — 1 hour
7. Fix bugs (useRoles.ts, KNOWN_SELECTORS) — 30 min
8. Delete docs folder, clean up — 15 min

Total estimated: ~9 hours
