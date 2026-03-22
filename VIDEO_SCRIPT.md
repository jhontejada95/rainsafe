# RainSafe — Demo Script (5 min)
### Hedera Hello Future Apex 2026

> Speak naturally. Don't read this word for word — use it as a guide.
> Record with Loom or OBS. Screen + voice. No camera needed.

---

## Before you hit record — open all of this:

- [ ] Terminal 1: `node server.js`
- [ ] Terminal 2: `node agent/bot.js`
- [ ] Browser tab 1: `rainsafe-frontend.vercel.app` (dashboard)
- [ ] Browser tab 2: `jhontejada95.github.io/rainsafe` (landing)
- [ ] Browser tab 3: `hashscan.io/testnet/contract/0.0.8329786`
- [ ] Telegram: chat with @RainSafeHedera_bot
- [ ] MetaMask (Chrome): connected to Hedera Testnet (chainId 296), deployer account imported

---

## [0:00 – 0:30] Open with the problem

**Screen:** landing page

Something like this — in your own words:

> "There are 500 million smallholder farmers in the world with zero access to crop insurance. Not because they don't need it — because the process is impossible for them. Paperwork, banks, adjusters who take months. By the time the money arrives, they've already lost the harvest, gone into debt, or worse.
>
> RainSafe works differently. When there's a drought — less than 5mm of rainfall in 7 days — the smart contract pays automatically. No intermediaries. In seconds."

---

## [0:30 – 1:45] Registration via Telegram

**Screen:** Telegram → @RainSafeHedera_bot

Do the registration live while you talk:

> "The farmer opens Telegram. No app to download, no bank account, no crypto knowledge needed."

Type `/register` and follow the flow:

1. Farm name — type it live
2. Location — send coordinates or a Maps link
3. Coverage — pick 100 HBAR
4. GPS photo — send a photo (or type "skip")
5. Wallet — if they don't have one, the bot creates it automatically

> "Look at this — if the farmer doesn't have a Hedera wallet, the bot creates one and sends the credentials right here in the chat. That's real financial inclusion."

Show the confirmation message with the TX ID.

---

## [1:45 – 2:15] HashScan — show it's real

**Screen:** hashscan.io/testnet/contract/0.0.8329786

> "That transaction you just saw in the bot — here it is on Hedera. Verifiable by anyone. Permanent. The farm counter went up."

Show:
- The registration TX
- The `farmCount` on the contract
- An HCS message from topic 0.0.8329793

> "This isn't in a database we control. It's on Hedera."

---

## [2:15 – 3:00] The dashboard

**Screen:** rainsafe-frontend.vercel.app

> "The dashboard updates every 10 seconds with real data from the API."

Show the farm cards:

> "Finca El Progreso, Bogotá — 2.3mm of rainfall in 7 days. Drought detected, payout eligible. The monitor is processing it."

Browse the tabs:
- **Resilience Score** — "This score is the farmer's on-chain financial identity. The longer they stay in the pool without a drought event, the better their score."
- **Payout History** — "Every payout has a full breakdown: gross amount, 3% protocol fee, net to the farmer."

---

## [3:00 – 3:45] The pool — MetaMask

**Screen:** Insurance Pool tab

> "The capital comes from three sources: NGOs that absorb first losses, ESG investors who earn yield, and farmer premiums flowing in continuously."

Connect MetaMask:

> "An investor connects their wallet directly — chainId 296, Hedera Testnet."

Show the pool balance. Click `fundAsONG()` and confirm in MetaMask.

> "Transaction confirmed. The funds are in contract 0.0.8329792. Verifiable on HashScan right now."

Click `depositAsInvestor()` and confirm — show the HashScan link.

> "Farmers pay their premiums through the Telegram bot — same contract, same flow, fully on-chain."

---

## [3:45 – 4:30] Disputes + Monitor

**Screen:** Disputes tab → then terminal

> "If a farmer believes a payout was incorrect, they can dispute it from the dashboard or from the bot with /dispute."

Fill out the dispute form and submit it.

> "That dispute is recorded on Hedera Consensus Service. Not in a database we control — on HCS. Immutable."

Switch to the terminal with monitor.js running:

> "This is the monitor — it runs every 6 hours, reads the real farms, checks Open-Meteo, and if it detects drought it calls the contract directly."

Show the cycle output if you can.

---

## [4:30 – 5:00] Close

**Screen:** back to landing, then HashScan

Speak directly, no rush:

> "This is live on Hedera testnet today. Real transactions, real climate data, real wallets.
>
> The economics make sense — $0.0001 per transaction makes micropremiums viable. 3 to 5 seconds of finality means the farmer receives their payout before they can put the phone down.
>
> 500 million farmers. No paperwork. No banks. No waiting."

End with HashScan open showing the contract with balance.

---

> *No paperwork. No banks. No intermediaries.*
