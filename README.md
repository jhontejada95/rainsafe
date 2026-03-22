# 🌧️ RainSafe
### Parametric Climate Insurance for Smallholder Farmers on Hedera

> **Hedera Hello Future Apex Hackathon 2026 — Sustainability Track**

[![Live Dashboard](https://img.shields.io/badge/Dashboard-Live-22c55e)](https://rainsafe-frontend.vercel.app)
[![Telegram Bot](https://img.shields.io/badge/Bot-@RainSafeHedera__bot-229ED9)](https://t.me/RainSafeHedera_bot)
[![Hedera Testnet](https://img.shields.io/badge/Hedera-Testnet-8B5CF6)](https://hashscan.io/testnet/contract/0.0.8329786)
[![Landing Page](https://img.shields.io/badge/Landing-GitHub%20Pages-black)](https://jhontejada95.github.io/rainsafe)

---

## The Problem

**500 million smallholder farmers worldwide have zero climate protection.**

When drought hits, a farmer loses their entire season. Traditional insurance:
- Takes **4–6 months** to pay out — long after the farmer needed the money
- Requires adjusters, paperwork, bank accounts, and legal documentation
- Is **inaccessible** to the unbanked majority of rural farmers worldwide
- Covers less than **3% of agricultural losses** in developing countries

The result: farmers take on debt, sell assets, or abandon their land. Climate change makes this worse every year, yet the financial tools haven't changed in decades.

## Our Solution

**RainSafe is parametric climate insurance that pays automatically — no paperwork, no banks, no waiting.**

When rainfall drops below 5mm in 7 consecutive days, the smart contract triggers a payout directly to the farmer's wallet. The trigger is objective (Open-Meteo weather API), immutable (recorded on Hedera Consensus Service), and instant (Hedera finalizes in 3–5 seconds).

**Key innovations:**
- **Automatic payouts**: no human in the loop between weather event and payment
- **Zero-friction onboarding**: farmers register via Telegram in their language (ES/EN/PT) — no app, no bank account required
- **Auto wallet creation**: if a farmer has no Hedera wallet, the bot creates one automatically via `AccountCreateTransaction` and sends credentials via Telegram
- **4-layer anti-fraud**: parcel deduplication (SHA256 grid), 30-day carencia, GPS photo verification, coverage area limit
- **3-tier capital pool**: NGOs (first loss), ESG investors (yield), farmer premiums (continuous flow)
- **On-chain everything**: registrations, climate events, payouts, and disputes are all verifiable on Hedera

---

## Live Deployment

| Component | URL |
|---|---|
| 🤖 Telegram Bot | [@RainSafeHedera_bot](https://t.me/RainSafeHedera_bot) — ES · EN · PT |
| 📊 Dashboard | [rainsafe-frontend.vercel.app](https://rainsafe-frontend.vercel.app) |
| 🌐 Landing Page | [jhontejada95.github.io/rainsafe](https://jhontejada95.github.io/rainsafe) |
| 🔗 Core Contract v3 | [0.0.8329786](https://hashscan.io/testnet/contract/0.0.8329786) |
| 🔗 Pool Contract v3 | [0.0.8329792](https://hashscan.io/testnet/contract/0.0.8329792) |
| 📝 HCS Topics | 0.0.8329793 · 0.0.8329794 · 0.0.8329795 |

---

## Architecture

```
Farmer → Telegram Bot (@RainSafeHedera_bot, ES/EN/PT)
              ↓ registerFarmOnChain() → Hedera Contract 0.0.8329786
              ↓ recordClimateEventHCS() → HCS Topic 0.0.8329793
              ↓ POST /api/farms → Express API (server.js :3001)
              ↓ data/farms.json
         React Dashboard (Vercel) ← polls /api/farms every 10s

Open-Meteo API → monitor.js (6h loop, reads real farms from farms.json)
              ↓ drought detected (< 5mm / 7 days)
         HCS Topic record (tamper-proof)
              ↓ triggerClimateEvent() → Contract 0.0.8329786
         Smart Contract → 3% fee → treasury
                       → 97% net → farm.payoutAddress (farmer's wallet)

Dispute flow:
         Dashboard/Bot → POST /api/disputes
              ↓ raiseDispute() → Hedera (emits on-chain event)
              ↓ persisted to data/disputes.json

Pool flow:
         MetaMask (chainId 296) → ethers.js → Pool Contract 0.0.8329792
              ↓ fundAsONG() / depositAsInvestor() / claimYield() / payPremium()
```

---

## Anti-Fraud System (4 Layers)

| Layer | Name | Description |
|---|---|---|
| **C1** | Parcel Deduplication | SHA256 hash to ~111m grid. One parcel = one policy. Permanent on HCS. |
| **C2** | 30-day Carencia | Industry standard waiting period. Can't register during active drought. |
| **C3** | GPS Photo Verification | Photo must be taken within 1km of registered farm. |
| **C4** | Coverage Area Limit | Max 200 HBAR per registration. |

---

## Business Model

### Protocol Fee: 3% on all transactions (on-chain)

```
Farmer pays 10 HBAR premium
  → 0.30 HBAR to protocol treasury  (3% fee)
  → 9.70 HBAR to insurance pool     (97% net)

Drought payout: 100 HBAR gross
  → 3.00 HBAR to protocol treasury  (3% fee)
  → 97.00 HBAR to farmer wallet     (97% net)
```

### Revenue Streams

**A. Management Fee (live on-chain)**
3% of all premiums automatically collected by smart contract.
1,000 farmers × 10 HBAR/month = 300 HBAR/month (~$28 USD at current price).

**B. Yield Spread**
Investors receive 8% annual yield. RainSafe negotiates 12% from DeFi protocols → 4% spread = protocol revenue.

**C. Climate Data API (Phase 2)**
Tamper-proof on-chain climate events → B2B data layer for governments, NGOs, and insurers.

**D. White Label Infrastructure (Phase 3)**
Cooperatives and microfinance institutions deploy their own pools via RainSafe.

---

## Insurance Pool (3-tier capital structure)

```
Tier 1 — ONGs & Grants (First Loss)
  → Absorb first claims
  → No financial return
  → On-chain impact reports via HCS

Tier 2 — ESG Investors (Mezzanine)
  → ~8% annual yield from unclaimed premiums
  → Capital earns DeFi yield while waiting
  → claimYield() function on-chain

Tier 3 — Farmer Premiums (Continuous Flow)
  → 10% of coverage amount
  → Automatic, on-chain, predictable
  → 3% fee deducted at source
```

### Actuarial Basis
At 15–20% annual drought frequency (CGIAR standard for semi-arid Latin America), a pool of 100 farmers paying 10 HBAR/month generates 1,000 HBAR/month. Expected annual payouts: 150–200 HBAR. Pool is actuarially sound.

---

## Multilingual Telegram Bot (ES · EN · PT)

The bot auto-detects language from Telegram's `language_code` and supports manual selection at `/start`:

| Command | ES | EN | PT |
|---|---|---|---|
| Register | `/registrar` | `/register` | `/registrar` |
| Status | `/estado` | `/status` | `/estado` |
| Dispute | `/disputa` | `/dispute` | `/disputa` |
| Help | `/ayuda` | `/help` | `/ajuda` |

### 5-Step Registration Flow
1. Farm name
2. Location (Google Maps link / pin / coordinates)
3. Coverage: 50 / 100 / 200 HBAR
4. GPS photo verification
5. HashPack wallet (`0.0.XXXXXXX`) or EVM address — **auto-created if none** via `AccountCreateTransaction`

---

## Dispute Resolution

Farmers can raise disputes via `/disputa` command or the web dashboard. All disputes are:
- Recorded permanently on Hedera Consensus Service
- Queued for community arbitrator review (Phase 5: DAO governance)
- Resolved within 3 business days (MVP: manual; Phase 5: on-chain voting)

---

## Technology Stack

| Component | Technology | Purpose |
|---|---|---|
| Blockchain | Hedera Hashgraph | Smart contracts (HSCS), HCS, carbon-negative |
| Climate Data | Open-Meteo API | Free, global, real-time rainfall |
| Bot | Telegram Bot API | Zero-friction onboarding (ES/EN/PT) |
| Smart Contracts | Solidity + HSCS | Automated payouts, pool, fees |
| Frontend | React + Vite | Real-time dashboard (6 tabs) |
| Backend | Express.js | Farm registry API |
| Deployment | Vercel + GitHub Pages | Dashboard + landing |

---

## Roadmap

### ✅ MVP (Current — Hackathon)
- Telegram bot in ES/EN/PT
- Real climate data (Open-Meteo)
- 4-layer anti-fraud (C1+C2+C3+C4)
- 3% protocol fee on-chain
- 30-day carencia period (industry standard)
- 3-tier insurance pool
- Dispute mechanism (on-chain record)
- Multilingual dashboard (6 tabs)
- Smart contract payouts on Hedera testnet
- Auto wallet creation for unbanked farmers (`AccountCreateTransaction`)
- Payouts sent directly to farmer wallet via dedicated `payoutAddress` field in contract

### 🔄 Phase 2 — Actuarial Calibration
- Historical drought analysis by region (10-year data)
- Dynamic threshold adjustment per geography
- Mainnet deployment

### 🔄 Phase 3 — Basis Risk Reduction
- Neuron DePIN IoT sensor integration
- Sub-kilometer drought detection

### 🔄 Phase 4 — Reinsurance Layer
- On-chain reinsurance for catastrophic regional events
- Cross-pool risk sharing

### 🔄 Phase 5 — DAO Governance
- On-chain dispute resolution via DAO
- Community arbitrators elected by HBAR stakers

### 🔄 Phase 6 — Scale
- Multi-language (French, Swahili)
- White label for cooperatives
- Carbon credit integration

---

## Honest Limitations

| Limitation | Mitigation |
|---|---|
| Basis risk: grid rainfall ≠ farm rainfall | Phase 3 IoT |
| Actuarial threshold not regionally calibrated | Phase 2 |
| No reinsurance for correlated events | Phase 4 |
| Dispute resolution is manual (MVP) | Phase 5 DAO |
| Testnet only | Phase 2 mainnet |

---

## Local Setup

```bash
git clone https://github.com/jhontejada95/rainsafe.git
cd rainsafe
npm install
cd frontend && npm install && cd ..
cp .env.example .env
# Fill in your credentials (see .env.example)

# Contracts already deployed on testnet — skip deploy unless redeploying
# node scripts/deploy-v2.js

# Run all services
node server.js              # Terminal 1 — API :3001
node agent/bot.js           # Terminal 2 — Telegram bot
node agent/monitor.js       # Terminal 3 — Climate monitor (optional)
cd frontend && npm run dev  # Terminal 4 — Dashboard :3000
```

**Demo without credentials:** The dashboard at [rainsafe-frontend.vercel.app](https://rainsafe-frontend.vercel.app) works without any setup. The Telegram bot [@RainSafeHedera_bot](https://t.me/RainSafeHedera_bot) is live and functional.

---

## Project Structure

```
rainsafe/
├── agent/
│   ├── bot.js          # Multilingual Telegram bot (ES/EN/PT) + disputes + auto wallet
│   ├── monitor.js      # Climate monitoring agent (6h loop)
│   ├── weather.js      # Open-Meteo API client
│   └── hedera.js       # Hedera SDK (registerFarm, payout, HCS, createWallet)
├── contracts/
│   ├── RainSafe.sol    # Core contract v3 (3% fee, 30d carencia, payoutAddress, disputes)
│   └── RainSafePool.sol # Pool contract v3 (3-tier, fee, yield)
├── data/
│   ├── farms.json      # Farm registry (persisted by server.js + monitor.js)
│   ├── payouts.json    # Payout history
│   └── disputes.json   # Dispute log
├── frontend/src/
│   ├── App.jsx         # Main app (6 tabs, protocol banner, multilingual)
│   └── components/
│       ├── Dashboard.jsx       # Farm cards with real-time weather
│       ├── PoolDashboard.jsx   # Pool + MetaMask + fee breakdown
│       ├── DisputeCenter.jsx   # Dispute filing + tracking
│       ├── ClimateScore.jsx    # Resilience score per farm
│       ├── PayoutHistory.jsx   # Gross/net/fee per payout
│       └── RegisterFarm.jsx    # Farm registration form
├── scripts/
│   ├── deploy-v2.js    # Deploy both contracts + HCS topics
│   ├── fund-contract.js # Fund contracts with HBAR
│   └── update-ids.js   # Post-deploy: sync contract IDs across all files
├── server.js           # Express API (:3001)
├── index.html          # Landing page (GitHub Pages)
├── vercel.json         # Vercel config (serves frontend/dist)
└── .env.example        # All required environment variables
```

---

## Real-World Validation

**Finca San Antonio, Salento, Colombia** (4.585518, -75.640176) — Real farm registered on-chain during development. TX verifiable on HashScan. Current rainfall: 37.1mm/7d → NORMAL ✅

**Finca El Progreso, Bogotá, Colombia** (4.711, -74.0721) — Demo farm in drought zone. Current rainfall: 2.3mm/7d → DROUGHT ALERT 🚨

**Parcela San Miguel, Oaxaca, México** (17.0732, -96.7266) — Demo farm. Current rainfall: 0.5mm/7d → DROUGHT ALERT 🚨

---

*Built on Hedera · Powered by Open-Meteo · Hedera Hello Future Apex 2026*
*Sin papeles. Sin bancos. Sin intermediarios.*
