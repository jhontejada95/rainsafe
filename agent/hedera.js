// hedera.js — Hedera SDK client for RainSafe agent

const {
  Client,
  AccountId,
  PrivateKey,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  Hbar,
} = require("@hashgraph/sdk");

require("dotenv").config();

// ─── Client Setup ────────────────────────────────────────────────────────────

function getClient() {
  const accountId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
  const privateKey = PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY);

  const client = Client.forTestnet();
  client.setOperator(accountId, privateKey);
  client.setDefaultMaxTransactionFee(new Hbar(2));
  return client;
}

// ─── HCS: Consensus Service ──────────────────────────────────────────────────

async function createFarmTopic(farmId) {
  const client = getClient();
  const tx = await new TopicCreateTransaction()
    .setTopicMemo(`RainSafe Farm #${farmId} Climate Events`)
    .execute(client);

  const receipt = await tx.getReceipt(client);
  const topicId = receipt.topicId.toString();
  console.log(`✅ HCS Topic created for Farm #${farmId}: ${topicId}`);
  return topicId;
}

async function recordClimateEventHCS(topicId, eventData) {
  const client = getClient();
  const message = JSON.stringify({
    ...eventData,
    timestamp: new Date().toISOString(),
    version: "1.0",
  });

  const tx = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(message)
    .execute(client);

  const receipt = await tx.getReceipt(client);
  console.log(`📝 Climate event recorded on HCS. Sequence: ${receipt.topicSequenceNumber}`);
  return receipt.topicSequenceNumber.toString();
}

// ─── Smart Contract ──────────────────────────────────────────────────────────

async function triggerPayout(farmId, eventType, hcsTopicId) {
  if (!process.env.CONTRACT_ID) return;
  try {
    const client = getClient();
    const tx = await new ContractExecuteTransaction()
      .setContractId(process.env.CONTRACT_ID)
      .setGas(200000)
      .setFunction(
        "triggerClimateEvent",
        new ContractFunctionParameters()
          .addUint256(farmId)
          .addString(eventType)
          .addString(hcsTopicId)
      )
      .execute(client);

    const receipt = await tx.getReceipt(client);
    console.log(`💸 Payout triggered for Farm #${farmId}. Status: ${receipt.status}`);
    return receipt;
  } catch (err) {
    console.log(`   ⚠️  Payout contract call skipped: ${err.message}`);
  }
}

async function updateResilienceScore(farmId, score) {
  if (!process.env.CONTRACT_ID) return;
  try {
    const client = getClient();
    const tx = await new ContractExecuteTransaction()
      .setContractId(process.env.CONTRACT_ID)
      .setGas(200000)
      .setFunction(
        "updateResilienceScore",
        new ContractFunctionParameters()
          .addUint256(farmId)
          .addUint8(score)
      )
      .execute(client);

    const receipt = await tx.getReceipt(client);
    console.log(`🧠 Score updated for Farm #${farmId}: ${score}/100`);
    return receipt;
  } catch (err) {
    console.log(`   ⚠️  Score update skipped: ${err.message}`);
  }
}

module.exports = {
  getClient,
  createFarmTopic,
  recordClimateEventHCS,
  triggerPayout,
  updateResilienceScore,
};
