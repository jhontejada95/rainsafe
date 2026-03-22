# RainSafe — Submission Form
## Hedera Hello Future Apex 2026

> Copia y pega cada bloque directo en el formulario de StackUp.

---

## Challenge Theme

**Theme 3: Sustainability**
*(Secondary: Theme 4: Open Track)*

---

## Project Name

```
RainSafe
```

---

## Project Description (max 100 words + tech stack + setup)

```
RainSafe brings climate insurance to the 500 million farmers who can't access it. When drought hits — less than 5mm of rain in 7 days — the smart contract pays the farmer automatically. No adjusters. No paperwork. No bank account needed. Farmers register in minutes through a Telegram bot in Spanish, English, or Portuguese. If they don't have a crypto wallet, the bot creates one for them. A 3-tier capital pool backs every payout. All climate events and payments live permanently on Hedera.

Tech stack: Hedera SDK (HSCS + HCS), Solidity, Node.js, Telegram Bot API, React + Vite, Express.js, Open-Meteo API, ethers.js, MetaMask.

No setup needed to see it live — dashboard: https://rainsafe-frontend.vercel.app · Bot: @RainSafeHedera_bot
```

---

## GitHub Repo

```
https://github.com/jhontejada95/rainsafe
```

---

## Project Demo Video Link

```
[PEGAR LINK DE LOOM O YOUTUBE DESPUÉS DE GRABAR]
```

---

## Project Demo Link

```
https://rainsafe-frontend.vercel.app
```

---

## Developer Experience — Escalas 1-10

### ¿Qué tan seguro te sentiste leyendo los docs de que podías construir algo?
**7**

Arrancamos con buena base. Los docs de HSCS y HCS son sólidos, hay ejemplos reales. Lo que nos tomó tiempo fue entender cómo pasar una dirección de Hedera (formato 0.0.N) a un smart contract — el tipo `address` de Solidity espera formato EVM. Una vez que entendimos `toSolidityAddress()` y `ContractFunctionParameters.addAddress()`, todo fluyó.

---

### ¿Qué tan fácil fue conseguir ayuda cuando te bloqueaste?
**6**

El Discord de Hedera tiene gente activa y respondieron rápido un par de veces. Stack Overflow tiene poco contenido específico de Hedera. Los ejemplos del SDK ayudaron bastante, aunque algunos estaban un poco desactualizados. Diría que la comunidad está creciendo pero todavía le falta volumen comparado con ecosistemas más maduros.

---

### ¿Qué tan intuitivos fueron los APIs y SDKs?
**7**

El SDK de Node.js está bien armado. `ContractCreateFlow` es elegante — compila, despliega y retorna el ID en una sola llamada. La curva de aprendizaje estuvo más en entender cuándo usar el SDK nativo de Hedera versus el patrón EVM compatible. No siempre es obvio qué capa usar para qué cosa.

---

### ¿Qué tan fácil fue debuggear?
**6**

HashScan es excelente — cada TX queda visible, podías ver el estado del contrato, los mensajes HCS, todo. Eso ayudó un montón. Lo que dolió fue que algunos errores del SDK son crípticos (por ejemplo, errores de compilación de Solidity que llegaban enmascarados como errores de gas). El flag `viaIR: true` que necesitamos para evitar "Stack too deep" tampoco estaba documentado en el contexto de Hedera — lo encontramos por prueba y error.

---

### ¿Qué tan probable es que vuelvas a construir en Hedera?
**9**

Mucho. $0.0001 por transacción y finalidad en 3-5 segundos cambian completamente lo que es posible construir. En Ethereum, hacer pagos de 10 HBAR de prima no tendría sentido — el gas lo come. En Hedera, tiene toda la lógica económica del mundo. Para aplicaciones de inclusión financiera esto no es un detalle, es lo que hace viable o no el modelo de negocio.

---

## Hackathon Experience

### ¿Cuáles fueron tus principales objetivos al participar?

```
Queríamos demostrar que blockchain puede resolver algo real para gente que lo necesita de verdad. Los agricultores pequeños son los más afectados por el cambio climático y los que menos herramientas financieras tienen. La pregunta que nos hacíamos era: ¿puede un campesino en Colombia o México recibir un pago automático cuando hay sequía, sin banco, sin papeles, sin esperar meses? Con Hedera la respuesta es sí. Eso era lo que queríamos probar — no solo en teoría sino con transacciones reales verificables en HashScan.
```

---

### ¿Cuál fue el mayor bloqueo que tuviste?

```
Dos que nos costaron horas:

1. Los payouts iban al deployer, no al agricultor. El contrato guardaba farm.owner (msg.sender = nosotros) en lugar de la wallet del agricultor. Tuvimos que agregar un campo payoutAddress separado en el struct Farm, pasarlo como parámetro en registerFarm(), y en hedera.js convertir el ID de Hedera a formato EVM con toSolidityAddress(). Parece simple en retrospectiva pero no lo fue en el momento.

2. Al agregar ese parámetro extra, Solidity tiró "Stack too deep". La solución fue compilar con viaIR: true, que reorganiza cómo el compilador maneja las variables locales. Ni los docs de Hedera ni los de Solidity lo mencionaban claramente para este caso. Lo encontramos en un issue de GitHub de 2022 sobre un proyecto diferente.
```

---

### ¿Qué mejorarías del hackathon?

```
Una guía de "patrones comunes" para HSCS. Algo que explique de forma directa: cómo pasar un address de Hedera a un contrato Solidity, cómo llamar funciones payable con HBAR, cómo manejar transfers de fee dentro del contrato sin que falle. Son cosas que cualquier proyecto real va a necesitar y hoy requieren leer issues de GitHub, código de ejemplo disperso, y bastante prueba y error. Si eso estuviera condensado en un doc, le ahorra días a los próximos builders.
```

---

### ¿Qué funcionó bien y no cambiarías?

```
HashScan. Tener un explorador así de bueno hace una diferencia enorme — en desarrollo para debuggear, en la demo para mostrarle a los jueces que todo es real y verificable. También AccountCreateTransaction: poder crear wallets programáticamente desde el bot fue lo que hizo posible el flujo para agricultores sin cuenta. Es exactamente el tipo de primitiva que hace falta para inclusión financiera real. Y las fees bajas — sin eso RainSafe no tiene modelo de negocio.
```

---

## Info On-Chain

### Hedera Testnet Account ID del equipo

```
0.0.8319187
```

Todos los contratos, topics HCS y transacciones de prueba salieron de esta cuenta. Se puede verificar en HashScan.

Contratos desplegados:
- Core: `0.0.8329786` — https://hashscan.io/testnet/contract/0.0.8329786
- Pool: `0.0.8329792` — https://hashscan.io/testnet/contract/0.0.8329792
- HCS Topics: `0.0.8329793`, `0.0.8329794`, `0.0.8329795`

---

### Mainnet wallet addresses (para el Apex NFT)

```
[PONER TU DIRECCIÓN DE MAINNET AQUÍ]
```

---

## Info del Equipo

### Discord Handle(s)

```
[TU HANDLE DE DISCORD]
```

### LinkedIn(s)

```
[TU URL DE LINKEDIN]
```

---

### ¿Cómo fue construir en Hedera?

```
Honestamente mejor de lo que esperábamos. Entramos un poco escépticos — hay mucho ecosistema blockchain y no todos entregan lo que prometen. Pero los números de Hedera son reales: 3-5 segundos de finalidad, $0.0001 por transacción, huella de carbono negativa. Para un proyecto de seguros climáticos para agricultores en países en desarrollo, esos números importan de verdad.

Lo que más nos sorprendió positivamente fue HCS — Hedera Consensus Service. Poder registrar eventos de clima de forma permanente e inmutable, sin que estén en una base de datos que controlamos nosotros, le da una credibilidad completamente diferente al sistema. Un agricultor puede reclamar una disputa y mostrar el registro en HCS. Eso es auditable por cualquiera.

Lo más difícil fue el límite de EVM compatibility. Hedera soporta tanto el SDK nativo como contratos EVM, pero la línea entre cuándo usar uno u otro no siempre es clara en los docs. Terminas mezclando patrones de los dos mundos y hay edge cases que no están documentados. Mejorar esa documentación sería un salto grande para developers que vienen de Ethereum.

En resumen: volvemos a construir en Hedera. El modelo de costos y la velocidad lo hacen único para casos de uso de pagos reales.
```

---

## Bounty

```
Revisar: https://go.hellofuturehackathon.dev/submit-bounty
```
