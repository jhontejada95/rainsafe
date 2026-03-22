// fund-contract.js — Send HBAR to RainSafe contract so it can pay out
// Usage: node scripts/fund-contract.js [amount_hbar]
// Default: 50 HBAR

require("dotenv").config();
const {
  Client,
  AccountId,
  PrivateKey,
  TransferTransaction,
  Hbar,
  AccountBalanceQuery,
} = require("@hashgraph/sdk");

async function main() {
  const amountHbar = parseFloat(process.argv[2]) || 50;
  const contractId = process.env.CONTRACT_ID || "0.0.8324803";
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;

  if (!accountId || !privateKey) {
    console.error("❌ Missing HEDERA_ACCOUNT_ID or HEDERA_PRIVATE_KEY in .env");
    process.exit(1);
  }

  const client = Client.forTestnet();
  client.setOperator(AccountId.fromString(accountId), PrivateKey.fromStringECDSA(privateKey));

  // Check current balance
  const contractBalance = await new AccountBalanceQuery()
    .setAccountId(AccountId.fromString(contractId))
    .execute(client);
  const walletBalance = await new AccountBalanceQuery()
    .setAccountId(AccountId.fromString(accountId))
    .execute(client);

  console.log(`\n💼 Deployer balance:  ${walletBalance.hbars.toString()}`);
  console.log(`🏦 Contract balance:  ${contractBalance.hbars.toString()}`);
  console.log(`\n📤 Sending ${amountHbar} HBAR to contract ${contractId}...`);

  const tx = await new TransferTransaction()
    .addHbarTransfer(AccountId.fromString(accountId), new Hbar(-amountHbar))
    .addHbarTransfer(AccountId.fromString(contractId), new Hbar(amountHbar))
    .execute(client);

  const receipt = await tx.getReceipt(client);
  const txId = tx.transactionId.toString();

  console.log(`✅ Transfer complete!`);
  console.log(`   Status: ${receipt.status}`);
  console.log(`   TX: ${txId}`);
  console.log(`   HashScan: https://hashscan.io/testnet/transaction/${txId}`);

  // Show new balance
  const newBalance = await new AccountBalanceQuery()
    .setAccountId(AccountId.fromString(contractId))
    .execute(client);
  console.log(`\n🏦 Contract new balance: ${newBalance.hbars.toString()}`);
  console.log(`\n✅ Contract can now pay out up to ${Math.floor(amountHbar / 1.03)} HBAR in coverage.`);
}

main().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
