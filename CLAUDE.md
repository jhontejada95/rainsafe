# RainSafe — Contexto para Claude Code

## Proyecto
Parametric climate insurance para pequeños agricultores en Hedera.
Hackathon: Hedera Hello Future Apex 2026. Deadline: lunes 24 marzo 11:59pm Colombia.
Repo: https://github.com/jhontejada95/rainsafe

## Contratos desplegados (Hedera Testnet) — v2 ACTIVOS
- Core: `0.0.8324803` → https://hashscan.io/testnet/contract/0.0.8324803
- Pool: `0.0.8324807` → https://hashscan.io/testnet/contract/0.0.8324807
- HCS topics: `0.0.8324808`, `0.0.8324810`, `0.0.8324811`
- Deployer: `0.0.8319187` (923 HBAR disponibles)
- EVM deployer: `0xc906d69a9b0dd7fdc73031788dfda9288e523044`

## URLs live
- Dashboard: https://rainsafe-frontend.vercel.app
- Landing: https://jhontejada95.github.io/rainsafe
- Bot: @RainSafeHedera_bot

## Estado actual (22 marzo 2026, 11pm Colombia)
✅ Bot multilenguaje ES/EN/PT funcionando
✅ Registro on-chain REAL funcionando (TX verificable en HashScan)
✅ HCS recording funcionando (Sequence 1 registrado)
✅ Dashboard 6 tabs: Dashboard, Register Farm, Resilience Score, Payout History, Insurance Pool, Disputes
✅ DisputeCenter.jsx nuevo componente
✅ PoolDashboard.jsx con fee breakdown (3% fee, 8% yield, 4% spread, 30d carencia)
✅ Contratos v2: 3% fee on-chain, 30 días carencia, dispute mechanism
✅ Landing en GitHub Pages

## Lo que falta (en orden de prioridad)
1. **Push del código actual** — los archivos modificados hoy NO están en git todavía
2. **Actualizar IDs de contratos** en landing (index.html) y PoolDashboard.jsx — siguen con IDs viejos
3. **Video demo** (5 min) — flujo: Bot → registro → HashScan → Dashboard → Pool → Disputes
4. **Submission** en https://hackathon.stackup.dev/web/events/hedera-hello-future-apex-hackathon-2026

## Archivos modificados hoy (pendientes de push)
- `agent/hedera.js` — v3 con registerFarmOnChain real (1 tinybar premium)
- `agent/bot.js` — multilenguaje ES/EN/PT + on-chain registration + disputes
- `contracts/RainSafe.sol` — v2: 3% fee, 30d carencia, raiseDispute()
- `contracts/RainSafePool.sol` — v2: 3-tier, fee automático, claimYield()
- `scripts/deploy-v2.js` — deploy unificado ambos contratos
- `frontend/src/App.jsx` — 6 tabs + protocol banner + normalizeFarm actualizado
- `frontend/src/components/PoolDashboard.jsx` — fee breakdown, recibe farms prop
- `frontend/src/components/DisputeCenter.jsx` — NUEVO componente
- `frontend/index.html` — corregido para Vite (solo 10 líneas, apunta a main.jsx)
- `README.md` — completo con business model, roadmap, limitaciones honestas

## Arquitectura
```
Farmer → Telegram Bot (@RainSafeHedera_bot)
         ↓ registerFarmOnChain() → Hedera Contract 0.0.8324803
         ↓ recordClimateEventHCS() → HCS Topic 0.0.8324808
         ↓ POST /api/farms → Express API (server.js :3001)
         ↓ farms.json
         React Dashboard ← polls /api/farms every 10s

Open-Meteo API → monitor.js (6h loop)
         ↓ drought detected → HCS record
         ↓ triggerPayout() → Contract → farmer wallet
```

## Fix clave en hedera.js
El contrato v2 tiene fee transfer que fallaba con HBAR reales.
Solución: enviar `Hbar.fromTinybars(1)` como premium — satisface `require(msg.value > 0)` sin activar la transferencia del fee interno.

## Cómo correr el proyecto
```powershell
# Terminal 1
node server.js

# Terminal 2  
node agent/bot.js

# Terminal 3
cd frontend
npm run dev

# Terminal 4 (opcional)
node agent/monitor.js
```

## Variables de entorno (.env)
```
HEDERA_ACCOUNT_ID=0.0.8319187
HEDERA_PRIVATE_KEY=<ecdsa_key>
CONTRACT_ID=0.0.8324803
POOL_CONTRACT_ID=0.0.8324807
HCS_TOPIC_FARM_0=0.0.8324808
HCS_TOPIC_FARM_1=0.0.8324810
HCS_TOPIC_FARM_2=0.0.8324811
TELEGRAM_BOT_TOKEN=<token>
API_URL=http://localhost:3001
API_PORT=3001
```

## IDs que hay que actualizar en el código
Estos archivos todavía tienen los IDs VIEJOS y hay que actualizarlos:
- `index.html` (raíz) — buscar `0.0.8323474` y `0.0.8324067` → reemplazar con nuevos
- `frontend/src/components/PoolDashboard.jsx` — línea `poolContractId: "0.0.8324067"` → `0.0.8324807`

## Tracks del hackathon
- Primary: Sustainability
- Secondary: Open Track
- Prize pool: $250,000
