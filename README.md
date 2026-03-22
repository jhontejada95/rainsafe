# 🌧️ RainSafe
### Parametric Climate Insurance for Smallholder Farmers on Hedera

> **Hedera Hello Future Apex Hackathon 2026 — Sustainability Track**

[![Live Dashboard](https://img.shields.io/badge/Dashboard-Live-22c55e)](https://rainsafe-frontend.vercel.app)
[![Telegram Bot](https://img.shields.io/badge/Bot-@RainSafeHedera__bot-229ED9)](https://t.me/RainSafeHedera_bot)
[![Hedera Testnet](https://img.shields.io/badge/Hedera-Testnet-8B5CF6)](https://hashscan.io/testnet/contract/0.0.8324803)
[![Landing Page](https://img.shields.io/badge/Landing-GitHub%20Pages-black)](https://jhontejada95.github.io/rainsafe)

---

## The Problem

500 million smallholder farmers worldwide have **zero climate protection**. Traditional insurance takes 4–6 months to pay out — long after the farmer needed the money. Most farmers don't even try.

**RainSafe changes this.** When rainfall drops below 5mm in 7 days, the payout happens automatically. No adjusters. No paperwork. No banks.

---

## Live Deployment

| Component | URL |
|---|---|
| 🤖 Telegram Bot | [@RainSafeHedera_bot](https://t.me/RainSafeHedera_bot) — ES · EN · PT |
| 📊 Dashboard | [rainsafe-frontend.vercel.app](https://rainsafe-frontend.vercel.app) |
| 🌐 Landing Page | [jhontejada95.github.io/rainsafe](https://jhontejada95.github.io/rainsafe) |
| 🔗 Core Contract v2 | [0.0.8324803](https://hashscan.io/testnet/contract/0.0.8324803) |
| 🔗 Pool Contract v2 | [0.0.8324807](https://hashscan.io/testnet/contract/0.0.8324807) |
| 📝 HCS Topics | 0.0.8324808 · 0.0.8324810 · 0.0.8324811 |

---

## Architecture

```
Farmer → Telegram Bot (ES/EN/PT)
              ↓ registerFarmOnChain() → Hedera Contract 0.0.8324803
              ↓ recordClimateEventHCS() → HCS Topic 0.0.8324808
              ↓ POST /api/farms → Express API (server.js :3001)
              ↓ farms.json
         React Dashboard (Vercel) ← polls /api/farms every 10s

Open-Meteo API → monitor.js (6h loop, reads real farms from farms.json)
              ↓ drought/flood detected (< 5mm / 7 days)
         HCS Topic record (tamper-proof)
              ↓ triggerClimateEvent() → Contract 0.0.8324803
         Smart Contract → 3% fee → treasury
                       → 97% net → farmer wallet

Dispute flow:
         Dashboard/Bot → POST /api/disputes
              ↓ raiseDispute() → Hedera (emits on-chain event)
              ↓ persisted to disputes.json
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
Investors receive 8% annual yield.
RainSafe negotiates 12% from DeFi protocols → 4% spread = protocol revenue.

**C. Climate Data API (Phase 2)**
Tamper-proof on-chain climate events → B2B data layer for governments, NGOs, insurers.

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
5. HashPack wallet (`0.0.XXXXXXX`) or EVM address

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
| Blockchain | Hedera Hashgraph | Smart contracts, HCS, carbon-negative |
| Climate Data | Open-Meteo API | Free, global, real-time rainfall |
| Bot | Telegram Bot API | Zero-friction onboarding (ES/EN/PT) |
| Smart Contracts | Solidity + HSCS | Automated payouts, pool, fees |
| Frontend | React + Vite | Real-time dashboard |
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
- Multilingual dashboard
- Smart contract payouts on Hedera testnet

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
# Fill credentials

# Deploy contracts (v2 — fee + carencia)
node scripts/deploy-v2.js

# Run all services
node server.js          # Terminal 1 — API :3001
node agent/bot.js       # Terminal 2 — Telegram bot
node agent/monitor.js   # Terminal 3 — Climate monitor
cd frontend && npm run dev  # Terminal 4 — Dashboard :3000
```

---

## Project Structure

```
rainsafe/
├── agent/
│   ├── bot.js          # Multilingual Telegram bot (ES/EN/PT) + disputes
│   ├── monitor.js      # Climate monitoring agent (6h loop)
│   ├── weather.js      # Open-Meteo API client
│   └── hedera.js       # Hedera SDK client
├── contracts/
│   ├── RainSafe.sol    # Core contract v2 (3% fee, 30d carencia, disputes)
│   └── RainSafePool.sol # Pool contract v2 (3-tier, fee, yield)
├── frontend/src/
│   ├── App.jsx         # Main app (6 tabs, protocol banner)
│   └── components/
│       ├── Dashboard.jsx
│       ├── PoolDashboard.jsx   # Pool + fee breakdown
│       ├── DisputeCenter.jsx   # Dispute filing + tracking
│       ├── ClimateScore.jsx
│       ├── PayoutHistory.jsx   # Shows gross/net/fee per payout
│       └── RegisterFarm.jsx
├── scripts/
│   └── deploy-v2.js    # Deploy both contracts + HCS topics
├── server.js           # Express API
├── index.html          # Landing page (GitHub Pages)
└── .env.example
```

---

## Real-World Validation

**Finca San Antonio, Salento, Colombia** (4.585518, -75.640176) — Real farm registered during development. Current rainfall: 37.1mm/7d → NORMAL ✅

**Finca El Progreso, Bogotá, Colombia** (4.711, -74.0721) — Demo farm in drought zone. Current rainfall: 2.3mm/7d → DROUGHT ALERT 🚨

**Parcela San Miguel, Oaxaca, México** (17.0732, -96.7266) — Demo farm. Current rainfall: 0.5mm/7d → DROUGHT ALERT 🚨

---

*Built on Hedera · Powered by Open-Meteo · Hedera Hello Future Apex 2026*
*Sin papeles. Sin bancos. Sin intermediarios.*
