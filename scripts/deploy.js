// deploy.js — RainSafe deploy via Hedera SDK only (no Hardhat)
require("dotenv").config();
const fs = require("fs");
const path = require("path");

const {
  Client,
  AccountId,
  PrivateKey,
  ContractCreateFlow,
  TopicCreateTransaction,
  Hbar,
} = require("@hashgraph/sdk");

const solc = require("solc");

async function compile() {
  console.log("🔨 Compiling RainSafe.sol...");
  const source = fs.readFileSync(
    path.join(__dirname, "../contracts/RainSafe.sol"),
    "utf8"
  );

  const input = {
    language: "Solidity",
    sources: { "RainSafe.sol": { content: source } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    output.errors.forEach((e) => {
      if (e.severity === "error") throw new Error(e.formattedMessage);
      console.warn("⚠️ ", e.message);
    });
  }

  const contract = output.contracts["RainSafe.sol"]["RainSafe"];
  const bytecode = contract.evm.bytecode.object;
  console.log(`✅ Compiled. Bytecode size: ${bytecode.length / 2} bytes`);

  return { abi: contract.abi, bytecode };
}

async function deploy() {
  const accountId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
  const privateKey = PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY);

  const client = Client.forTestnet();
  client.setOperator(accountId, privateKey);
  client.setDefaultMaxTransactionFee(new Hbar(10));

  console.log(`🌐 Deploying to Hedera Testnet as ${accountId}...`);

  const { abi, bytecode } = await compile();

  const bytecodeSizeBytes = bytecode.length / 2;
  const estimatedGas = 4000000;
  console.log(`⛽ Using gas: ${estimatedGas}`);

  const contractTx = await new ContractCreateFlow()
    .setBytecode(bytecode)
    .setGas(estimatedGas)
    .execute(client);

  const contractReceipt = await contractTx.getReceipt(client);
  const contractId = contractReceipt.contractId.toString();
  console.log(`✅ Contract deployed: ${contractId}`);
  console.log(`🔍 HashScan: https://hashscan.io/testnet/contract/${contractId}`);

  console.log("\n📝 Creating HCS topics...");
  const topicIds = [];

  for (let i = 0; i < 3; i++) {
    const topicTx = await new TopicCreateTransaction()
      .setTopicMemo(`RainSafe Farm #${i} Climate Events`)
      .execute(client);
    const topicReceipt = await topicTx.getReceipt(client);
    topicIds.push(topicReceipt.topicId.toString());
    console.log(`  Farm #${i}: ${topicReceipt.topicId}`);
  }

  const envPath = path.join(__dirname, "../.env");
  const additions = `\n# Generated ${new Date().toISOString()}\nCONTRACT_ID=${contractId}\nHCS_TOPIC_FARM_0=${topicIds[0]}\nHCS_TOPIC_FARM_1=${topicIds[1]}\nHCS_TOPIC_FARM_2=${topicIds[2]}\n`;
  fs.appendFileSync(envPath, additions);

  fs.writeFileSync(
    path.join(__dirname, "../contracts/RainSafe.abi.json"),
    JSON.stringify(abi, null, 2)
  );

  console.log("\n🚀 Deployment complete!");
  console.log(`   Contract ID: ${contractId}`);
}

deploy().catch(console.error);
