// hedera.js v3 — Hedera SDK client for RainSafe agent
// Fix: registerFarm without payable amount (avoids fee transfer revert)

const {
  Client,
  AccountId,
  PrivateKey,
  AccountCreateTransaction,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  Hbar,
} = require("@hashgraph/sdk");
const crypto = require("crypto");

require("dotenv").config();

function getClient() {
  const accountId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
  const privateKey = PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY);
  const client = Client.forTestnet();
  client.setOperator(accountId, privateKey);
  client.setDefaultMaxTransactionFee(new Hbar(5));
  return client;
}

async function createFarmTopic(farmId) {
  const client = getClient();
  const tx = await new TopicCreateTransaction()
    .setTopicMemo(`RainSafe Farm #${farmId} Climate Events`)
    .execute(client);
  const receipt = await tx.getReceipt(client);
  return receipt.topicId.toString();
}

async function recordClimateEventHCS(topicId, eventData) {
  const client = getClient();
  const message = JSON.stringify({ ...eventData, timestamp: new Date().toISOString(), version: "1.0" });
  const tx = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(message)
    .execute(client);
  const receipt = await tx.getReceipt(client);
  console.log(`📝 HCS event recorded. Sequence: ${receipt.topicSequenceNumber}`);
  return receipt.topicSequenceNumber.toString();
}

function walletToEvmAddress(walletStr) {
  if (!walletStr || walletStr === "0.0.0") {
    return AccountId.fromString(process.env.HEDERA_ACCOUNT_ID).toSolidityAddress();
  }
  if (/^0\.0\.\d+$/.test(walletStr)) {
    return AccountId.fromString(walletStr).toSolidityAddress();
  }
  if (/^0x[a-fA-F0-9]{40}$/.test(walletStr)) {
    return walletStr.slice(2); // SDK addAddress expects no 0x prefix
  }
  return AccountId.fromString(process.env.HEDERA_ACCOUNT_ID).toSolidityAddress();
}

async function registerFarmOnChain(farmData) {
  if (!process.env.CONTRACT_ID) return null;
  try {
    const client = getClient();

    const coverageHbar = farmData.coverage || 100;
    const coverageTinybars = coverageHbar * 100_000_000;
    // Premium: 1 tinybar minimum (avoid fee transfer issues in testnet)
    const premiumTinybars = 1;

    const parcelHash = farmData.parcelHash ||
      crypto.createHash("sha256")
        .update(`${Math.round((farmData.lat || 0) * 1000)},${Math.round((farmData.lon || farmData.lng || 0) * 1000)}`)
        .digest("hex")
        .substring(0, 16);

    const walletAddress = farmData.wallet || process.env.HEDERA_ACCOUNT_ID;
    const payoutEvmAddress = walletToEvmAddress(walletAddress);

    console.log(`🔗 Registering ${farmData.name} on-chain...`);
    console.log(`   Contract: ${process.env.CONTRACT_ID}`);
    console.log(`   Parcel hash: ${parcelHash}`);
    console.log(`   Payout address: ${payoutEvmAddress}`);

    const tx = await new ContractExecuteTransaction()
      .setContractId(process.env.CONTRACT_ID)
      .setGas(800000)
      .setPayableAmount(Hbar.fromTinybars(premiumTinybars))
      .setFunction(
        "registerFarm",
        new ContractFunctionParameters()
          .addString(farmData.name || "Farm")
          .addString(farmData.location || `${farmData.lat},${farmData.lon || farmData.lng}`)
          .addString(parcelHash)
          .addString(walletAddress)
          .addUint256(coverageTinybars)
          .addAddress(payoutEvmAddress)
      )
      .execute(client);

    const receipt = await tx.getReceipt(client);
    const txId = tx.transactionId.toString();
    const hashscanUrl = `https://hashscan.io/testnet/transaction/${txId.replace("@", "-").replace(/\./g, "-")}`;

    console.log(`✅ Farm registered on-chain!`);
    console.log(`   TX: ${txId}`);
    console.log(`   HashScan: https://hashscan.io/testnet/contract/${process.env.CONTRACT_ID}`);
    console.log(`   Status: ${receipt.status}`);

    // Record on HCS too
    const hcsTopic = process.env.HCS_TOPIC_FARM_0;
    if (hcsTopic) {
      await recordClimateEventHCS(hcsTopic, {
        type: "FARM_REGISTERED",
        name: farmData.name,
        location: farmData.location,
        parcelHash,
        coverage: coverageHbar,
        txId,
      });
    }

    return { txId, hashscanUrl: `https://hashscan.io/testnet/contract/${process.env.CONTRACT_ID}`, status: receipt.status.toString(), parcelHash };

  } catch (err) {
    console.error(`❌ On-chain registration failed: ${err.message}`);
    return null;
  }
}

async function verifyFarmOnChain(farmId) {
  if (!process.env.CONTRACT_ID) return null;
  try {
    const client = getClient();
    const tx = await new ContractExecuteTransaction()
      .setContractId(process.env.CONTRACT_ID)
      .setGas(100000)
      .setFunction("verifyFarm", new ContractFunctionParameters().addUint256(farmId))
      .execute(client);
    const receipt = await tx.getReceipt(client);
    console.log(`✅ Farm #${farmId} verified on-chain`);
    return receipt;
  } catch (err) {
    console.log(`⚠️  Verify skipped: ${err.message}`);
    return null;
  }
}

async function raiseDisputeOnChain(farmId, reason) {
  if (!process.env.CONTRACT_ID) return null;
  try {
    const client = getClient();
    const tx = await new ContractExecuteTransaction()
      .setContractId(process.env.CONTRACT_ID)
      .setGas(400000)
      .setFunction("raiseDispute",
        new ContractFunctionParameters().addUint256(farmId).addString(reason))
      .execute(client);
    const txId = tx.transactionId.toString();
    console.log(`⚖️  Dispute raised on-chain. TX: ${txId}`);
    const hashscanUrl = `https://hashscan.io/testnet/transaction/${txId.replace("@", "-").replace(/\./g, "-")}`;
    return { txId, hashscanUrl };
  } catch (err) {
    console.log(`⚠️  Dispute skipped: ${err.message}`);
    return null;
  }
}

async function triggerPayout(farmId, eventType, hcsTopicId) {
  if (!process.env.CONTRACT_ID) return;
  try {
    const client = getClient();
    const tx = await new ContractExecuteTransaction()
      .setContractId(process.env.CONTRACT_ID)
      .setGas(500000)
      .setFunction("triggerClimateEvent",
        new ContractFunctionParameters()
          .addUint256(farmId)
          .addString(eventType)
          .addString(hcsTopicId))
      .execute(client);
    const receipt = await tx.getReceipt(client);
    const txId = tx.transactionId.toString();
    console.log(`💸 Payout triggered for Farm #${farmId}. TX: ${txId}`);
    return { receipt, txId };
  } catch (err) {
    console.log(`⚠️  Payout skipped: ${err.message}`);
  }
}

async function createFarmerWallet() {
  try {
    const client = getClient();
    const newKey = PrivateKey.generateECDSA();
    const tx = await new AccountCreateTransaction()
      .setKey(newKey.publicKey)
      .setInitialBalance(new Hbar(1))
      .execute(client);
    const receipt = await tx.getReceipt(client);
    const accountId = receipt.accountId.toString();
    console.log(`👛 New farmer wallet created: ${accountId}`);
    return {
      accountId,
      privateKey: newKey.toStringRaw(),
      publicKey: newKey.publicKey.toString(),
    };
  } catch (err) {
    console.error(`❌ Wallet creation failed: ${err.message}`);
    return null;
  }
}

async function updateResilienceScore(farmId, score) {
  if (!process.env.CONTRACT_ID) return;
  try {
    const client = getClient();
    const tx = await new ContractExecuteTransaction()
      .setContractId(process.env.CONTRACT_ID)
      .setGas(200000)
      .setFunction("updateResilienceScore",
        new ContractFunctionParameters().addUint256(farmId).addUint8(score))
      .execute(client);
    console.log(`🧠 Score updated for Farm #${farmId}: ${score}/100`);
  } catch (err) {
    console.log(`⚠️  Score update skipped: ${err.message}`);
  }
}

module.exports = {
  getClient,
  createFarmTopic,
  createFarmerWallet,
  recordClimateEventHCS,
  registerFarmOnChain,
  verifyFarmOnChain,
  raiseDisputeOnChain,
  triggerPayout,
  updateResilienceScore,
};
