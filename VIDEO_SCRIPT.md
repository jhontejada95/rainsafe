# RainSafe — Video Demo Script (5 min)
### Hedera Hello Future Apex 2026 — Sustainability Track

---

## [0:00 – 0:30] Intro & Hook

**Pantalla:** Landing page — jhontejada95.github.io/rainsafe

**Narración:**
> "500 million smallholder farmers have zero climate protection.
> Traditional insurance takes 4 to 6 months to pay out — long after the farmer needed the money.
> RainSafe changes this. When rainfall drops below 5mm in 7 days, the payout happens automatically.
> No adjusters. No paperwork. No banks.
> Built on Hedera. Live on testnet. Today."

---

## [0:30 – 1:45] Bot Registration (Telegram)

**Pantalla:** Telegram → @RainSafeHedera_bot

**Pasos a mostrar:**
1. Escribir `/registrar` (o `/start` → seleccionar idioma)
2. Ingresar nombre de la finca
3. Enviar ubicación (coordenadas o link de Google Maps)
4. Seleccionar cobertura: **100 HBAR**
5. Enviar foto GPS (o escribir "saltar" → bot crea wallet automáticamente)
6. Ingresar wallet Hedera o dejar que el bot la cree

**Narración:**
> "The farmer opens Telegram. No app to install. No bank account needed.
> They register their farm in 5 steps — name, location, coverage, photo, wallet.
> If they don't have a Hedera wallet, the bot creates one automatically and sends them the credentials."

**Mostrar:** Mensaje de confirmación con TX ID y link a HashScan

---

## [1:45 – 2:15] HashScan — Verificación On-Chain

**Pantalla:** hashscan.io/testnet/contract/0.0.8329786

**Narración:**
> "Every registration is a real transaction on Hedera. Verifiable. Permanent. Tamper-proof.
> The farm count increments on-chain. No central database controls this."

**Mostrar:**
- La transacción del bot visible en HashScan
- `farmCount` incrementado en el contrato
- HCS topic con el evento registrado

---

## [2:15 – 3:00] Dashboard — Tiempo Real

**Pantalla:** rainsafe-frontend.vercel.app

**Narración:**
> "The dashboard updates in real time. Every 10 seconds it pulls from the API.
> We can see Finca El Progreso — 2.3mm of rain in 7 days. Drought detected. Payout eligible.
> The Resilience Score combines rainfall, coverage, and time in the pool."

**Mostrar:**
- Tab Dashboard: 5 fincas, 1 alerta activa (Finca El Progreso en rojo)
- Tab Resilience Score: score 42/100 para la finca en sequía
- Tab Payout History: payouts con gross/net/fee desglosados

---

## [3:00 – 3:45] Insurance Pool — MetaMask

**Pantalla:** Tab "Insurance Pool" en el dashboard

**Narración:**
> "The pool has a 3-tier capital structure — NGOs absorb first losses, ESG investors earn yield,
> farmer premiums flow continuously.
> Investors connect MetaMask on Hedera Testnet and interact directly with the smart contract."

**Pasos a mostrar:**
1. Click "Connect Wallet" → MetaMask abre (chainId 296)
2. Mostrar balance del pool (50 HBAR disponibles)
3. Click `fundAsONG()` → confirmar TX en MetaMask
4. TX confirmada — fondos en el contrato `0.0.8329792`

---

## [3:45 – 4:30] Disputes + Monitor

**Pantalla:** Tab "Disputes" en el dashboard → terminal con monitor.js

**Narración:**
> "Farmers can dispute a payout decision directly from the dashboard or the bot.
> Every dispute is recorded permanently on Hedera Consensus Service — not in a database we control."

**Mostrar:**
1. Formulario de disputa → Submit → "Dispute recorded on Hedera"
2. Terminal corriendo `node agent/monitor.js` — ciclo de monitoreo
3. Open-Meteo API response → drought detected → `triggerClimateEvent()` → TX on Hedera

---

## [4:30 – 5:00] Cierre

**Pantalla:** Landing page scroll + HashScan del contrato

**Narración:**
> "RainSafe is parametric climate insurance for farmers who can't afford to wait.
> 4-layer anti-fraud. Automatic payouts. Real weather data. Real on-chain transactions.
> Built on Hedera — carbon-negative, fast, and $0.0001 per transaction.
> 500 million farmers. No paperwork. No banks. No intermediaries."

**Mostrar últimas pantallas:**
- Contrato `0.0.8329786` en HashScan con balance
- Bot en Telegram activo
- Dashboard con fincas en tiempo real

**Frase final (en pantalla):**
> *Sin papeles. Sin bancos. Sin intermediarios.*
> *Built on Hedera · Powered by Open-Meteo · Hedera Hello Future Apex 2026*

---

## Checklist antes de grabar

- [ ] `node server.js` corriendo en Terminal 1
- [ ] `node agent/bot.js` corriendo en Terminal 2
- [ ] Dashboard abierto en `rainsafe-frontend.vercel.app`
- [ ] HashScan abierto en `hashscan.io/testnet/contract/0.0.8329786`
- [ ] Telegram abierto con @RainSafeHedera_bot
- [ ] MetaMask configurado en Hedera Testnet (chainId 296, RPC: https://testnet.hashio.io/api)
- [ ] Loom o OBS listo para grabar pantalla + voz
- [ ] Duración objetivo: 5 minutos exactos
