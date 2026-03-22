/**
 * RainSafe v2 — Deploy both contracts with fee + carencia
 * node scripts/deploy-v2.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const {
  Client, AccountId, PrivateKey,
  ContractCreateFlow, ContractFunctionParameters,
  TopicCreateTransaction, Hbar,
} = require("@hashgraph/sdk");
const solc = require("solc");

const client = Client.forTestnet();

async function compileContract(name) {
  console.log(`🔨 Compiling ${name}.sol...`);
  const src = fs.readFileSync(path.join(__dirname, `../contracts/${name}.sol`), "utf8");
  const input = {
    language: "Solidity",
    sources: { [`${name}.sol`]: { content: src } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } },
    },
  };
  const out = JSON.parse(solc.compile(JSON.stringify(input)));
  if (out.errors) {
    out.errors.forEach(e => { if (e.severity === "error") throw new Error(e.formattedMessage); });
  }
  const c = out.contracts[`${name}.sol`][name];
  console.log(`   ✅ ${name}: ${c.evm.bytecode.object.length / 2} bytes`);
  return { abi: c.abi, bytecode: c.evm.bytecode.object };
}

async function deployContract(name, bytecode, abi, constructorParams) {
  console.log(`🚀 Deploying ${name}...`);
  let tx = new ContractCreateFlow().setBytecode(bytecode).setGas(4000000);
  if (constructorParams) tx = tx.setConstructorParameters(constructorParams);
  const receipt = await (await tx.execute(client)).getReceipt(client);
  const id = receipt.contractId.toString();
  console.log(`   ✅ ${name}: ${id}`);
  console.log(`   🔍 https://hashscan.io/testnet/contract/${id}`);
  fs.writeFileSync(path.join(__dirname, `../contracts/${name}.abi.json`), JSON.stringify(abi, null, 2));
  return id;
}

async function main() {
  const accountId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
  const privateKey = PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY);
  client.setOperator(accountId, privateKey);
  client.setDefaultMaxTransactionFee(new Hbar(15));

  const feeRecipientSolidity = accountId.toSolidityAddress();
  const params = new ContractFunctionParameters().addAddress(feeRecipientSolidity);

  // Deploy core contract
  const { abi: abi1, bytecode: bc1 } = await compileContract("RainSafe");
  const coreId = await deployContract("RainSafe", bc1, abi1, params);

  // Deploy pool contract
  const { abi: abi2, bytecode: bc2 } = await compileContract("RainSafePool");
  const poolId = await deployContract("RainSafePool", bc2, abi2, params);

  // Create HCS topics
  console.log("\n📝 Creating HCS topics...");
  const topicIds = [];
  for (let i = 0; i < 3; i++) {
    const receipt = await (
      await new TopicCreateTransaction()
        .setTopicMemo(`RainSafe v2 Farm #${i} Climate Events`)
        .execute(client)
    ).getReceipt(client);
    topicIds.push(receipt.topicId.toString());
    console.log(`   Farm #${i}: ${receipt.topicId}`);
  }

  // Update .env
  const envLines = [
    `\n# RainSafe v2 — ${new Date().toISOString()}`,
    `CONTRACT_ID=${coreId}`,
    `POOL_CONTRACT_ID=${poolId}`,
    `HCS_TOPIC_FARM_0=${topicIds[0]}`,
    `HCS_TOPIC_FARM_1=${topicIds[1]}`,
    `HCS_TOPIC_FARM_2=${topicIds[2]}`,
  ].join("\n");

  const envPath = path.join(__dirname, "../.env");
  const existing = fs.readFileSync(envPath, "utf8");
  // Remove old contract lines
  const cleaned = existing
    .split("\n")
    .filter(l => !l.startsWith("CONTRACT_ID=") && !l.startsWith("POOL_CONTRACT_ID=") && !l.startsWith("HCS_TOPIC_"))
    .join("\n");
  fs.writeFileSync(envPath, cleaned + envLines + "\n");

  console.log("\n🎉 RainSafe v2 deployment complete!");
  console.log("═══════════════════════════════════");
  console.log(`  Core:  ${coreId}`);
  console.log(`  Pool:  ${poolId}`);
  console.log(`  HCS:   ${topicIds.join(", ")}`);
  console.log("  Fee:   3% on premiums + payouts");
  console.log("  Carencia: 30 days");
  console.log("═══════════════════════════════════");
}

main().catch(console.error);
