/**
 * update-ids.js — Run this after every deploy to sync hardcoded contract IDs
 * Usage: node scripts/update-ids.js
 *
 * Updates:
 *   - frontend/src/components/PoolDashboard.jsx (EVM address)
 *   - frontend/src/App.jsx (footer HashScan link)
 *   - index.html (landing page)
 *   - README.md
 *   - CLAUDE.md
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

// ── Read new IDs from .env ──────────────────────────────────────────────────

const newCore = process.env.CONTRACT_ID;
const newPool = process.env.POOL_CONTRACT_ID;
const hcs0    = process.env.HCS_TOPIC_FARM_0;
const hcs1    = process.env.HCS_TOPIC_FARM_1;
const hcs2    = process.env.HCS_TOPIC_FARM_2;

if (!newCore || !newPool) {
  console.error("❌ CONTRACT_ID or POOL_CONTRACT_ID not set in .env");
  process.exit(1);
}

// ── Convert Hedera account ID → EVM address (40-char hex, with 0x) ──────────

function hederaToEvm(hederaId) {
  const num = parseInt(hederaId.split(".")[2]);
  return "0x" + num.toString(16).padStart(40, "0");
}

const newCoreEvm = hederaToEvm(newCore);
const newPoolEvm = hederaToEvm(newPool);

// Old values (from previous deploy — replaced wherever found)
const OLD_CORE    = "0.0.8324803";
const OLD_POOL    = "0.0.8324807";
const OLD_HCS_0   = "0.0.8324808";
const OLD_HCS_1   = "0.0.8324810";
const OLD_HCS_2   = "0.0.8324811";
const OLD_CORE_EVM = "0x00000000000000000000000000000000007F06C3";
const OLD_POOL_EVM = "0x00000000000000000000000000000000007F06C7";

console.log(`\n🔄 Updating contract IDs...`);
console.log(`   Core:  ${OLD_CORE} → ${newCore}  (${newCoreEvm})`);
console.log(`   Pool:  ${OLD_POOL} → ${newPool}  (${newPoolEvm})`);
if (hcs0) console.log(`   HCS 0: ${OLD_HCS_0} → ${hcs0}`);
if (hcs1) console.log(`   HCS 1: ${OLD_HCS_1} → ${hcs1}`);
if (hcs2) console.log(`   HCS 2: ${OLD_HCS_2} → ${hcs2}`);

// ── Utility ──────────────────────────────────────────────────────────────────

function replaceInFile(relPath, replacements) {
  const absPath = path.join(ROOT, relPath);
  if (!fs.existsSync(absPath)) {
    console.warn(`   ⚠️  Not found: ${relPath}`);
    return;
  }
  let content = fs.readFileSync(absPath, "utf8");
  let changed = false;
  for (const [from, to] of replacements) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(absPath, content, "utf8");
    console.log(`   ✅ ${relPath}`);
  } else {
    console.log(`   ─  ${relPath} (no changes needed)`);
  }
}

// ── Apply replacements ────────────────────────────────────────────────────────

const coreReplacements = [[OLD_CORE, newCore]];
const poolReplacements = [[OLD_POOL, newPool]];
const evmReplacements  = [
  [OLD_CORE_EVM, newCoreEvm],
  [OLD_POOL_EVM, newPoolEvm],
];
const hcsReplacements = [
  [OLD_HCS_0, hcs0 || OLD_HCS_0],
  [OLD_HCS_1, hcs1 || OLD_HCS_1],
  [OLD_HCS_2, hcs2 || OLD_HCS_2],
];
const all = [...coreReplacements, ...poolReplacements, ...evmReplacements, ...hcsReplacements];

replaceInFile("frontend/src/components/PoolDashboard.jsx", [...poolReplacements, ...evmReplacements]);
replaceInFile("frontend/src/App.jsx", coreReplacements);
replaceInFile("index.html", [...coreReplacements, ...poolReplacements]);
replaceInFile("README.md", all);
replaceInFile("CLAUDE.md", all);
replaceInFile(".env.example", all);

console.log(`\n✅ Done! New IDs active:`);
console.log(`   Core: ${newCore}  →  ${newCoreEvm}`);
console.log(`   Pool: ${newPool}  →  ${newPoolEvm}`);
console.log(`\n📦 Next steps:`);
console.log(`   1. git add -A && git commit -m "Redeploy v3 — payout to farmer wallet"`);
console.log(`   2. node scripts/fund-contract.js 200 core`);
console.log(`   3. node scripts/fund-contract.js 50 pool`);
console.log(`   4. cd frontend && npm run build  (rebuild with new Pool EVM address)`);
