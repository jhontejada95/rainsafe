// monitor.js — RainSafe main agent loop
// Monitors registered farms, detects climate events, triggers payouts

require("dotenv").config();
const { evaluateClimateCondition } = require("./weather");
const {
  recordClimateEventHCS,
  triggerPayout,
  updateResilienceScore,
} = require("./hedera");

// ─── Mock farm registry ───────────────────────────────────────────────────────

const FARMS = [
  {
    id: 0,
    name: "Finca El Progreso",
    location: "Bogotá, Colombia",
    latitude: 4.711,
    longitude: -74.0721,
    hcsTopicId: process.env.HCS_TOPIC_FARM_0 || null,
    coverageHbar: 100,
  },
  {
    id: 1,
    name: "Rancho Las Palmas",
    location: "Caracas, Venezuela",
    latitude: 10.4806,
    longitude: -66.9036,
    hcsTopicId: process.env.HCS_TOPIC_FARM_1 || null,
    coverageHbar: 100,
  },
  {
    id: 2,
    name: "Parcela San Miguel",
    location: "Oaxaca, México",
    latitude: 17.0732,
    longitude: -96.7266,
    hcsTopicId: process.env.HCS_TOPIC_FARM_2 || null,
    coverageHbar: 100,
  },
];

const processedEvents = new Set();

// ─── AI Resilience Score Engine ──────────────────────────────────────────────

function computeResilienceScore(farm, weatherData, eventHistory) {
  let score = 50;

  const { totalMm, averageDailyMm, riskLevel } = weatherData;

  if (riskLevel === "low") score += 25;
  else if (riskLevel === "medium") score += 10;
  else score -= 10;

  if (averageDailyMm >= 3 && averageDailyMm <= 15) score += 20;
  else if (averageDailyMm >= 1) score += 10;

  const farmEvents = eventHistory.filter((e) => e.farmId === farm.id);
  score -= farmEvents.length * 8;

  if (totalMm > 20 && farmEvents.length > 0) score += 15;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function eventKey(farmId, eventType) {
  const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  return `${farmId}-${eventType}-${week}`;
}

// ─── Main Monitor Loop ────────────────────────────────────────────────────────

async function monitorFarm(farm, eventHistory) {
  console.log(`\n🌱 Monitoring: ${farm.name} (${farm.location})`);

  try {
    const weather = await evaluateClimateCondition(farm.latitude, farm.longitude);

    console.log(
      `   Rain (7d): ${weather.totalMm.toFixed(1)}mm | Status: ${weather.status} | Risk: ${weather.riskLevel}`
    );

    const score = computeResilienceScore(farm, weather, eventHistory);
    console.log(`   🧠 Resilience Score: ${score}/100`);

    // Only call contract if CONTRACT_ID is set
    if (process.env.CONTRACT_ID) {
      await updateResilienceScore(farm.id, score);
    }

    if (weather.status === "alert" && weather.eventType) {
      const key = eventKey(farm.id, weather.eventType);

      if (processedEvents.has(key)) {
        console.log(`   ⏭️  Event already processed this week, skipping`);
        return { farm, weather, score, action: "skipped" };
      }

      console.log(`   🚨 ALERT: ${weather.eventType.toUpperCase()} detected!`);

      // Record on HCS first (immutable proof)
      let hcsSequence = "demo-sequence";
      if (farm.hcsTopicId) {
        try {
          hcsSequence = await recordClimateEventHCS(farm.hcsTopicId, {
            farmId: farm.id,
            farmName: farm.name,
            location: farm.location,
            eventType: weather.eventType,
            totalRainfallMm: weather.totalMm,
            riskLevel: weather.riskLevel,
            resilienceScore: score,
          });
          console.log(`   📝 HCS recorded. Sequence: ${hcsSequence}`);
        } catch (hcsErr) {
          console.log(`   ⚠️  HCS record skipped: ${hcsErr.message}`);
        }
      }

      // Trigger payout via smart contract
      if (process.env.CONTRACT_ID) {
        try {
          await triggerPayout(farm.id, weather.eventType, farm.hcsTopicId || "demo");
        } catch (payErr) {
          console.log(`   ⚠️  Payout skipped: ${payErr.message}`);
        }
      }

      processedEvents.add(key);
      eventHistory.push({ farmId: farm.id, eventType: weather.eventType, timestamp: Date.now() });

      console.log(`   ✅ Event processed. HCS sequence: ${hcsSequence}`);
      return { farm, weather, score, action: "payout_triggered", eventType: weather.eventType };
    }

    return { farm, weather, score, action: "monitoring" };
  } catch (err) {
    console.error(`   ❌ Error monitoring ${farm.name}:`, err.message);
    return { farm, action: "error", error: err.message };
  }
}

async function runMonitorCycle(eventHistory = []) {
  console.log("\n" + "═".repeat(50));
  console.log(`🔄 RainSafe Monitor — ${new Date().toISOString()}`);
  console.log("═".repeat(50));

  const results = [];
  for (const farm of FARMS) {
    const result = await monitorFarm(farm, eventHistory);
    results.push(result);
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log("\n📊 Cycle Summary:");
  results.forEach((r) => {
    if (r.action === "payout_triggered") {
      console.log(`  🔴 ${r.farm.name}: PAYOUT (${r.eventType})`);
    } else if (r.action === "monitoring") {
      console.log(`  🟢 ${r.farm.name}: OK — Score ${r.score}/100`);
    } else if (r.action === "skipped") {
      console.log(`  ⏭️  ${r.farm.name}: already processed`);
    } else {
      console.log(`  ⚪ ${r.farm.name}: ${r.action}`);
    }
  });

  return results;
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

async function main() {
  console.log("🌧️  RainSafe Agent starting...");

  if (!process.env.CONTRACT_ID) {
    console.log("ℹ️  No CONTRACT_ID in .env — running in observation mode (no on-chain calls)");
  } else {
    console.log(`✅ Contract: ${process.env.CONTRACT_ID}`);
  }

  const eventHistory = [];
  await runMonitorCycle(eventHistory);

  const INTERVAL_MS = 6 * 60 * 60 * 1000;
  console.log(`\n⏰ Next check in 6 hours. Agent running...`);
  setInterval(() => runMonitorCycle(eventHistory), INTERVAL_MS);
}

main().catch(console.error);
