# Midas Operations Dashboard

An internal ops tool for monitoring the Midas protocol on Ethereum mainnet — token supply, NAV pricing, capital flows, access control, and protocol distribution across mTBILL and mBASIS.

Built as a practical project to demonstrate how on-chain data (Etherscan event logs + direct RPC reads) can be surfaced as a usable operations interface for a tokenized asset protocol.

---

## What it shows

**Operations** — Daily health check. Oracle freshness, AUM, implied APY (30-day annualised), 24h net capital flow, 7-day supply trend, and a feed of the most recent subscription/redemption events.

**Capital Flows** — Subscription and redemption tracking. Summary cards with USD values, a daily bar chart showing flow direction over time, redemption pressure indicator, and the full transaction table with counterparty addresses.

**Access Control** — On-chain role map for both contracts. Shows which addresses hold Admin, Minter, Burner, and Depositor roles, verified live via `hasRole()`. Includes the full history of role grants and revocations.

**Protocol Distribution** — Where mTokens are deployed. Splits supply between investor wallets and DeFi protocol integrations. Includes a holder concentration analysis with redemption risk assessment.

**Runbook** — Interactive workflow guide for standard ops processes: subscription, redemption, whitelist update, daily NAV update, product launch, and incident response. Each workflow has an expandable step-by-step view and a checkable ops checklist.

---

## Running locally

```bash
git clone https://github.com/zeewaqar1234/Midas-Operations-Dashboard.git
cd Midas-Operations-Dashboard
npm install
```

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_ETHERSCAN_API_KEY=your_etherscan_api_key
NEXT_PUBLIC_ALCHEMY_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your_key
```

Then:

```bash
npm run dev
```

Opens at `http://localhost:3000`. The app redirects to `/operations` on load.

---

## Environment variables

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_ETHERSCAN_API_KEY` | [etherscan.io/apis](https://etherscan.io/apis) — free tier is enough |
| `NEXT_PUBLIC_ALCHEMY_RPC_URL` | [alchemy.com](https://www.alchemy.com) — free tier, select Ethereum Mainnet |

Both are prefixed `NEXT_PUBLIC_` because they run in the browser. This is fine for read-only API keys but do not use keys with write permissions here.

---

## Stack

- **Next.js 16** (App Router, all pages are client components)
- **viem** — Ethereum RPC calls (`totalSupply`, `balanceOf`, `hasRole`, `latestRoundData`)
- **Etherscan V2 API** — event logs for Transfer, RoleGranted/Revoked, AnswerUpdated
- **Recharts** — NAV history line chart, daily capital flows bar chart
- **Tailwind CSS** — light theme, Inter font

---

## Data sources

| What | How |
|---|---|
| Current NAV price | RPC → oracle contract `latestRoundData()` |
| NAV price history | Etherscan getLogs → `AnswerUpdated` events on the oracle |
| Token supply | RPC → `totalSupply()` on each mToken contract |
| Subscriptions / Redemptions | Etherscan token transfers — mint = from zero address, burn = to zero address |
| Role holders | Etherscan getLogs → `RoleGranted` + `RoleRevoked`, confirmed via `hasRole()` |
| Protocol balances | RPC → `balanceOf(protocolAddress)` on each known DeFi integration |

No backend. All data is fetched client-side on page load.

---

## Contract addresses (Ethereum Mainnet)

| Contract | Address |
|---|---|
| mTBILL token | `0xDD629E5241CbC5919847783e6C96B2De4754e438` |
| mBASIS token | `0x2a8c22E3b10036f3AEF5875d04f8441d4188b656` |
| mTBILL oracle | `0x056339C044055819E8Db84E71f5f2E1F536b2E5c` |
