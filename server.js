// server.js — RainSafe API Server
// Bridges bot registrations with the frontend dashboard

require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const FARMS_FILE = path.join(__dirname, "../data/farms.json");

// ─── Ensure data directory exists ─────────────────────────────────────────────

function ensureDataDir() {
  const dir = path.join(__dirname, "../data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(FARMS_FILE)) fs.writeFileSync(FARMS_FILE, JSON.stringify([]));
}

function readFarms() {
  ensureDataDir();
  try {
    return JSON.parse(fs.readFileSync(FARMS_FILE, "utf8"));
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

// POST register new farm (called by bot)
app.post("/api/farms", (req, res) => {
  const farms = readFarms();
  const farm = {
    id: Date.now(),
    ...req.body,
    registeredAt: new Date().toISOString(),
  };
  farms.push(farm);
  writeFarms(farms);
  console.log(`✅ Farm registered: ${farm.name}`);
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

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", farms: readFarms().length });
});

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
  console.log(`🌐 RainSafe API running on http://localhost:${PORT}`);
  console.log(`   GET  /api/farms`);
  console.log(`   POST /api/farms`);
  console.log(`   PATCH /api/farms/:id`);
});
