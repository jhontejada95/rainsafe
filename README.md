# RainSafe
### Parametric Climate Insurance for Smallholder Farmers on Hedera

> **Hedera Hello Future Apex Hackathon 2026 — Sustainability Track**

[![Live Dashboard](https://img.shields.io/badge/Dashboard-Live-22c55e)](https://rainsafe-frontend.vercel.app)
[![Telegram Bot](https://img.shields.io/badge/Bot-@RainSafeHedera__bot-229ED9)](https://t.me/RainSafeHedera_bot)
[![Hedera Testnet](https://img.shields.io/badge/Hedera-Testnet-8B5CF6)](https://hashscan.io/testnet/contract/0.0.8329786)
[![Landing Page](https://img.shields.io/badge/Landing-GitHub%20Pages-black)](https://jhontejada95.github.io/rainsafe)

---

## The Problem

**500 million smallholder farmers have zero access to climate insurance.**

Traditional crop insurance takes 4–6 months to pay out, requires paperwork, bank accounts, and adjusters — none of which rural farmers have. Less than 3% of agricultural losses in developing countries are insured. Climate change makes this worse every year.

## The Solution

**RainSafe pays automatically when drought is detected. No paperwork. No banks. No waiting.**

When rainfall drops below **5mm in 7 consecutive days**, the smart contract triggers a payout directly to the farmer's wallet. The trigger is objective (Open-Meteo weather API), immutable (recorded on Hedera Consensus Service), and instant (3–5 second finality).

**Key innovations:**
- Farmers register via **Telegram in 5 steps** — no app, no bank account required
- If a farmer has no Hedera wallet, the **bot creates one automatically** via `AccountCreateTransaction`
- **4-layer anti-fraud**: parcel deduplication (SHA256), 30-day carencia period, GPS verification, coverage cap
- **3-tier capital pool**: NGOs absorb first losses, ESG investors earn ~8% yield, farmer premiums flow continuously
- Every registration, climate event, payout and dispute is **verifiable on Hedera**

---

## Live Contracts (Hedera Testnet)

| Component | ID | HashScan |
|---|---|---|
| Core Contract (RainSafe.sol) | `0.0.8329786` | [View](https://hashscan.io/testnet/contract/0.0.8329786) · [Account/Balance](https://hashscan.io/testnet/account/0.0.8329786) |
| Pool Contract (RainSafePool.sol) | `0.0.8329792` | [View](https://hashscan.io/testnet/contract/0.0.8329792) |
| HCS Topic (Farm 0) | `0.0.8329793` | [Messages](https://hashscan.io/testnet/topic/0.0.8329793) |
| HCS Topic (Farm 1) | `0.0.8329794` | [Messages](https://hashscan.io/testnet/topic/0.0.8329794) |
| HCS Topic (Farm 2) | `0.0.8329795` | [Messages](https://hashscan.io/testnet/topic/0.0.8329795) |
| Deployer Account | `0.0.8319187` | [View](https://hashscan.io/testnet/account/0.0.8319187) |

**Core contract balance: 200 HBAR** — funded and ready to pay drought claims.

---

## Live Demo

| | URL |
|---|---|
| Dashboard (6 tabs) | [rainsafe-frontend.vercel.app](https://rainsafe-frontend.vercel.app) |
| Telegram Bot | [@RainSafeHedera_bot](https://t.me/RainSafeHedera_bot) — ES · EN · PT |
| Landing Page | [jhontejada95.github.io/rainsafe](https://jhontejada95.github.io/rainsafe) |

---

## How It Works

```
Farmer (Telegram)
  │  /register → 5 steps → bot creates wallet if needed
  │  registerFarmOnChain() ──────────────────────────────► Hedera Contract 0.0.8329786
  │  recordClimateEventHCS() ───────────────────────────► HCS Topic 0.0.8329793
  │  POST /api/farms ───────────────────────────────────► server.js → farms.json
  │                                                            │
  └─────────────────────────── React Dashboard ◄──────────── polls /api/farms every 10s

Open-Meteo API (free, no key)
  │  → monitor.js runs every 6h
  │  → drought detected (<5mm/7d) → updateFarmWeather() → farms.json
  │  → recordClimateEventHCS() ──────────────────────────► HCS topic
  │  → triggerClimateEvent() ────────────────────────────► Contract 0.0.8329786
  │  → recordPayout() ──────────────────────────────────► payouts.json
  └─────────────────────────── React Dashboard ◄──────────── /api/payouts

NGO / ESG Investor (MetaMask, Chrome, chainId 296)
  │  fundAsONG() / depositAsInvestor() ─────────────────► Pool Contract 0.0.8329792
  └  claimYield() ──────────────────────────────────────► Pool Contract 0.0.8329792

Farmer (Dispute)
  │  Dashboard → Disputes tab → submit form
  └  raiseDispute() ────────────────────────────────────► Contract 0.0.8329786 + HCS
```

---

## Testing the Project (For Judges)

### Option A — No setup needed (recommended)

1. **Register a farm via Telegram:** open [@RainSafeHedera_bot](https://t.me/RainSafeHedera_bot), type `/register`, follow the 5 steps. You'll receive a HashScan link with the real on-chain transaction.

2. **Watch the dashboard:** [rainsafe-frontend.vercel.app](https://rainsafe-frontend.vercel.app) — the farm appears within seconds. Dashboard shows real rainfall data from Open-Meteo.

3. **Fund the insurance pool:** open the **Insurance Pool** tab on the dashboard. Connect MetaMask (Chrome, import the key below, configure Hedera Testnet). Click `Fund as NGO` or `Deposit as Investor`.

4. **Raise a dispute:** open the **Disputes** tab, select a farm, describe the issue, submit. The TX is recorded on-chain and appears on HashScan.

5. **Verify everything on HashScan:**
   - Core contract: [hashscan.io/testnet/account/0.0.8329786](https://hashscan.io/testnet/account/0.0.8329786)
   - HCS messages: [hashscan.io/testnet/topic/0.0.8329793](https://hashscan.io/testnet/topic/0.0.8329793)

### MetaMask setup (for Insurance Pool tab)

> Use **Chrome** only — Brave intercepts `window.ethereum`.

1. Install [MetaMask](https://metamask.io)
2. Add network manually:
   - Network name: `Hedera Testnet`
   - RPC URL: `https://testnet.hashio.io/api`
   - Chain ID: `296`
   - Currency: `HBAR`
   - Explorer: `https://hashscan.io/testnet`
3. Import the deployer account using the private key in `.env` → `HEDERA_PRIVATE_KEY`
   *(This account has ~600 HBAR on testnet for testing)*

### Option B — Run locally

**Requirements:** Node.js ≥ 18, npm, a Telegram account.

```bash
git clone https://github.com/jhontejada95/rainsafe
cd rainsafe
npm install
cd frontend && npm install && cd ..
```

Copy `.env.example` to `.env`. The deployed contract IDs are already pre-filled — you only need:
```
HEDERA_ACCOUNT_ID=    # your Hedera testnet account (portal.hedera.com)
HEDERA_PRIVATE_KEY=   # ECDSA private key
TELEGRAM_BOT_TOKEN=   # from @BotFather (optional — only needed to run your own bot instance)
```

> **Note:** You can skip `TELEGRAM_BOT_TOKEN` and test via the live bot [@RainSafeHedera_bot](https://t.me/RainSafeHedera_bot). You only need a Hedera account to call the contracts.

Run all services:
```bash
# Terminal 1 — API server
npm run server

# Terminal 2 — Telegram bot (optional if using live bot)
npm run bot

# Terminal 3 — Frontend
npm run dev

# Terminal 4 — Climate monitor (optional — runs one cycle then waits 6h)
npm run agent
```

Open [localhost:5173](http://localhost:5173).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         HEDERA TESTNET                          │
│  ┌──────────────────┐    ┌──────────────────┐                  │
│  │ RainSafe.sol     │    │ RainSafePool.sol  │                  │
│  │ 0.0.8329786      │    │ 0.0.8329792       │                  │
│  │ · registerFarm   │    │ · fundAsONG()     │                  │
│  │ · triggerEvent   │    │ · depositInvestor │                  │
│  │ · raiseDispute   │    │ · claimYield()    │                  │
│  │ · 3% protocol fee│    │ · 8% annual yield │                  │
│  │ · 30-day carencia│    └──────────────────┘                  │
│  └──────────────────┘                                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ HCS Topics: 0.0.8329793 · 0.0.8329794 · 0.0.8329795    │   │
│  │ Immutable log: registrations, climate events, disputes   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         ▲                              ▲
         │ Hedera SDK                   │ MetaMask + ethers.js
┌────────┴──────────┐        ┌──────────┴────────────┐
│  Node.js Backend  │        │   React Frontend       │
│  · server.js      │◄──────►│   Vercel deployment    │
│  · bot.js         │        │   6 dashboard tabs     │
│  · monitor.js     │        └───────────────────────┘
│  · hedera.js      │
└───────────────────┘
         ▲
         │ HTTP (no API key)
┌────────┴──────────┐
│  Open-Meteo API   │
│  Real rainfall    │
│  historical + now │
└───────────────────┘
```

---

## Anti-Fraud System

| Layer | Mechanism | Where |
|---|---|---|
| C1 — Parcel Deduplication | SHA256 hash of GPS grid cell — same location can't register twice | `registerFarm()` in Solidity |
| C2 — Carencia Period | 30-day waiting period before coverage activates | `coverageActive` modifier |
| C3 — GPS Photo | Optional photo submitted during Telegram registration | `bot.js` + HCS |
| C4 — Coverage Cap | Maximum 200 HBAR per farm | `MAX_COVERAGE_TINYBARS` in Solidity |

---

## Business Model

| Revenue Stream | Rate | Mechanism |
|---|---|---|
| Protocol fee | 3% | On every registration and payout — enforced on-chain |
| Yield spread | 4% | Protocol earns the difference between pool returns and 8% paid to investors |
| Climate data API | Future | Real-time risk scoring API for banks and NGOs (Phase 2) |
| White label | Future | License protocol to agricultural cooperatives (Phase 3) |

The 3% fee is deducted automatically in `RainSafe.sol` — verifiable in every payout transaction.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Blockchain | Hedera (HTS + HCS + Smart Contracts) |
| Smart Contracts | Solidity 0.8.20 |
| Climate Data | Open-Meteo API (free, no key required) |
| Backend | Node.js + Express |
| Telegram Bot | node-telegram-bot-api |
| Frontend | React + Vite + ethers.js |
| Hosting | Vercel (frontend) + GitHub Pages (landing) |
| Wallet Integration | MetaMask (chainId 296) |

---

## Project Structure

```
rainsafe/
├── agent/
│   ├── bot.js          # Telegram bot — registration, disputes, multilingual (ES/EN/PT)
│   ├── hedera.js       # Hedera SDK client — all on-chain calls
│   ├── monitor.js      # 6-hour loop — checks weather, triggers payouts
│   └── weather.js      # Open-Meteo API client
├── contracts/
│   ├── RainSafe.sol        # Core insurance contract
│   ├── RainSafePool.sol    # 3-tier capital pool contract
│   ├── RainSafe.abi.json   # ABI for SDK calls
│   └── RainSafePool.abi.json
├── frontend/
│   └── src/
│       └── components/
│           ├── Dashboard.jsx       # Farm monitoring cards
│           ├── RegisterFarm.jsx    # On-chain farm registration
│           ├── ClimateScore.jsx    # Resilience scores
│           ├── PayoutHistory.jsx   # Payout log
│           ├── PoolDashboard.jsx   # Insurance pool + MetaMask
│           └── DisputeCenter.jsx   # Dispute submission
├── scripts/
│   ├── deploy-v2.js        # Deploy both contracts + create HCS topics
│   └── fund-contract.js    # Fund deployed contracts with HBAR
├── data/
│   ├── farms.json      # Farm registry (updated by bot + monitor)
│   ├── payouts.json    # Payout history (written by monitor on drought events)
│   └── disputes.json   # Dispute log
├── server.js           # Express API — bridges bot, monitor, and dashboard
└── .env.example        # All required environment variables
```

---

## Roadmap

| Phase | Status | Description |
|---|---|---|
| MVP | **Live** | Telegram registration, auto-payout, dispute mechanism, insurance pool, multilingual |
| Phase 2 | Planned | Actuarial threshold calibration per region, mainnet deployment |
| Phase 3 | Planned | IoT sensor integration (eliminates basis risk) |
| Phase 4 | Planned | Reinsurance layer for correlated events |
| Phase 5 | Planned | DAO governance for dispute resolution |
| Phase 6 | Planned | Multi-country expansion, white-label API, carbon credit integration |

---

## Honest Limitations

- **Basis risk**: Open-Meteo provides grid-level data (~1km²) — microclimate variation may affect accuracy. Mitigated in Phase 3 with IoT sensors.
- **Thresholds not regionally calibrated**: 5mm/7d and 150mm/24h are global defaults. Phase 2 will calibrate per crop type and region.
- **Testnet only**: All transactions are on Hedera Testnet. Mainnet deployment is Phase 2.
- **Payout recipient**: In the MVP, payouts go to the deployer account (Solidity `farm.owner = msg.sender`). The `walletAddress` field is metadata. For production: redeploy using `walletAddress` as payout destination.
- **Premium payment**: Farmer-side `payPremium()` via MetaMask reverts on testnet due to internal fee transfer. Farmers pay premiums via Telegram bot flow instead.
- **Dispute resolution**: Manual review in MVP. Phase 5 introduces DAO voting.

---

## Stakeholder Workflows

### Farmer
1. Open Telegram → `/register`
2. Enter farm name, GPS location, coverage amount (HBAR), optional photo
3. If no wallet: bot calls `AccountCreateTransaction` → sends credentials via Telegram
4. `registerFarmOnChain()` → Hedera Contract → HCS record
5. Coverage activates after 30-day carencia
6. Drought detected → `triggerClimateEvent()` → payout sent automatically
7. If unhappy with result → `/dispute` or Dashboard → Disputes tab

### NGO / Grant Funder
1. Open Dashboard → Insurance Pool tab
2. Connect MetaMask (Chrome, Hedera Testnet, chainId 296)
3. Click `Fund as NGO` → confirm transaction → funds enter Tier 1 (first-loss)
4. Receive verifiable on-chain impact report via HCS

### ESG Investor
1. Connect MetaMask → `Deposit as Investor` → funds enter Tier 2
2. Earns ~8% annual yield from unclaimed premiums
3. Click `Claim Yield` → yield transferred to wallet

### Protocol Monitor (Automated)
1. `monitor.js` runs every 6 hours
2. Reads registered farms from farms.json
3. Queries Open-Meteo for 7-day rainfall history
4. If drought detected: records on HCS → calls `triggerClimateEvent()` → writes payout to payouts.json
5. Computes resilience score (0–100) → updates on-chain via `updateResilienceScore()`

### Arbitrator (Phase 5: DAO)
1. Farmer submits dispute via Dashboard or `/dispute` bot command
2. `raiseDispute()` called on-chain → immutable HCS record
3. MVP: manual review within 3 business days
4. Phase 5: community DAO votes on-chain

---

> Built on Hedera · Powered by Open-Meteo · Hedera Hello Future Apex 2026
>
> *No paperwork. No banks. No intermediaries.*
