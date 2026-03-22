# 🌧️ RainSafe
### Parametric Climate Insurance for Smallholder Farmers on Hedera

> **Hedera Hello Future Apex Hackathon 2026 — Sustainability Track**

[![Live Dashboard](https://img.shields.io/badge/Dashboard-Live-22c55e)](https://rainsafe-frontend.vercel.app)
[![Telegram Bot](https://img.shields.io/badge/Bot-@RainSafeHedera__bot-229ED9)](https://t.me/RainSafeHedera_bot)
[![Hedera Testnet](https://img.shields.io/badge/Hedera-Testnet-8B5CF6)](https://hashscan.io/testnet/contract/0.0.8323474)
[![Landing Page](https://img.shields.io/badge/Landing-GitHub%20Pages-black)](https://jhontejada95.github.io/rainsafe)

---

## The Problem

500 million smallholder farmers worldwide have **zero climate protection**. When drought strikes, traditional insurance takes 4–6 months to pay out — long after the farmer needed the money. Most farmers don't even try: insurance is expensive, complex, and designed for large agribusinesses.

**RainSafe changes this.** When rainfall drops below 5mm in 7 days, the payout happens automatically. No adjusters. No paperwork. No banks. Just real weather data and instant HBAR payouts directly to the farmer's wallet.

---

## Live Deployment

| Component | URL |
|---|---|
| 🌱 Telegram Bot | [@RainSafeHedera_bot](https://t.me/RainSafeHedera_bot) |
| 📊 Dashboard | [rainsafe-frontend.vercel.app](https://rainsafe-frontend.vercel.app) |
| 🌐 Landing Page | [jhontejada95.github.io/rainsafe](https://jhontejada95.github.io/rainsafe) |
| 🔗 Core Contract | [0.0.8323474](https://hashscan.io/testnet/contract/0.0.8323474) |
| 🔗 Pool Contract | [0.0.8324067](https://hashscan.io/testnet/contract/0.0.8324067) |
| 📝 HCS Farm 0 | [0.0.8323476](https://hashscan.io/testnet/topic/0.0.8323476) |
| 📝 HCS Farm 1 | [0.0.8323477](https://hashscan.io/testnet/topic/0.0.8323477) |
| 📝 HCS Farm 2 | [0.0.8323478](https://hashscan.io/testnet/topic/0.0.8323478) |

---

## How It Works

```
Farmer registers via Telegram (no blockchain knowledge needed)
        ↓
Anti-fraud verification: C1 + C2 + C3 + C4
        ↓
Agent monitors real climate data 24/7 (Open-Meteo API)
        ↓
Drought detected → Event recorded on Hedera Consensus Service
        ↓
Smart contract executes automatic payout to farmer's wallet
        ↓
Dashboard updates in real time · All stakeholders notified
```

---

## Stakeholders & User Journeys

### 🌱 Farmer
1. Open Telegram → `/registrar`
2. Enter farm name
3. Share Google Maps link OR send location pin
4. Choose coverage: 50 / 100 / 200 HBAR
5. Send a photo from the farm (GPS verification)
6. Connect HashPack wallet for payouts
7. Coverage activates in 72 hours
8. Receive automatic HBAR payout if drought or flood detected

### 🤝 ONG / Grant Provider
1. Review farm registry and climate events on dashboard
2. Fund the pool via `RainSafePool.fundAsONG()` contract call
3. Capital forms Tier 1 (first loss protection)
4. Receive immutable impact reports from Hedera Consensus Service
5. Every payout publicly verifiable on HashScan

### 📈 ESG Investor
1. Deposit capital via `RainSafePool.depositAsInvestor()` 
2. Earn ~8% annual yield from unclaimed premiums
3. Capital earns additional DeFi yield while waiting
4. Withdraw anytime with on-chain proof of impact
5. Risk mitigated by geographic pool diversification

---

## Anti-Fraud System (4 Layers)

| Layer | Name | Description |
|---|---|---|
| **C1** | Parcel Deduplication | Farm coordinates hashed to ~111m grid cell, recorded on HCS. One parcel = one policy. Permanent. |
| **C2** | 72h Cooldown | Coverage activates 72 hours after registration. Eliminates timing fraud — can't register during an active drought. |
| **C3** | GPS Photo Verification | Photo must be taken within 1km of registered farm. GPS metadata cross-referenced. Physical presence required. |
| **C4** | Coverage Area Limit | Maximum 500 HBAR per registration. Prevents insuring vast territories with a single smartphone. |

---

## Insurance Pool Architecture

```
RAINSAFE POOL (Contract: 0.0.8324067)
        │
Tier 1 — ONGs & Grants (First Loss)
        Absorb first claims. No financial return.
        Receive on-chain impact reports.
        │
Tier 2 — ESG Investors (Mezzanine)
        ~8% annual yield from premiums + DeFi yield
        Enter after Tier 1 protection
        │
Tier 3 — Farmer Premiums (Continuous Flow)
        10% of coverage amount
        Automatic, on-chain, predictable
```

**Actuarial viability:** At 15–20% annual drought frequency (CGIAR standard for semi-arid Latin America), a pool of 100 farmers paying 10 HBAR/month generates 1,000 HBAR/month in premiums. Expected annual payouts: 150–200 HBAR. Pool is actuarially sound.

---

## Business Model

### Revenue Streams

**A. Management Fee (Primary)**
RainSafe charges 3% of all premiums as operational fee.
- 1,000 farmers × 10 HBAR/month = 10,000 HBAR/month premiums
- 3% fee = 300 HBAR/month (~$28 USD at current price)
- Scales linearly with network growth

**B. Yield Spread (Secondary)**
- Investors receive 8% annual yield
- RainSafe negotiates 12% from DeFi protocols
- 4% spread = protocol revenue on all investor capital

**C. Climate Data API (Phase 2)**
Verified climate events on-chain are valuable. Governments, NGOs, and traditional insurers pay for access to RainSafe's tamper-proof climate intelligence layer.

**D. White Label Infrastructure (Phase 3)**
Cooperatives and microfinance institutions deploy their own parametric pools using RainSafe's infrastructure for a licensing fee.

---

## Technology Stack

| Component | Technology | Purpose |
|---|---|---|
| Blockchain | Hedera Hashgraph | Smart contracts, HCS, carbon-negative |
| Climate Data | Open-Meteo API | Free, global, real-time rainfall data |
| Farmer Interface | Telegram Bot API | Zero-friction onboarding in Spanish |
| Wallet | HashPack | HBAR payouts to farmers |
| Smart Contracts | Solidity + HSCS | Automated payouts, pool management |
| Frontend | React + Vite | Real-time dashboard, live API sync |
| Backend | Express.js | Farm registry API, bot-dashboard bridge |
| Deployment | Vercel + GitHub Pages | Public dashboard and landing page |

---

## Roadmap

### ✅ MVP (Current)
- Telegram bot onboarding in Spanish
- Real climate data via Open-Meteo
- 4-layer anti-fraud system
- Multi-source insurance pool
- Wallet integration (HashPack)
- Real-time dashboard
- Smart contract payouts on Hedera testnet

### 🔄 Phase 2 — Actuarial Calibration
- Historical drought frequency analysis by region (10-year data)
- Dynamic threshold adjustment per geography
- Actuarial model validation with CGIAR methodology
- Mainnet deployment

### 🔄 Phase 3 — Basis Risk Reduction
- Integration with Neuron DePIN for hyperlocal IoT sensor data
- Triangulation between satellite, station, and sensor data
- Sub-kilometer resolution for drought detection

### 🔄 Phase 4 — Reinsurance Layer
- On-chain reinsurance protocol integration for catastrophic regional events
- Cross-pool risk sharing between geographic regions
- Parametric reinsurance triggers at pool capacity thresholds

### 🔄 Phase 5 — Dispute Resolution
- DAO governance for payment disputes
- Community arbitrators elected by HBAR stakers
- On-chain arbitration with immutable evidence from HCS

### 🔄 Phase 6 — Regulatory & Scale
- Mutual cooperative legal structure (lower regulatory burden than insurance)
- Multi-language support (Portuguese, French, Swahili)
- White label for cooperatives in Kenya, Brazil, Vietnam

---

## Known Limitations (Honest Assessment)

| Limitation | Description | Mitigation |
|---|---|---|
| **Basis Risk** | Grid-level rainfall may not reflect farm-level conditions | Phase 3 IoT integration |
| **Actuarial Uncertainty** | 5mm/7-day threshold based on CGIAR standards, not regional calibration | Phase 2 calibration |
| **No Reinsurance** | Pool vulnerable to correlated regional drought events | Geographic pool limits + Phase 4 |
| **72h vs 30-day Carencia** | MVP cooldown shorter than industry standard | Configurable per pool in Phase 2 |
| **No Dispute Mechanism** | Farmer has no recourse if payout seems wrong | Phase 5 DAO governance |
| **Testnet Only** | Current deployment on Hedera testnet | Mainnet in Phase 2 |

---

## Local Setup

```bash
# Clone
git clone https://github.com/jhontejada95/rainsafe.git
cd rainsafe

# Install dependencies
npm install
cd frontend && npm install && cd ..

# Configure
cp .env.example .env
# Fill HEDERA_ACCOUNT_ID, HEDERA_PRIVATE_KEY, TELEGRAM_BOT_TOKEN

# Deploy contracts (optional — already deployed on testnet)
node scripts/deploy.js
node scripts/deploy-pool.js

# Run all services
node server.js          # Terminal 1 — API (port 3001)
node agent/bot.js       # Terminal 2 — Telegram bot
node agent/monitor.js   # Terminal 3 — Climate monitor
cd frontend && npm run dev  # Terminal 4 — Dashboard (port 3000)
```

---

## Project Structure

```
rainsafe/
├── agent/
│   ├── bot.js          # Telegram bot — farmer onboarding
│   ├── monitor.js      # Climate monitoring agent
│   ├── weather.js      # Open-Meteo API client
│   └── hedera.js       # Hedera SDK client
├── contracts/
│   ├── RainSafe.sol    # Core insurance contract
│   └── RainSafePool.sol # Multi-source pool contract
├── frontend/
│   └── src/            # React dashboard
├── scripts/
│   ├── deploy.js       # Deploy RainSafe contract
│   └── deploy-pool.js  # Deploy RainSafePool contract
├── server.js           # Express API — bot/dashboard bridge
├── index.html          # Landing page
└── .env.example        # Environment variables template
```

---

## Real-World Validation

**Finca San Antonio, Salento, Colombia** — A real farm registered during development. Coordinates: 4.585518, -74.640176. Climate data verified via Open-Meteo: 37.1mm rainfall in the last 7 days (normal conditions). The farmer's daughter registered the farm during the hackathon using the Telegram bot.

**Oaxaca, México** — Demo farm showing active drought alert: 0.5mm rainfall in 7 days. Automatic payout initiated. Climate event recorded on HCS topic 0.0.8323478.

---

## Team

Built during Hedera Hello Future Apex Hackathon 2026.

---

## License

MIT — Open source, build on it.

---

*Built on Hedera · Powered by Open-Meteo · Hedera Hello Future Apex 2026*
