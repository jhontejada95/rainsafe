// deploy-pool.js — Deploy RainSafePool to Hedera Testnet
require("dotenv").config();
const fs = require("fs");
const path = require("path");

const {
  Client,
  AccountId,
  PrivateKey,
  ContractCreateFlow,
  Hbar,
} = require("@hashgraph/sdk");

const solc = require("solc");

async function compile() {
  console.log("🔨 Compiling RainSafePool.sol...");
  const source = fs.readFileSync(
    path.join(__dirname, "../contracts/RainSafePool.sol"),
    "utf8"
  );

  const input = {
    language: "Solidity",
    sources: { "RainSafePool.sol": { content: source } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    output.errors.forEach((e) => {
      if (e.severity === "error") throw new Error(e.formattedMessage);
      console.warn("⚠️", e.message);
    });
  }

  const contract = output.contracts["RainSafePool.sol"]["RainSafePool"];
  const bytecode = contract.evm.bytecode.object;
  console.log(`✅ Compiled. Bytecode: ${bytecode.length / 2} bytes`);
  return { abi: contract.abi, bytecode };
}

async function deploy() {
  const accountId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
  const privateKey = PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY);

  const client = Client.forTestnet();
  client.setOperator(accountId, privateKey);
  client.setDefaultMaxTransactionFee(new Hbar(10));

  console.log(`🌐 Deploying RainSafePool to Hedera Testnet as ${accountId}...`);

  const { abi, bytecode } = await compile();

  const contractTx = await new ContractCreateFlow()
    .setBytecode(bytecode)
    .setGas(4000000)
    .execute(client);

  const receipt = await contractTx.getReceipt(client);
  const contractId = receipt.contractId.toString();

  console.log(`✅ RainSafePool deployed: ${contractId}`);
  console.log(`🔍 HashScan: https://hashscan.io/testnet/contract/${contractId}`);

  // Save to .env
  const envPath = path.join(__dirname, "../.env");
  fs.appendFileSync(envPath, `\nPOOL_CONTRACT_ID=${contractId}\n`);

  // Save ABI
  fs.writeFileSync(
    path.join(__dirname, "../contracts/RainSafePool.abi.json"),
    JSON.stringify(abi, null, 2)
  );

  console.log("\n🚀 Pool deployment complete!");
  console.log(`   Pool Contract: ${contractId}`);
}

deploy().catch(console.error);
