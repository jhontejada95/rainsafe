// server.js — RainSafe API Server
// Bridges bot registrations with the frontend dashboard

require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const { raiseDisputeOnChain, registerFarmOnChain, getFarmCount } = require("./agent/hedera");

const app = express();
app.use(cors());
app.use(express.json());

const FARMS_FILE = path.join(__dirname, "data/farms.json");
const DISPUTES_FILE = path.join(__dirname, "data/disputes.json");
const PAYOUTS_FILE = path.join(__dirname, "data/payouts.json");

// ─── Ensure data directory exists ─────────────────────────────────────────────

function ensureDataDir() {
  const dir = path.join(__dirname, "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(FARMS_FILE)) fs.writeFileSync(FARMS_FILE, JSON.stringify([]));
  if (!fs.existsSync(DISPUTES_FILE)) fs.writeFileSync(DISPUTES_FILE, JSON.stringify([]));
}

function readDisputes() {
  ensureDataDir();
  try { return JSON.parse(fs.readFileSync(DISPUTES_FILE, "utf8")); } catch { return []; }
}

function writeDisputes(disputes) {
  ensureDataDir();
  fs.writeFileSync(DISPUTES_FILE, JSON.stringify(disputes, null, 2));
}

function readFarms() {
  ensureDataDir();
  try {
    return JSON.parse(fs.readFileSync(FARMS_FILE, "utf8"));
  } catch {
    return [];
  }
}

function readPayouts() {
  ensureDataDir();
  try {
    if (!fs.existsSync(PAYOUTS_FILE)) return [];
    return JSON.parse(fs.readFileSync(PAYOUTS_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeFarms(farms) {
  ensureDataDir();
  fs.writeFileSync(FARMS_FILE, JSON.stringify(farms, null, 2));
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET all farms
app.get("/api/farms", (req, res) => {
  const farms = readFarms();
  res.json(farms);
});

// POST register new farm (called by bot or dashboard)
app.post("/api/farms", async (req, res) => {
  const farms = readFarms();
  const farm = {
    id: Date.now(),
    ...req.body,
    registeredAt: new Date().toISOString(),
  };

  // Bot already wrote to farms.json via saveFarm() — skip duplicate push
  const existingIdx = farm.parcelHash
    ? farms.findIndex(f => f.parcelHash === farm.parcelHash)
    : -1;
  if (existingIdx !== -1) {
    farms[existingIdx] = { ...farms[existingIdx], ...farm };
    writeFarms(farms);
  } else {
    farms.push(farm);
    writeFarms(farms);
  }

  // If coming from dashboard (no txId yet), register on-chain
  if (!farm.txId && farm.source === "dashboard") {
    try {
      const result = await registerFarmOnChain(farm);
      if (result) {
        farm.txId = result.txId;
        farm.hashscanUrl = result.hashscanUrl;
        const idx = readFarms().findIndex(f => f.id === farm.id);
        if (idx !== -1) {
          const updated = readFarms();
          updated[idx] = { ...updated[idx], txId: result.txId, hashscanUrl: result.hashscanUrl };
          writeFarms(updated);
        }
      }
    } catch (e) {
      console.warn("On-chain registration skipped:", e.message);
    }
  }

  console.log(`✅ Farm registered: ${farm.name}${farm.txId ? " (on-chain)" : ""}`);
  res.json({ success: true, farm });
});

// PATCH update farm weather/score (called by agent)
app.patch("/api/farms/:id", (req, res) => {
  const farms = readFarms();
  const idx = farms.findIndex(f => f.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Farm not found" });

  farms[idx] = { ...farms[idx], ...req.body, updatedAt: new Date().toISOString() };
  writeFarms(farms);
  res.json({ success: true, farm: farms[idx] });
});

// DELETE farm
app.delete("/api/farms/:id", (req, res) => {
  let farms = readFarms();
  farms = farms.filter(f => f.id !== parseInt(req.params.id));
  writeFarms(farms);
  res.json({ success: true });
});

// GET payouts history
app.get("/api/payouts", (_req, res) => {
  res.json(readPayouts());
});

// GET all disputes
app.get("/api/disputes", (req, res) => {
  res.json(readDisputes());
});

// POST raise dispute (called by dashboard or bot)
app.post("/api/disputes", async (req, res) => {
  const { farmId, farmName, reason } = req.body;
  if (!reason) return res.status(400).json({ error: "reason required" });

  const dispute = {
    id: Date.now(),
    farmId: farmId ?? null,
    farmName: farmName || `Farm #${farmId}`,
    reason,
    status: "pending",
    raisedAt: new Date().toISOString(),
    txId: null,
    hashscanUrl: null,
  };

  // Try to record on-chain — validate farmId < farmCount first to avoid CONTRACT_REVERT
  const onChainId = parseInt(farmId);
  if (!isNaN(onChainId)) {
    try {
      const farmCount = await getFarmCount();
      if (farmCount !== null && onChainId >= farmCount) {
        console.warn(`⚠️  Dispute farmId ${onChainId} >= farmCount ${farmCount}, skipping on-chain call`);
      } else {
        const result = await raiseDisputeOnChain(onChainId, reason);
        if (result) {
          dispute.txId = result.txId;
          dispute.hashscanUrl = result.hashscanUrl;
        }
      }
    } catch (e) {
      console.warn("On-chain dispute skipped:", e.message);
    }
  }

  const disputes = readDisputes();
  disputes.push(dispute);
  writeDisputes(disputes);

  console.log(`⚖️  Dispute filed: ${dispute.farmName} — "${reason}"`);
  res.json({ success: true, dispute });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", farms: readFarms().length, disputes: readDisputes().length });
});

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
  console.log(`🌐 RainSafe API running on http://localhost:${PORT}`);
  console.log(`   GET  /api/farms`);
  console.log(`   POST /api/farms`);
  console.log(`   PATCH /api/farms/:id`);
});
