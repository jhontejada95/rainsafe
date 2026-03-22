// fund-contract.js — Fund all RainSafe contracts for demo
// Usage:
//   node scripts/fund-contract.js           → fund all contracts (50 HBAR each)
//   node scripts/fund-contract.js 100       → fund all contracts (100 HBAR each)
//   node scripts/fund-contract.js 50 core   → fund only core contract
//   node scripts/fund-contract.js 50 pool   → fund only pool contract

require("dotenv").config();
const {
  Client,
  AccountId,
  PrivateKey,
  TransferTransaction,
  Hbar,
  AccountBalanceQuery,
} = require("@hashgraph/sdk");

const CONTRACTS = {
  core: { id: process.env.CONTRACT_ID || "0.0.8329786", label: "Core (RainSafe.sol)" },
  pool: { id: process.env.POOL_CONTRACT_ID || "0.0.8329792", label: "Pool (RainSafePool.sol)" },
};

async function getBalance(client, accountId) {
  const b = await new AccountBalanceQuery().setAccountId(AccountId.fromString(accountId)).execute(client);
  return b.hbars.toString();
}

async function fundContract(client, fromId, contractId, label, amount) {
  console.log(`\n📤 Funding ${label} (${contractId}) with ${amount} HBAR...`);
  const before = await getBalance(client, contractId);
  console.log(`   Before: ${before}`);

  const tx = await new TransferTransaction()
    .addHbarTransfer(AccountId.fromString(fromId), new Hbar(-amount))
    .addHbarTransfer(AccountId.fromString(contractId), new Hbar(amount))
    .execute(client);

  const receipt = await tx.getReceipt(client);
  const txId = tx.transactionId.toString();
  const after = await getBalance(client, contractId);

  console.log(`   ✅ Status: ${receipt.status}`);
  console.log(`   After:  ${after}`);
  console.log(`   TX: https://hashscan.io/testnet/transaction/${txId}`);
  return { contractId, label, after, txId };
}

async function main() {
  const amount = parseFloat(process.argv[2]) || 50;
  const target = process.argv[3]; // "core", "pool", or undefined (all)

  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;

  if (!accountId || !privateKey) {
    console.error("❌ Missing HEDERA_ACCOUNT_ID or HEDERA_PRIVATE_KEY in .env");
    process.exit(1);
  }

  const client = Client.forTestnet();
  client.setOperator(AccountId.fromString(accountId), PrivateKey.fromStringECDSA(privateKey));

  const deployerBalance = await getBalance(client, accountId);
  console.log(`\n💼 Deployer: ${accountId}`);
  console.log(`   Balance:  ${deployerBalance}`);

  const toFund = target
    ? Object.entries(CONTRACTS).filter(([key]) => key === target)
    : Object.entries(CONTRACTS);

  if (toFund.length === 0) {
    console.error(`❌ Unknown target "${target}". Use "core" or "pool".`);
    process.exit(1);
  }

  const results = [];
  for (const [, contract] of toFund) {
    const result = await fundContract(client, accountId, contract.id, contract.label, amount);
    results.push(result);
  }

  const finalBalance = await getBalance(client, accountId);
  console.log(`\n${"─".repeat(50)}`);
  console.log(`✅ All contracts funded!`);
  results.forEach(r => console.log(`   🏦 ${r.label}: ${r.after}`));
  console.log(`   💼 Deployer remaining: ${finalBalance}`);
  console.log(`\n🎯 Ready for demo! Each contract can pay out claims.`);
}

main().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
