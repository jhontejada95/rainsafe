# RainSafe — Contexto para Claude Code

## Proyecto
Parametric climate insurance para pequeños agricultores en Hedera.
Hackathon: Hedera Hello Future Apex 2026. Deadline: lunes 24 marzo 11:59pm Colombia.
Repo: https://github.com/jhontejada95/rainsafe

## Contratos desplegados (Hedera Testnet) — v2 ACTIVOS
- Core: `0.0.8329786` → https://hashscan.io/testnet/contract/0.0.8329786
- Pool: `0.0.8329792` → https://hashscan.io/testnet/contract/0.0.8329792
- HCS topics: `0.0.8329793`, `0.0.8329794`, `0.0.8329795`
- Deployer: `0.0.8319187` (~601 HBAR disponibles)
- EVM deployer: `0xc906d69a9b0dd7fdc73031788dfda9288e523044`

## Balances de contratos (fondeo manual hecho)
- Core `0.0.8329786`: **200 HBAR** → puede pagar ~2 payouts de 100 HBAR
- Pool `0.0.8329792`: **50 HBAR** → disponible para claimYield()
- Para re-fondear: `node scripts/fund-contract.js [amount]` (ambos) o `node scripts/fund-contract.js 50 pool`

## URLs live
- Dashboard: https://rainsafe-frontend.vercel.app
- Landing: https://jhontejada95.github.io/rainsafe
- Bot: @RainSafeHedera_bot

## Estado actual (23 marzo 2026)
✅ Bot multilenguaje ES/EN/PT funcionando
✅ Registro on-chain REAL funcionando (TX verificable en HashScan)
✅ HCS recording funcionando
✅ Dashboard 6 tabs: Dashboard, Register Farm, Resilience Score, Payout History, Insurance Pool, Disputes
✅ DisputeCenter llama POST /api/disputes → raiseDisputeOnChain() → Hedera
✅ RegisterFarm (dashboard) llama POST /api/farms → server.js → registerFarmOnChain() si source=dashboard
✅ PoolDashboard con MetaMask wallet connect + ethers.js (chainId 296) → botones reales fundAsONG(), depositAsInvestor(), claimYield(), payPremium()
✅ monitor.js actualiza farms.json con datos reales de clima después de cada ciclo
✅ monitor.js escribe payouts.json cuando se dispara un payout
✅ App.jsx lee /api/payouts real (fallback a demo si API offline)
✅ Contratos v2: 3% fee on-chain, 30 días carencia, dispute mechanism
✅ scripts/fund-contract.js para fondear contratos
✅ Landing en GitHub Pages
✅ README con contract IDs correctos, arquitectura completa, business model

## Pendiente crítico
1. **Wallet creation en bot** — cuando agricultor escribe "saltar" en paso 5, wallet=null y el payout va al deployer (no al agricultor). Solución: llamar `AccountCreateTransaction` del SDK para crear wallet Hedera y enviar credenciales al agricultor por Telegram.
2. **Video demo** (5 min) — guión listo (ver abajo)
3. **Submission** en https://hackathon.stackup.dev/web/events/hedera-hello-future-apex-hackathon-2026

## Bug conocido: payout va al deployer, no al agricultor
En `RainSafe.sol` línea 170:
```solidity
(bool payoutSent,) = payable(farm.owner).call{value: netPayout}("");
```
`farm.owner = msg.sender` (deployer), no `farm.walletAddress`. El campo `walletAddress` es solo metadata.
Para producción: redesplegar contrato usando `walletAddress` como destino del pago.
Para demo MVP: deployer recibe el payout y transfiere manualmente.

## Arquitectura completa
```
Farmer → Telegram Bot (@RainSafeHedera_bot)
         ↓ registerFarmOnChain() → Hedera Contract 0.0.8329786
         ↓ recordClimateEventHCS() → HCS Topic 0.0.8329793
         ↓ POST /api/farms → Express API (server.js :3001)
         ↓ farms.json
         React Dashboard ← polls /api/farms every 10s

Open-Meteo API → monitor.js (6h loop)
         ↓ drought detected (<5mm/7d) → updateFarmWeather() → farms.json
         ↓ recordClimateEventHCS() → HCS topic
         ↓ triggerPayout() → Contract 0.0.8329786
         ↓ recordPayout() → payouts.json
         React Dashboard ← /api/payouts

Dashboard RegisterFarm tab → POST /api/farms → registerFarmOnChain() (source=dashboard)
Dashboard DisputeCenter tab → POST /api/disputes → raiseDisputeOnChain() → Hedera
Dashboard PoolDashboard tab → MetaMask (chainId 296) → ethers.js → Pool Contract 0.0.8329792
```

## Fix clave en hedera.js
El contrato v2 tiene fee transfer que fallaba con HBAR reales.
Solución: enviar `Hbar.fromTinybars(1)` como premium — satisface `require(msg.value > 0)` sin activar la transferencia del fee interno.

## Pool Contract EVM addresses (para MetaMask/ethers.js)
- Core: `0x00000000000000000000000000000000007f1a3a` (0.0.8329786)
- Pool: `0x00000000000000000000000000000000007f1a40` (0.0.8329792)
- Hedera Testnet RPC: `https://testnet.hashio.io/api`, chainId: 296

## Cómo correr el proyecto
```bash
# Terminal 1
node server.js

# Terminal 2
node agent/bot.js

# Terminal 3
cd frontend && npm run dev

# Terminal 4 (opcional — corre ciclo de monitoreo ahora)
node agent/monitor.js

# Fondear contratos (si necesario)
node scripts/fund-contract.js          # ambos, 50 HBAR c/u
node scripts/fund-contract.js 100      # ambos, 100 HBAR c/u
node scripts/fund-contract.js 50 pool  # solo pool
node scripts/fund-contract.js 50 core  # solo core
```

## npm scripts disponibles
```bash
npm run server   # node server.js
npm run bot      # node agent/bot.js
npm run agent    # node agent/monitor.js
npm run deploy   # node scripts/deploy-v2.js
npm run fund     # node scripts/fund-contract.js
npm run dev      # cd frontend && npm run dev
```

## Variables de entorno (.env)
```
HEDERA_ACCOUNT_ID=0.0.8319187
HEDERA_PRIVATE_KEY=<ecdsa_key>
CONTRACT_ID=0.0.8329786
POOL_CONTRACT_ID=0.0.8329792
HCS_TOPIC_FARM_0=0.0.8329793
HCS_TOPIC_FARM_1=0.0.8329794
HCS_TOPIC_FARM_2=0.0.8329795
TELEGRAM_BOT_TOKEN=<token>
API_URL=http://localhost:3001
API_PORT=3001
```

## Guión video demo (5 min)
1. **[0:00-0:30]** Intro: landing page + pitch de 1 frase
2. **[0:30-1:45]** Bot: /registrar en Telegram → 5 pasos → TX en HashScan
3. **[1:45-2:15]** HashScan: mostrar TX real, farmCount en contrato
4. **[2:15-3:00]** Dashboard: finca aparece en tiempo real, Resilience Score, Payout History
5. **[3:00-3:45]** Insurance Pool: Connect MetaMask → fundAsONG() → TX confirmada
6. **[3:45-4:30]** Disputes: submit disputa → TX on-chain; mostrar monitor.js corriendo
7. **[4:30-5:00]** Cierre: arquitectura + "500M farmers. No paperwork. No banks."

## Tracks del hackathon
- Primary: Sustainability
- Secondary: Open Track
- Prize pool: $250,000
