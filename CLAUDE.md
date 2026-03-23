# RainSafe — Contexto para Claude Code

## Proyecto
Parametric climate insurance para pequeños agricultores en Hedera.
Hackathon: Hedera Hello Future Apex 2026. Deadline: lunes 24 marzo 11:59pm Colombia.
Repo: https://github.com/jhontejada95/rainsafe

## Contratos desplegados (Hedera Testnet) — v2 ACTIVOS
- Core: `0.0.8329786` → https://hashscan.io/testnet/contract/0.0.8329786
- Pool: `0.0.8329792` → https://hashscan.io/testnet/contract/0.0.8329792
- HCS topics: `0.0.8329793`, `0.0.8329794`, `0.0.8329795`
- Deployer: `0.0.8319187`
- EVM deployer: `0xc906d69a9b0dd7fdc73031788dfda9288e523044`

## Balances de contratos
- Core `0.0.8329786`: **200 HBAR** → puede pagar ~2 payouts de 100 HBAR
- Pool `0.0.8329792`: **50 HBAR** → disponible para claimYield()
- Para re-fondear: `node scripts/fund-contract.js [amount]`

## farmCount actual en el contrato
**farmCount = 4** (verificado via ContractCallQuery el 23 marzo 2026).
farmIds válidos: 0, 1, 2, 3. Cualquier onChainId ≥ 4 en farms.json es inválido.
La siguiente finca que se registre recibirá farmId = 4.

## URLs live
- Dashboard: https://rainsafe-frontend.vercel.app
- Landing: https://jhontejada95.github.io/rainsafe
- Bot: @RainSafeHedera_bot

## Estado actual (23 marzo 2026) — LISTO PARA SUBMISSION
✅ Bot multilenguaje ES/EN/PT funcionando
✅ Registro on-chain REAL funcionando — TX verificable en HashScan
✅ HashScan TX URL corregida: split en @ para preservar puntos del account ID
✅ onChainId correcto: bot consulta getFarmCount() post-registro y usa farmCount-1
✅ HCS recording funcionando
✅ Dashboard 6 tabs: Dashboard, Register Farm, Resilience Score, Payout History, Insurance Pool, Disputes
✅ DisputeCenter: usa f.onChainId en dropdown (no f.id), filtra farms con onChainId null
✅ server.js valida farmId < farmCount antes de llamar raiseDisputeOnChain — evita CONTRACT_REVERT
✅ farms.json deduplicado: 15 → 10 entradas, onChainIds inválidos (≥4) seteados a null
✅ server.js POST /api/farms: upsert por parcelHash — evita duplicados cuando bot y API escriben simultáneo
✅ PoolDashboard: MetaMask funciona en Chrome (no Brave), deployer key importada, chainId 296
✅ fundAsONG() y depositAsInvestor() confirmados en HashScan
✅ payPremium() deshabilitado en UI (revert en testnet por fee transfer interno) — reemplazado con botón "via Telegram bot"
✅ Constantes de gas nombradas en hedera.js (GAS_REGISTER_FARM=800k, etc.)
✅ POOL_GAS_LIMIT=300_000 en PoolDashboard, bypasea gas estimation del RPC
✅ Addresses de contratos leen de VITE_ env vars con fallback
✅ README reescrito para jueces con sección "Testing the Project" prominente
✅ VIDEO_SCRIPT.md eliminado del repo
✅ Video demo grabado ✅

## Pendiente para submission
1. **Subir video** a YouTube/Loom y pegar link en SUBMISSION.md
2. **Llenar SUBMISSION.md**: mainnet wallet, Discord handle, LinkedIn URL
3. **Submit** en https://hackathon.stackup.dev/web/events/hedera-hello-future-apex-hackathon-2026

## Bug conocido (no bloqueante para demo)
En `RainSafe.sol` línea ~170:
```solidity
(bool payoutSent,) = payable(farm.owner).call{value: netPayout}("");
```
`farm.owner = msg.sender` (deployer), no `farm.walletAddress`. Para producción: redesplegar contrato usando `walletAddress` como destino. Para MVP: deployer recibe y transfiere manualmente. Documentado en README > Honest Limitations.

## Fixes críticos implementados en esta sesión

### hashscanTxUrl — URL inválida
El replace `/\./g` reemplazaba TODOS los puntos incluyendo los del account ID.
`0.0.8319187@ts.ns` → era: `0-0-8319187-ts-ns` (inválido)
Fix: split en `@`, preservar puntos del account, reemplazar solo el punto del timestamp.
```javascript
function hashscanTxUrl(txId) {
  const [account, timestamp = ""] = txId.split("@");
  return `https://hashscan.io/testnet/transaction/${account}-${timestamp.replace(".", "-")}`;
}
```

### onChainId incorrecto — causa raíz de CONTRACT_REVERT en disputes
El bot asignaba `farm.onChainId = idx` (índice local en farms.json), no el farmId real del contrato.
Fix: `registerFarmOnChain()` en hedera.js ahora llama `getFarmCount()` via `ContractCallQuery` post-registro y retorna `onChainId = farmCount - 1`.

### Duplicate farms
Bot escribía en farms.json via `saveFarm()` Y via `POST /api/farms → server.js`.
Fix: server.js hace upsert por `parcelHash` en lugar de siempre hacer push.

### Dispute CONTRACT_REVERT_EXECUTED
Causas encadenadas:
1. Dropdown usaba `f.id` (timestamp) como valor → server.js parseaba timestamp como farmId gigante
2. onChainId en farms.json eran índices locales, no farmIds reales del contrato
3. farmCount = 4, cualquier farmId ≥ 4 causa "Farm does not exist" revert
Fix: dropdown usa `f.onChainId`, server.js valida `onChainId < farmCount` antes de llamar contrato.

## Arquitectura completa
```
Farmer → Telegram Bot (@RainSafeHedera_bot)
         ↓ registerFarmOnChain() → Hedera Contract 0.0.8329786
         ↓ getFarmCount() → ContractCallQuery → onChainId = farmCount-1
         ↓ recordClimateEventHCS() → HCS Topic 0.0.8329793
         ↓ POST /api/farms → server.js (upsert por parcelHash) → farms.json
         React Dashboard ← polls /api/farms every 10s

Open-Meteo API → monitor.js (6h loop)
         ↓ drought detected (<5mm/7d) → updateFarmWeather() → farms.json
         ↓ recordClimateEventHCS() → HCS topic
         ↓ triggerPayout() → Contract 0.0.8329786
         ↓ recordPayout() → payouts.json
         React Dashboard ← /api/payouts

Dashboard DisputeCenter tab → POST /api/disputes
         ↓ getFarmCount() → valida farmId < farmCount
         ↓ raiseDisputeOnChain(onChainId) → Contract 0.0.8329786

Dashboard PoolDashboard tab → MetaMask (Chrome, chainId 296) → ethers.js
         ↓ fundAsONG() / depositAsInvestor() / claimYield() → Pool Contract 0.0.8329792
```

## Fix clave en hedera.js
El contrato v2 tiene fee transfer que fallaba con HBAR reales.
Solución: enviar `Hbar.fromTinybars(1)` como premium — satisface `require(msg.value > 0)` sin activar la transferencia del fee interno.

## Pool Contract EVM addresses (para MetaMask/ethers.js)
- Core: `0x00000000000000000000000000000000007f1a3a` (0.0.8329786)
- Pool: `0x00000000000000000000000000000000007f1a40` (0.0.8329792)
- Hedera Testnet RPC: `https://testnet.hashio.io/api`, chainId: 296
- MetaMask: usar Chrome (Brave intercepta window.ethereum)
- Cuenta para testear: importar HEDERA_PRIVATE_KEY del .env (deployer tiene ~600 HBAR)

## Constantes de gas (hedera.js)
```javascript
const GAS_REGISTER_FARM  = 800_000;
const GAS_VERIFY_FARM    = 100_000;
const GAS_RAISE_DISPUTE  = 400_000;
const GAS_TRIGGER_PAYOUT = 500_000;
const GAS_UPDATE_SCORE   = 200_000;
```

## POOL_GAS_LIMIT (PoolDashboard.jsx)
```javascript
const POOL_GAS_LIMIT = 300_000; // bypasea gas estimation del RPC de Hedera Testnet
```

## Cómo correr el proyecto
```bash
# Terminal 1
node server.js

# Terminal 2
node agent/bot.js

# Terminal 3
cd frontend && npm run dev

# Terminal 4 (opcional)
node agent/monitor.js

# Fondear contratos si necesario
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
VITE_API_URL=http://localhost:3001
VITE_CONTRACT_ID=0.0.8329786
VITE_POOL_CONTRACT_ADDRESS=0x00000000000000000000000000000000007f1a40
VITE_POOL_CONTRACT_ID=0.0.8329792
VITE_CORE_CONTRACT_ID=0.0.8329786
```

## Tracks del hackathon
- Primary: Sustainability
- Secondary: Open Track
- Prize pool: $250,000
