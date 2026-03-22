# RainSafe — Guión Video Demo (5 min)
### Hedera Hello Future Apex 2026

> Habla natural. No leas esto palabra por palabra — úsalo como guía.
> Graba con Loom o OBS. Pantalla + voz. Sin cámara si no quieres.

---

## Antes de dar rec — abre todo esto:

- [ ] Terminal 1: `node server.js`
- [ ] Terminal 2: `node agent/bot.js`
- [ ] Navegador tab 1: `rainsafe-frontend.vercel.app` (dashboard)
- [ ] Navegador tab 2: `jhontejada95.github.io/rainsafe` (landing)
- [ ] Navegador tab 3: `hashscan.io/testnet/contract/0.0.8329786`
- [ ] Telegram: chat con @RainSafeHedera_bot
- [ ] MetaMask: conectado a Hedera Testnet (chainId 296)

---

## [0:00 – 0:30] Abre con el problema

**Pantalla:** landing page

Algo así — con tus palabras:

> "Hay 500 millones de agricultores pequeños en el mundo que no tienen ningún tipo de seguro agrícola. Y no es porque no lo necesiten — es porque el proceso es imposible para ellos. Papeles, bancos, tasadores que tardan meses. Cuando finalmente llega el dinero, ya perdieron la cosecha, se endeudaron, o peor.
>
> RainSafe lo resuelve diferente. Cuando hay sequía — menos de 5mm de lluvia en 7 días — el contrato paga solo. Sin intermediarios. En segundos."

---

## [0:30 – 1:45] Registro por Telegram

**Pantalla:** Telegram → @RainSafeHedera_bot

Haz el registro en vivo mientras hablas:

> "El agricultor abre Telegram. No necesita descargar nada, no necesita un banco, no necesita saber nada de crypto."

Escribe `/registrar` y sigue el flujo:

1. Nombre de la finca — escríbelo en vivo
2. Ubicación — manda coordenadas o un link de Maps
3. Cobertura — elige 100 HBAR
4. Foto GPS — manda una foto (o escribe "saltar")
5. Wallet — si no tienes, el bot crea una automáticamente

> "Mira esto — si el agricultor no tiene wallet de Hedera, el bot crea una y le manda las credenciales por acá mismo. Eso es inclusión financiera real."

Muestra el mensaje de confirmación con el TX ID.

---

## [1:45 – 2:15] HashScan — que se vea que es real

**Pantalla:** hashscan.io/testnet/contract/0.0.8329786

> "Esa transacción que acabas de ver en el bot — acá está en Hedera. Verificable por cualquiera. Permanente. El contador de fincas aumentó."

Muestra:
- La TX del registro
- El `farmCount` en el contrato
- Un mensaje HCS del topic 0.0.8329793

> "Esto no está en una base de datos nuestra. Está en Hedera."

---

## [2:15 – 3:00] El dashboard

**Pantalla:** rainsafe-frontend.vercel.app

> "El dashboard se actualiza cada 10 segundos con datos reales del API."

Muestra las tarjetas de fincas:

> "Finca El Progreso, Bogotá — 2.3mm de lluvia en 7 días. Sequía detectada, pago elegible. El monitor lo está procesando."

Navega a los tabs:
- **Resilience Score** — "Este score es la identidad financiera on-chain del agricultor. Mientras más tiempo en el pool sin eventos, mejor score."
- **Payout History** — "Cada pago tiene el desglose: bruto, 3% de fee al protocolo, neto al agricultor."

---

## [3:00 – 3:45] El pool — MetaMask

**Pantalla:** Tab Insurance Pool

> "El capital viene de tres fuentes: ONGs que absorben las primeras pérdidas, inversores ESG que reciben yield, y las primas de los agricultores."

Conecta MetaMask:

> "Un inversor conecta su wallet directamente — chainId 296, Hedera Testnet."

Muestra el balance del pool. Haz click en `fundAsONG()` y confirma en MetaMask.

> "TX confirmada. Los fondos están en el contrato 0.0.8329792. Verificable en HashScan ahora mismo."

---

## [3:45 – 4:30] Disputas + Monitor

**Pantalla:** Tab Disputes → luego terminal

> "Si un agricultor cree que el pago fue incorrecto, puede disputarlo desde el dashboard o desde el bot con /disputa."

Muestra el formulario de disputa, llénalo y envíalo.

> "Esa disputa queda registrada en Hedera Consensus Service. No en una base de datos que controlamos nosotros — en HCS. Inmutable."

Cambia a la terminal con monitor.js corriendo:

> "Esto es el monitor — corre cada 6 horas, lee las fincas reales, consulta Open-Meteo, y si detecta sequía llama al contrato directamente."

Muestra el output del ciclo si puedes.

---

## [4:30 – 5:00] Cierre

**Pantalla:** vuelve a la landing, luego HashScan

Habla directo, sin apuro:

> "Esto está vivo en Hedera testnet hoy. Transacciones reales, datos reales de clima, wallets reales.
>
> El modelo tiene sentido económico — $0.0001 por transacción hace viable las microprimas. 3-5 segundos de finalidad significa que el agricultor recibe su pago antes de que pueda apagar el teléfono.
>
> 500 millones de agricultores. Sin papeles. Sin bancos. Sin esperar."

Termina con la pantalla de HashScan abierta mostrando el contrato con balance.

---

> *Sin papeles. Sin bancos. Sin intermediarios.*
