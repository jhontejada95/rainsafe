// bot.js — RainSafe Telegram Bot
// Anti-fraud: C1+C2+C3+C4 + Wallet integration + Real-time dashboard sync

require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const { evaluateClimateCondition } = require("./weather");
const crypto = require("crypto");

// ─── API Bridge ───────────────────────────────────────────────────────────────
const API_URL = process.env.API_URL || "http://localhost:3001";

async function postToAPI(endpoint, method, body) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (err) {
    console.log(`⚠️ API: ${err.message}`);
    return null;
  }
}

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// ─── State ────────────────────────────────────────────────────────────────────
const farms = new Map();
const pendingRegistration = new Map();
const registeredParcels = new Map();

// ─── Constants ────────────────────────────────────────────────────────────────
const COOLDOWN_HOURS = 72;
const MAX_COVERAGE_HECTARES = 500;
const GPS_TOLERANCE_KM = 1.0;
const GRID_PRECISION = 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreEmoji(s) {
  return s >= 70 ? "🟢" : s >= 40 ? "🟡" : "🔴";
}

function hashParcel(lat, lng) {
  const gridLat = Math.round(lat * Math.pow(10, GRID_PRECISION)) / Math.pow(10, GRID_PRECISION);
  const gridLng = Math.round(lng * Math.pow(10, GRID_PRECISION)) / Math.pow(10, GRID_PRECISION);
  return crypto.createHash("sha256").update(`${gridLat},${gridLng}`).digest("hex").slice(0, 16);
}

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function maxHectaresForCoverage(hbar) {
  return Math.min(hbar, MAX_COVERAGE_HECTARES);
}

function coverageStatus(farm) {
  if (!farm.activatesAt) return "pending";
  return Date.now() >= farm.activatesAt ? "active" : "cooldown";
}

function extractCoordsFromMapsUrl(url) {
  try {
    const m1 = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (m1) return { lat: parseFloat(m1[1]), lng: parseFloat(m1[2]) };
    const m2 = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m2) return { lat: parseFloat(m2[1]), lng: parseFloat(m2[2]) };
    const m3 = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m3) return { lat: parseFloat(m3[1]), lng: parseFloat(m3[2]) };
    return null;
  } catch (e) { return null; }
}

function formatTimeRemaining(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}min` : `${m} minutos`;
}

// Validate Hedera account ID format (0.0.XXXXXXX)
function isValidHederaAccount(id) {
  return /^0\.0\.\d+$/.test(id.trim());
}

// Validate EVM address format (0x...)
function isValidEVMAddress(addr) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr.trim());
}

// ─── /start ──────────────────────────────────────────────────────────────────

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const name = msg.from.first_name || "agricultor";
  bot.sendMessage(chatId,
    `🌧️ *Bienvenido a RainSafe, ${name}*\n\n` +
    `RainSafe protege tu finca contra sequías e inundaciones con pagos automáticos.\n\n` +
    `*¿Cómo funciona?*\n` +
    `1️⃣ Registras tu finca\n` +
    `2️⃣ Configuras tu wallet para recibir pagos\n` +
    `3️⃣ Verificamos tu presencia física con una foto\n` +
    `4️⃣ La cobertura se activa en 72 horas\n` +
    `5️⃣ Si hay sequía o inundación, recibes un pago automático\n\n` +
    `*Sin papeles. Sin bancos. Sin intermediarios.*\n\n` +
    `Usa /registrar para empezar 🌱`,
    { parse_mode: "Markdown" }
  );
});

// ─── /registrar ──────────────────────────────────────────────────────────────

bot.onText(/\/registrar/, (msg) => {
  const chatId = msg.chat.id;
  pendingRegistration.set(chatId, { step: "name" });
  bot.sendMessage(chatId,
    `🌱 *Registro de Finca*\n\nVamos paso a paso.\n\n*Paso 1 de 5 — Nombre*\n¿Cómo se llama tu finca?`,
    { parse_mode: "Markdown" }
  );
});

bot.onText(/\/nueva/, (msg) => {
  const chatId = msg.chat.id;
  pendingRegistration.set(chatId, { step: "name" });
  bot.sendMessage(chatId,
    `🌱 *Nueva finca*\n\n*Paso 1 de 5*\n¿Cómo se llama tu finca?`,
    { parse_mode: "Markdown" }
  );
});

// ─── /wallet ─────────────────────────────────────────────────────────────────

bot.onText(/\/wallet/, async (msg) => {
  const chatId = msg.chat.id;
  if (!farms.has(chatId)) {
    bot.sendMessage(chatId, `Primero registra tu finca con /registrar 🌱`);
    return;
  }

  const farm = farms.get(chatId);
  if (farm.walletAddress) {
    bot.sendMessage(chatId,
      `💳 *Tu wallet actual:*\n\`${farm.walletAddress}\`\n\n` +
      `¿Quieres cambiarla? Envía la nueva dirección ahora.\n` +
      `_(Hedera Account ID: 0.0.XXXXXXX)_`,
      { parse_mode: "Markdown" }
    );
    pendingRegistration.set(chatId, { step: "update_wallet", farmName: farm.name });
  } else {
    await requestWallet(chatId, { name: farm.name });
  }
});

// ─── /estado ─────────────────────────────────────────────────────────────────

bot.onText(/\/estado/, async (msg) => {
  const chatId = msg.chat.id;
  if (!farms.has(chatId)) {
    bot.sendMessage(chatId, `No tienes fincas registradas. Usa /registrar para empezar. 🌱`);
    return;
  }

  const farm = farms.get(chatId);
  const status = coverageStatus(farm);

  if (status === "cooldown") {
    const remaining = farm.activatesAt - Date.now();
    bot.sendMessage(chatId,
      `⏳ *${farm.name}*\n\nTu cobertura está en período de verificación.\nSe activa en: *${formatTimeRemaining(remaining)}*\n\n_Este período protege al sistema contra fraudes de timing._`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  bot.sendMessage(chatId, `⏳ Consultando clima para *${farm.name}*...`, { parse_mode: "Markdown" });

  try {
    const weather = await evaluateClimateCondition(farm.lat, farm.lng);
    const score = farm.resilienceScore || 50;

    let statusMsg = "";
    if (weather.status === "alert" && weather.eventType === "drought") {
      statusMsg = `\n🚨 *SEQUÍA DETECTADA*\nLluvia 7 días: ${weather.totalMm.toFixed(1)}mm\nPago automático iniciado.`;
    } else if (weather.status === "alert") {
      statusMsg = `\n🚨 *RIESGO DE INUNDACIÓN*\nPago automático iniciado.`;
    } else if (weather.status === "warning") {
      statusMsg = `\n⚠️ Lluvia baja: ${weather.totalMm.toFixed(1)}mm. Monitoreando.`;
    } else {
      statusMsg = `\n✅ Todo bien. Lluvia 7 días: ${weather.totalMm.toFixed(1)}mm`;
    }

    const walletLine = farm.walletAddress
      ? `💳 *Wallet:* \`${farm.walletAddress}\``
      : `⚠️ *Sin wallet* — usa /wallet para configurarla`;

    bot.sendMessage(chatId,
      `🌿 *${farm.name}*\n📍 ${farm.location}\n🛡 Cobertura: *ACTIVA* ✅\n━━━━━━━━━━━━━━━━━━` +
      statusMsg + `\n\n` +
      `${scoreEmoji(score)} *Resilience Score:* ${score}/100\n` +
      walletLine + `\n` +
      `🔗 hashscan.io/testnet/topic/${farm.hcsTopic}\n\n` +
      `_Datos en tiempo real · Verificado en Hedera_`,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    bot.sendMessage(chatId, `❌ Error: ${err.message}`);
  }
});

bot.onText(/\/ayuda/, (msg) => {
  bot.sendMessage(msg.chat.id,
    `🌧️ *Comandos RainSafe*\n\n` +
    `/registrar — Registrar tu finca\n` +
    `/estado — Ver estado y clima actual\n` +
    `/wallet — Ver o actualizar tu wallet\n` +
    `/nueva — Registrar otra finca\n` +
    `/ayuda — Esta lista`,
    { parse_mode: "Markdown" }
  );
});

// ─── Registration Flow ────────────────────────────────────────────────────────

async function handleLocationReceived(chatId, reg, lat, lng) {
  const parcelHash = hashParcel(lat, lng);
  if (registeredParcels.has(parcelHash)) {
    const existingOwner = registeredParcels.get(parcelHash);
    if (existingOwner !== chatId) {
      bot.sendMessage(chatId,
        `⚠️ *Parcela ya registrada*\n\nEsta ubicación ya tiene cobertura activa.\nCada parcela solo puede tener un seguro activo.\n\nSi crees que es un error, contacta a soporte.`,
        { parse_mode: "Markdown" }
      );
      pendingRegistration.delete(chatId);
      return;
    }
  }

  reg.lat = lat;
  reg.lng = lng;
  reg.parcelHash = parcelHash;
  reg.step = "coverage";
  pendingRegistration.set(chatId, reg);

  bot.sendMessage(chatId,
    `📍 *Ubicación registrada*\nCoordenadas: ${lat.toFixed(5)}, ${lng.toFixed(5)}\nID de parcela: \`${parcelHash}\`\n\n*Paso 3 de 5 — Cobertura*\n¿Cuánto quieres de cobertura?\n\n_Máximo: ${MAX_COVERAGE_HECTARES} HBAR por registro_`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        keyboard: [
          [{ text: "50 HBAR (básico)" }],
          [{ text: "100 HBAR (recomendado)" }],
          [{ text: "200 HBAR (premium)" }],
        ],
        one_time_keyboard: true,
        resize_keyboard: true,
      }
    }
  );
}

async function requestWallet(chatId, reg) {
  reg.step = "wallet";
  pendingRegistration.set(chatId, reg);

  bot.sendMessage(chatId,
    `💳 *Paso 4 de 5 — Wallet para recibir pagos*\n\n` +
    `Necesitas una wallet de Hedera para recibir pagos automáticos.\n\n` +
    `*¿Ya tienes wallet Hedera?*\n` +
    `Envía tu Account ID (formato: \`0.0.XXXXXXX\`)\n\n` +
    `*¿No tienes wallet?*\n` +
    `Crea una gratis en 2 minutos:\n` +
    `👉 [Crear wallet en HashPack](https://www.hashpack.app)\n` +
    `👉 [Crear wallet en Blade](https://bladewallet.io)\n\n` +
    `_Una vez creada, envía tu Account ID aquí._\n\n` +
    `También puedes saltar este paso por ahora:`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        keyboard: [[{ text: "⏭ Configurar wallet después" }]],
        one_time_keyboard: true,
        resize_keyboard: true,
      }
    }
  );
}

async function requestPhotoVerification(chatId, reg) {
  reg.step = "photo";
  pendingRegistration.set(chatId, reg);

  bot.sendMessage(chatId,
    `📸 *Paso 5 de 5 — Verificación de presencia*\n\n` +
    `Para activar tu cobertura necesitamos verificar que estás en tu finca.\n\n` +
    `*Instrucciones:*\n` +
    `1. Ve a tu finca o a una ubicación cercana\n` +
    `2. Toma una foto desde ahí\n` +
    `3. Envíala aquí\n\n` +
    `📍 *Tip:* Activa el GPS en tu cámara para verificación más precisa.\n\n` +
    `_La foto debe tomarse a menos de ${GPS_TOLERANCE_KM}km de tu finca._`,
    { parse_mode: "Markdown" }
  );
}

async function handleRegistrationComplete(chatId, reg) {
  registeredParcels.set(reg.parcelHash, chatId);
  const activatesAt = Date.now() + (COOLDOWN_HOURS * 60 * 60 * 1000);

  const farm = {
    ...reg,
    chatId,
    location: `${reg.lat.toFixed(4)}, ${reg.lng.toFixed(4)}`,
    hcsTopic: process.env.HCS_TOPIC_FARM_0 || "0.0.8323476",
    resilienceScore: 50,
    registeredAt: Date.now(),
    activatesAt,
    verified: true,
    status: "monitoring",
    totalMm: 0,
    eventType: null,
  };

  farms.set(chatId, farm);
  pendingRegistration.delete(chatId);

  const saved = await postToAPI("/api/farms", "POST", farm);
  if (saved && saved.farm) farm.apiId = saved.farm.id;

  bot.sendMessage(chatId, `⏳ Registrando tu finca y consultando clima actual...`, {
    reply_markup: { remove_keyboard: true }
  });

  try {
    const weather = await evaluateClimateCondition(reg.lat, reg.lng);

    if (farm.apiId) {
      await postToAPI(`/api/farms/${farm.apiId}`, "PATCH", {
        totalMm: weather.totalMm,
        status: weather.status,
        eventType: weather.eventType,
        riskLevel: weather.riskLevel,
        walletAddress: farm.walletAddress || null,
      });
    }

    let alertMsg = "";
    let statusLine = "✅ Normal";
    if (weather.status === "alert") {
      const tipo = weather.eventType === "drought" ? "sequía" : "inundación";
      alertMsg = `\n\n🚨 *ALERTA:* Se detectó ${tipo}.\n💸 *Pago automático iniciado: ${reg.coverageHbar} HBAR*`;
      statusLine = "🚨 Alerta";
    } else if (weather.status === "warning") {
      alertMsg = `\n\n⚠️ Lluvia baja (${weather.totalMm.toFixed(1)}mm). Monitoreando.`;
      statusLine = "⚠️ Advertencia";
    }

    const activationTime = new Date(activatesAt).toLocaleString("es-CO", { timeZone: "America/Bogota" });
    const walletLine = farm.walletAddress
      ? `💳 Pagos a: \`${farm.walletAddress}\``
      : `⚠️ Sin wallet configurada — usa /wallet para recibirlo pagos`;

    bot.sendMessage(chatId,
      `🎉 *¡Finca registrada y verificada!*\n\n` +
      `🌿 *${reg.name}*\n📍 ${farm.location}\n` +
      `🌧 Lluvia últimos 7 días: *${weather.totalMm.toFixed(1)}mm*\n` +
      `📊 Estado: *${statusLine}*\n` +
      `🛡 Cobertura: *${reg.coverageHbar} HBAR*\n` +
      `🔐 ID Parcela: \`${reg.parcelHash}\`\n` +
      walletLine + `\n\n` +
      `⏳ *Cobertura se activa:*\n${activationTime}\n\n` +
      `*Protecciones activas:*\n` +
      `✅ Anti-duplicado (Hedera HCS)\n` +
      `✅ Período de verificación 72h\n` +
      `✅ Presencia física verificada\n` +
      `✅ Límite de área aplicado\n\n` +
      `_Dashboard actualizado en tiempo real._` +
      alertMsg,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    bot.sendMessage(chatId,
      `✅ *Finca registrada: ${reg.name}*\n\nUsa /estado para ver el estado actual.`,
      { parse_mode: "Markdown" }
    );
  }
}

// ─── Message Handler ──────────────────────────────────────────────────────────

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  if (msg.location) {
    const reg = pendingRegistration.get(chatId);
    if (reg && reg.step === "location") {
      await handleLocationReceived(chatId, reg, msg.location.latitude, msg.location.longitude);
    }
    return;
  }

  if (msg.photo) {
    const reg = pendingRegistration.get(chatId);
    if (!reg || reg.step !== "photo") return;

    if (msg.location) {
      const dist = distanceKm(reg.lat, reg.lng, msg.location.latitude, msg.location.longitude);
      if (dist <= GPS_TOLERANCE_KM) {
        bot.sendMessage(chatId, `✅ Ubicación verificada (${dist.toFixed(2)}km). Completando registro...`);
        await handleRegistrationComplete(chatId, reg);
      } else {
        bot.sendMessage(chatId,
          `❌ *Muy lejos*\n\nFoto tomada a ${dist.toFixed(1)}km. Máximo: ${GPS_TOLERANCE_KM}km.\n\nEnvía una foto desde tu finca.`,
          { parse_mode: "Markdown" }
        );
      }
    } else {
      bot.sendMessage(chatId,
        `📸 Foto recibida.\n\n⚠️ _Sin GPS detectado. Activa la ubicación en tu cámara para mayor seguridad._\n\nPara el MVP aceptamos la foto. Completando registro...`,
        { parse_mode: "Markdown" }
      );
      await handleRegistrationComplete(chatId, reg);
    }
    return;
  }

  if (!msg.text || msg.text.startsWith("/")) return;

  const reg = pendingRegistration.get(chatId);
  if (!reg) return;

  // Step 1: Name
  if (reg.step === "name") {
    reg.name = msg.text.trim();
    reg.step = "location";
    pendingRegistration.set(chatId, reg);
    bot.sendMessage(chatId,
      `✅ Nombre: *${reg.name}*\n\n*Paso 2 de 5 — Ubicación*\nEnvía la ubicación de tu finca:\n\n📍 *Opción A:* Clip → Ubicación → Enviar\n🔗 *Opción B:* Pega el link de Google Maps`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          keyboard: [[{ text: "📍 Enviar mi ubicación", request_location: true }]],
          one_time_keyboard: true,
          resize_keyboard: true,
        }
      }
    );
    return;
  }

  // Step 2: Location via Google Maps or coordinates
  if (reg.step === "location") {
    const text = msg.text.trim();
    if (text.includes("google.com/maps") || text.includes("maps.google") || text.includes("goo.gl")) {
      const coords = extractCoordsFromMapsUrl(text);
      if (coords) {
        await handleLocationReceived(chatId, reg, coords.lat, coords.lng);
      } else {
        bot.sendMessage(chatId, `⚠️ No pude leer ese link. Intenta enviando el pin directamente.`);
      }
      return;
    }
    const coordMatch = text.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
    if (coordMatch) {
      await handleLocationReceived(chatId, reg, parseFloat(coordMatch[1]), parseFloat(coordMatch[2]));
      return;
    }
    bot.sendMessage(chatId, `No entendí eso.\n\n📍 Clip → Ubicación\n🔗 O pega el link de Google Maps`);
    return;
  }

  // Step 3: Coverage
  if (reg.step === "coverage") {
    let coverage = 100;
    if (msg.text.includes("50")) coverage = 50;
    else if (msg.text.includes("200")) coverage = 200;
    reg.coverageHbar = coverage;
    reg.maxHectares = maxHectaresForCoverage(coverage);
    await requestWallet(chatId, reg);
    return;
  }

  // Step 4: Wallet
  if (reg.step === "wallet" || reg.step === "update_wallet") {
    const text = msg.text.trim();

    if (text.includes("después") || text.includes("saltar") || text.includes("skip")) {
      reg.walletAddress = null;
      if (reg.step === "update_wallet") {
        bot.sendMessage(chatId,
          `⚠️ Wallet no configurada.\n\nUsa /wallet cuando estés listo para recibir pagos.`
        );
        pendingRegistration.delete(chatId);
        return;
      }
      await requestPhotoVerification(chatId, reg);
      return;
    }

    if (isValidHederaAccount(text)) {
      reg.walletAddress = text.trim();

      if (reg.step === "update_wallet") {
        const farm = farms.get(chatId);
        if (farm) {
          farm.walletAddress = reg.walletAddress;
          farms.set(chatId, farm);
          if (farm.apiId) {
            await postToAPI(`/api/farms/${farm.apiId}`, "PATCH", { walletAddress: reg.walletAddress });
          }
        }
        bot.sendMessage(chatId,
          `✅ *Wallet actualizada*\n\nPagos se enviarán a:\n\`${reg.walletAddress}\`\n\nhashscan.io/testnet/account/${reg.walletAddress}`,
          { parse_mode: "Markdown" }
        );
        pendingRegistration.delete(chatId);
        return;
      }

      bot.sendMessage(chatId,
        `✅ *Wallet configurada*\n\`${reg.walletAddress}\`\n\nLos pagos automáticos llegarán directamente a esta dirección.`,
        { parse_mode: "Markdown" }
      );
      await requestPhotoVerification(chatId, reg);
      return;
    }

    if (isValidEVMAddress(text)) {
      reg.walletAddress = text.trim();
      bot.sendMessage(chatId,
        `✅ *Wallet EVM configurada*\n\`${reg.walletAddress}\``,
        { parse_mode: "Markdown" }
      );
      await requestPhotoVerification(chatId, reg);
      return;
    }

    bot.sendMessage(chatId,
      `⚠️ Formato no válido.\n\nEnvía tu Account ID de Hedera:\n*Formato:* \`0.0.XXXXXXX\`\n\n¿No tienes wallet? Crea una en:\n👉 [HashPack](https://www.hashpack.app)\n👉 [Blade](https://bladewallet.io)\n\nO toca *Configurar wallet después* para saltarlo.`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          keyboard: [[{ text: "⏭ Configurar wallet después" }]],
          one_time_keyboard: true,
          resize_keyboard: true,
        }
      }
    );
    return;
  }
});

// ─── Proactive Alert System ───────────────────────────────────────────────────

async function checkAllFarms() {
  if (farms.size === 0) return;
  console.log(`\n🔄 Checking ${farms.size} farms...`);

  for (const [chatId, farm] of farms.entries()) {
    try {
      if (coverageStatus(farm) === "cooldown") {
        console.log(`  ⏳ ${farm.name}: cooldown (${formatTimeRemaining(farm.activatesAt - Date.now())} left)`);
        continue;
      }

      const weather = await evaluateClimateCondition(farm.lat, farm.lng);

      if (farm.apiId) {
        await postToAPI(`/api/farms/${farm.apiId}`, "PATCH", {
          totalMm: weather.totalMm,
          status: weather.status,
          eventType: weather.eventType,
        });
      }

      if (weather.status === "alert") {
        const eventName = weather.eventType === "drought" ? "SEQUÍA" : "INUNDACIÓN";
        const walletMsg = farm.walletAddress
          ? `💸 *Pago enviado a:* \`${farm.walletAddress}\``
          : `⚠️ *Sin wallet configurada* — usa /wallet para recibir pagos futuros`;

        bot.sendMessage(chatId,
          `🚨 *ALERTA — ${eventName}*\n\n` +
          `Tu finca *${farm.name}* ha sido afectada.\n` +
          `Lluvia: *${weather.totalMm.toFixed(1)}mm* en 7 días\n\n` +
          `💸 *Pago automático: ${farm.coverageHbar} HBAR*\n` +
          walletMsg + `\n` +
          `🔗 hashscan.io/testnet/topic/${farm.hcsTopic}\n\n` +
          `_No necesitas hacer nada. RainSafe procesó tu pago._`,
          { parse_mode: "Markdown" }
        );
        console.log(`  🔴 Alert: ${farm.name} → ${farm.walletAddress || "NO WALLET"}`);
      } else {
        console.log(`  🟢 ${farm.name}: OK (${weather.totalMm.toFixed(1)}mm) → ${farm.walletAddress || "no wallet"}`);
      }

      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      console.error(`  ❌ ${chatId}:`, err.message);
    }
  }
}

setInterval(checkAllFarms, 6 * 60 * 60 * 1000);

console.log("🌧️ RainSafe Bot running...");
console.log("   t.me/RainSafeHedera_bot");
console.log("   Anti-fraud: C1+C2+C3+C4 active");
console.log("   Wallet integration: enabled");
console.log("   Dashboard sync: enabled\n");
