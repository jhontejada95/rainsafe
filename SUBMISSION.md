# RainSafe — Hackathon Submission
## Hedera Hello Future Apex 2026

> Use this file to copy-paste answers into the StackUp submission form.

---

## Challenge Selection

**Challenge Theme:** Theme 3: Sustainability
*(Secondary: Theme 4: Open Track)*

---

## Project Details

### Project Name
```
RainSafe
```

### Project Description (max 100 words)
```
RainSafe is parametric climate insurance for smallholder farmers on Hedera. When rainfall drops below 5mm in 7 days, the smart contract pays the farmer automatically — no adjusters, no paperwork, no banks. Farmers register via Telegram bot in ES/EN/PT in under 5 minutes. No wallet needed: the bot creates one via AccountCreateTransaction. A 3-tier capital pool (NGOs + ESG investors + farmer premiums) funds payouts. 4-layer anti-fraud system prevents abuse. Climate events are immutably recorded on HCS. 3% protocol fee on all transactions. Live on Hedera testnet with real weather data from Open-Meteo API.

Tech stack: Hedera SDK (HSCS + HCS), Solidity, Node.js, Telegram Bot API, React + Vite, Express.js, Open-Meteo API, ethers.js, MetaMask (chainId 296).

Setup: No local setup required. Live dashboard: https://rainsafe-frontend.vercel.app · Bot: @RainSafeHedera_bot
```

### Project's GitHub Repo Link
```
https://github.com/jhontejada95/rainsafe
```

### Project Demo Video Link
```
[INSERT LOOM/YOUTUBE LINK AFTER RECORDING]
```

### Project Demo Link (live environment)
```
https://rainsafe-frontend.vercel.app
```

---

## Hedera Developer Experience

### On a scale of 1-10, how confident did you feel after reading the docs that you could build successfully?
```
7
```
*The HSCS and HCS docs are solid. The main friction was understanding the difference between Hedera account IDs (0.0.N) and EVM addresses, and how to pass them to smart contracts. Once we understood toSolidityAddress() and ContractFunctionParameters.addAddress(), everything clicked.*

### On a scale of 1-10, how easy was it to get help when you were blocked?
```
6
```
*Discord community is active. Stack Overflow has limited Hedera-specific content. The SDK examples in the docs were helpful but sometimes outdated.*

### On a scale of 1-10, how intuitive were the APIs / SDKs to use?
```
7
```
*The Node.js SDK is well-structured. ContractCreateFlow is elegant. The main learning curve was around fee handling (HBAR vs tinybars) and the interaction between the Hedera SDK and EVM-compatible contract calls.*

### On a scale of 1-10, how easy was it to debug issues?
```
6
```
*HashScan is excellent for verifying transactions. The SDK error messages are sometimes cryptic (e.g., INSUFFICIENT_GAS vs actual compilation errors). The viaIR compiler flag requirement for complex Solidity structs wasn't documented prominently.*

### On a scale of 1-10, how likely are you to build again on Hedera after the hackathon?
```
9
```
*Carbon-negative, fast finality, and $0.0001 transactions make Hedera uniquely suited for high-frequency micropayment applications like parametric insurance. We plan to continue.*

---

## Hackathon Experience

### What are your main goals or objectives for participating in this hackathon?
```
We want to prove that blockchain can solve a real problem for the world's most vulnerable farmers. 500 million smallholder farmers have no access to climate insurance — not because the math doesn't work, but because the friction (paperwork, banks, adjusters) makes it economically unviable. Hedera's speed and cost profile makes RainSafe possible. Our goal: demonstrate a working MVP that any farmer with a phone can use, and validate the business model with real on-chain transactions.
```

### What was the biggest friction or blocker you faced?
```
Two main blockers:

1. EVM address handling: Hedera account IDs (0.0.N format) don't map directly to EVM addresses. The contract stores addresses as Solidity `address` type, but the SDK uses AccountId. We had to implement toSolidityAddress() conversion and ContractFunctionParameters.addAddress() correctly. This caused the payout going to the deployer instead of the farmer — a bug we caught and fixed by adding a dedicated payoutAddress field to the Farm struct.

2. Solidity stack depth: Adding the payoutAddress parameter to registerFarm() pushed the function over the EVM stack limit. Solution: viaIR: true in the compiler settings. This wasn't documented prominently in the Hedera dev docs.
```

### What's one thing we could improve to make this hackathon experience better?
```
More code examples for the HSCS + Solidity interaction pattern — specifically how to pass and retrieve address types between the Hedera SDK and smart contracts. A "common patterns" guide covering: account ID → EVM address conversion, how to call payable functions with HBAR, and how to handle fee transfers inside contracts. These are non-obvious and blocked us for hours.
```

### What worked especially well that we should not change?
```
HashScan is excellent — being able to verify every transaction, inspect contract state, and see HCS messages in real time was invaluable for debugging and for demonstrating proof-of-concept to judges. The AccountCreateTransaction for auto-creating wallets is a killer feature for financial inclusion use cases. The low fees ($0.0001/tx) make parametric insurance economically viable at scale.
```

---

## Hedera On-Chain Info

### Hedera Testnet Account ID of the team
```
0.0.8319187
```
*(All contract deployments, HCS topics, and test transactions were made from this account. Verifiable on HashScan.)*

**Contracts deployed:**
- Core (RainSafe.sol): `0.0.8329786` → https://hashscan.io/testnet/contract/0.0.8329786
- Pool (RainSafePool.sol): `0.0.8329792` → https://hashscan.io/testnet/contract/0.0.8329792
- HCS Topics: `0.0.8329793`, `0.0.8329794`, `0.0.8329795`

### Mainnet wallet addresses (for Apex NFT)
```
[INSERT YOUR MAINNET HEDERA WALLET ADDRESS HERE]
```

---

## Team Info

### Discord Handles
```
[INSERT DISCORD HANDLE]
```

### LinkedIn Profile URLs
```
[INSERT LINKEDIN URL]
```

### Thoughts on building on Hedera
```
Hedera is uniquely positioned for financial inclusion applications. The combination of:
- Carbon-negative consensus (important for a sustainability project)
- 3–5 second finality (critical for parametric insurance — farmers need to see the payout immediately)
- $0.0001 per transaction (makes micropremiums economically viable)
- HCS for tamper-proof event logging (immutable audit trail for disputes and climate events)
- AccountCreateTransaction (create wallets for unbanked users programmatically)

...makes RainSafe possible in a way that wouldn't work on other chains. Ethereum gas costs would make 10 HBAR premiums economically absurd. Hedera makes them viable.

The main challenge was the learning curve around EVM compatibility — Hedera supports both native SDK patterns and EVM-compatible calls, and understanding when to use which required significant trial and error. Better documentation on the boundary between these two paradigms would accelerate future builders significantly.
```

---

## Bounty Submission
```
[Check https://go.hellofuturehackathon.dev/submit-bounty for applicable bounties]
```
