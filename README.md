# RainSafe
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
- **Auto wallet creation**: if a farmer has no Hedera wallet, the bot creates one via `AccountCreateTransaction` and sends credentials via Telegram
- **4-layer anti-fraud**: parcel deduplication (SHA256 grid), 30-day waiting period, GPS photo verification, coverage area limit
- **3-tier capital pool**: NGOs (first loss), ESG investors (yield), farmer premiums (continuous flow)
- **On-chain everything**: registrations, climate events, payouts, and disputes are all verifiable on Hedera

---

## Live Deployment

| Component | URL |
|---|---|
| Telegram Bot | [@RainSafeHedera_bot](https://t.me/RainSafeHedera_bot) — ES · EN · PT |
| Dashboard | [rainsafe-frontend.vercel.app](https://rainsafe-frontend.vercel.app) |
| Landing Page | [jhontejada95.github.io/rainsafe](https://jhontejada95.github.io/rainsafe) |
| Core Contract | [0.0.8329786](https://hashscan.io/testnet/contract/0.0.8329786) |
| Pool Contract | [0.0.8329792](https://hashscan.io/testnet/contract/0.0.8329792) |
| HCS Topics | 0.0.8329793 · 0.0.8329794 · 0.0.8329795 |

---

## Stakeholder Workflows

### Farmer

```
1. Open Telegram → @RainSafeHedera_bot
2. /register (ES) · /register (EN) · /registrar (PT)
3. Provide: farm name → location (Maps link or coordinates) → coverage (50/100/200 HBAR) → GPS photo → wallet
   └─ No wallet? Bot calls AccountCreateTransaction → creates Hedera account → sends credentials via Telegram
4. Bot calls registerFarmOnChain() → TX recorded on Hedera Contract 0.0.8329786
5. Bot calls recordClimateEventHCS() → registration logged on HCS Topic 0.0.8329793
6. Farm appears on dashboard within 10 seconds

Drought detected (monitor runs every 6h):
   Open-Meteo API → rainfall < 5mm / 7 days
   → HCS record (tamper-proof climate event)
   → triggerClimateEvent() → Contract 0.0.8329786
   → 3% fee to protocol treasury
   → 97% net HBAR → farmer's payoutAddress
   → Farmer receives payout in 3–5 seconds. No action required.

Dispute a payout:
   /dispute in Telegram bot OR Disputes tab in dashboard
   → POST /api/disputes → raiseDispute() → Hedera (on-chain record)
   → Reviewed within 3 business days
```

---

### NGO / Grant Funder

```
1. Open dashboard → Insurance Pool tab
2. Connect MetaMask (Chrome) → Hedera Testnet (chainId 296)
   Network: https://testnet.hashio.io/api
3. Click fundAsONG() → confirm in MetaMask (10 HBAR default)
4. TX confirmed on Hedera → funds enter Tier 1 (first-loss tranche)
5. On-chain impact report generated via HCS: farmers protected, payouts executed
6. View TX on HashScan: hashscan.io/testnet/contract/0.0.8329792

Role in the pool:
   Tier 1 absorbs first claims → NGO capital is used before ESG investor capital
   Impact score increments on-chain every time a payout is executed
   No financial return — impact reporting only
```

---

### ESG Investor

```
1. Open dashboard → Insurance Pool tab
2. Connect MetaMask (Chrome) → Hedera Testnet (chainId 296)
3. Click depositAsInvestor() → confirm in MetaMask (10 HBAR default)
4. TX confirmed → funds enter Tier 2 (mezzanine tranche)
5. Capital earns ~8% annual yield from unclaimed premiums
6. Click claimYield() at any time to withdraw accrued yield

Yield calculation (on-chain):
   elapsed = current_time - last_claim
   annual_yield = deposit × 8%
   yield = annual_yield × elapsed / 365 days
   → Paid directly to investor wallet via claimYield()
```

---

### Protocol Monitor (Automated)

```
Runs every 6 hours via monitor.js:

1. Reads farms.json (all registered farms with coordinates)
2. For each farm → Open-Meteo API: total rainfall last 7 days
3. Updates farms.json with current weather status
4. If rainfall < 5mm:
   a. Logs climate event to HCS (tamper-proof)
   b. Calls triggerClimateEvent() on Contract 0.0.8329786
   c. Contract pays 97% net to farm.payoutAddress
   d. Records payout in payouts.json
5. Dashboard reflects updated status within 10s

Manual trigger: node agent/monitor.js
```

---

### Arbitrator (Manual — MVP)

```
Disputes are filed via:
   - Telegram: /dispute command
   - Dashboard: Disputes tab → fill form → Submit

Each dispute is:
   1. Sent to POST /api/disputes on server.js
   2. raiseDisputeOnChain() called → emits event on Hedera
   3. Stored in data/disputes.json

Arbitrator reviews:
   - HCS record of the climate event in question
   - Farm registration data on Contract 0.0.8329786
   - Dispute reason submitted by farmer
   → Manual resolution in MVP. Phase 5: DAO voting by HBAR stakers.
```

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

NGO / Investor → MetaMask (Chrome, chainId 296) → ethers.js
              ↓ fundAsONG() / depositAsInvestor() / claimYield()
         Pool Contract 0.0.8329792

Dispute flow:
         Dashboard/Bot → POST /api/disputes
              ↓ raiseDisputeOnChain() → Hedera (on-chain event)
              ↓ data/disputes.json
```

---

## Anti-Fraud System (4 Layers)

| Layer | Name | Description |
|---|---|---|
| **C1** | Parcel Deduplication | SHA256 hash to ~111m grid. One parcel = one policy. Permanent on HCS. |
| **C2** | 30-day Waiting Period | Industry standard. Can't register during active drought. |
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
1,000 farmers × 10 HBAR/month = 300 HBAR/month.

**B. Yield Spread**
Investors receive 8% annual yield. RainSafe negotiates 12% from DeFi protocols → 4% spread = protocol revenue.

**C. Climate Data API (Phase 2)**
Tamper-proof on-chain climate events → B2B data layer for governments, NGOs, and insurers.

**D. White Label Infrastructure (Phase 3)**
Cooperatives and microfinance institutions deploy their own pools via RainSafe.

---

## Insurance Pool (3-tier capital structure)

```
Tier 1 — NGOs & Grants (First Loss)
  → Absorb first claims
  → No financial return
  → On-chain impact reports via HCS

Tier 2 — ESG Investors (Mezzanine)
  → ~8% annual yield from unclaimed premiums
  → Capital earns yield while waiting
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
5. Hedera wallet (`0.0.XXXXXXX`) or EVM address — **auto-created if none** via `AccountCreateTransaction`

---

## Dispute Resolution

Farmers can raise disputes via `/dispute` command or the web dashboard. All disputes are:
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
| Wallet | MetaMask + ethers.js | Pool interactions (Chrome, chainId 296) |
| Deployment | Vercel + GitHub Pages | Dashboard + landing |

---

## Roadmap

### ✅ MVP (Current — Hackathon)
- Telegram bot in ES/EN/PT
- Real climate data (Open-Meteo)
- 4-layer anti-fraud (C1+C2+C3+C4)
- 3% protocol fee on-chain
- 30-day waiting period (industry standard)
- 3-tier insurance pool with real on-chain transactions
- Dispute mechanism (on-chain record via HCS)
- Multilingual dashboard (6 tabs)
- Smart contract payouts on Hedera testnet
- Auto wallet creation for unbanked farmers (`AccountCreateTransaction`)
- MetaMask pool interactions: `fundAsONG()` and `depositAsInvestor()` confirmed on-chain

### Phase 2 — Actuarial Calibration
- Historical drought analysis by region (10-year data)
- Dynamic threshold adjustment per geography
- Mainnet deployment

### Phase 3 — Basis Risk Reduction
- IoT sensor integration for sub-kilometer drought detection
- Reduce basis risk between grid rainfall and actual farm conditions

### Phase 4 — Reinsurance Layer
- On-chain reinsurance for catastrophic regional events
- Cross-pool risk sharing

### Phase 5 — DAO Governance
- On-chain dispute resolution via DAO
- Community arbitrators elected by HBAR stakers

### Phase 6 — Scale
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
| Farmer premium via MetaMask reverts (internal fee transfer bug) | Farmers pay via Telegram bot (workaround active) |

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

**MetaMask / Pool interactions:** Use Chrome (not Brave). Import the deployer private key from `.env` → `HEDERA_PRIVATE_KEY`. Add Hedera Testnet: RPC `https://testnet.hashio.io/api`, chainId `296`.

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
│   ├── RainSafe.sol    # Core contract (3% fee, 30d waiting period, payoutAddress, disputes)
│   └── RainSafePool.sol # Pool contract (3-tier, fee, yield, claimYield)
├── data/
│   ├── farms.json      # Farm registry (persisted by server.js + monitor.js)
│   ├── payouts.json    # Payout history
│   └── disputes.json   # Dispute log
├── frontend/src/
│   ├── App.jsx         # Main app (6 tabs, protocol banner)
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

**Finca San Antonio, Salento, Colombia** (4.585518, -75.640176) — Real farm registered on-chain during development. TX verifiable on HashScan.

**Finca El Progreso, Bogotá, Colombia** (4.711, -74.0721) — Demo farm in drought zone. Current rainfall: 2.3mm/7d → DROUGHT ALERT

**Parcela San Miguel, Oaxaca, México** (17.0732, -96.7266) — Demo farm. Current rainfall: 0.5mm/7d → DROUGHT ALERT

**Pool transactions verified on-chain:**
- `fundAsONG()` → [HashScan](https://hashscan.io/testnet/contract/0.0.8329792)
- `depositAsInvestor()` → [HashScan](https://hashscan.io/testnet/contract/0.0.8329792)

---

*Built on Hedera · Powered by Open-Meteo · Hedera Hello Future Apex 2026*
*No paperwork. No banks. No intermediaries.*
