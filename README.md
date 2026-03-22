# 🌧️ RainSafe

> Parametric climate insurance for rural farming communities — automatic on-chain payouts triggered by real weather data.

## What it does

RainSafe protects small farmers in Latin America from climate shocks using:
- **Real weather data** via Open-Meteo API (free, no API key needed)
- **Automatic payouts** via Hedera Smart Contract Service
- **Immutable climate event records** via Hedera Consensus Service
- **AI Climate Resilience Score** — builds portable on-chain financial identity for unbanked farmers

## Architecture

```
Open-Meteo API (real climate data)
        ↓
Monitor Agent (Node.js)
detects threshold breach (drought / flood)
        ↓
Hedera Smart Contract
evaluates condition → triggers automatic payout
        ↓
Hedera Consensus Service
records climate event as immutable proof
        ↓
React Frontend
farm registration + live status + payout history + resilience score
```

## Setup

```bash
npm install
cp .env.example .env
# Fill Hedera testnet credentials from portal.hedera.com
node scripts/deploy.js
node agent/monitor.js
cd frontend && npm run dev
```

## Tracks
- **Primary**: Sustainability
- **Secondary**: Open Track (Climate Resilience Score via AI)
