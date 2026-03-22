require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { registerFarmOnChain, raiseDisputeOnChain } = require("./hedera");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const DATA_FILE = path.join(__dirname, "../data/farms.json");
const API_URL = process.env.API_URL || "http://localhost:3001";

// ─── i18n ─────────────────────────────────────────────────────────────────────
const LANG = {
  es: {
    welcome: `🌱 *Bienvenido a RainSafe*\n\nSeguro climático paramétrico en Hedera.\nCuando hay sequía, recibes HBAR automáticamente.\n\n*Sin papeles. Sin bancos. Sin intermediarios.*\n\n/registrar — Registrar tu finca\n/estado — Ver tus fincas\n/disputa — Reportar un problema\n/ayuda — Ayuda`,
    step1: "📝 *Paso 1/5* — ¿Cuál es el nombre de tu finca?",
    step2: "📍 *Paso 2/5* — Comparte la ubicación de tu finca.\n\n• Envía tu ubicación 📎\n• Pega un link de Google Maps\n• Escribe coordenadas (ej: 4.5, -75.6)",
    step3: "💰 *Paso 3/5* — Elige tu cobertura:",
    step4: "📷 *Paso 4/5* — Envía una foto desde tu finca.\n\n_(o escribe *saltar* para continuar)_",
    step5: "👛 *Paso 5/5* — ¿Cuál es tu wallet?\n\n• HashPack: `0.0.XXXXXXX`\n• EVM: `0x...`\n• Escribe *saltar* si no tienes",
    registering: "⏳ Registrando en Hedera...",
    success: (name, coverage, txUrl) =>
      `✅ *¡Finca registrada en Hedera!*\n\n🌱 ${name}\n💰 Cobertura: ${coverage} HBAR\n⏳ Cobertura activa en: *30 días*\n\n` +
      (txUrl ? `🔗 [Ver transacción en HashScan](${txUrl})\n\n` : "") +
      `_Estamos monitoreando el clima 24/7. Si hay sequía, recibirás el pago automáticamente._`,
    status_none: "No tienes fincas registradas. Usa /registrar para comenzar.",
    status_header: "🌱 *Tus Fincas RainSafe*\n\n",
    dispute_prompt: "⚠️ *Reportar un problema*\n\nEscribe el número de tu finca y el problema:\n\nEjemplo: `3 — Hubo sequía pero no recibí el pago`",
    dispute_ok: (txUrl) => `✅ Disputa registrada en blockchain.\n\n` + (txUrl ? `🔗 [Ver en HashScan](${txUrl})\n\n` : "") + `Un árbitro revisará tu caso en 3 días hábiles.`,
    invalid_location: "❌ No pude detectar la ubicación. Intenta con Google Maps o coordenadas.",
    photo_ok: "📍 Foto verificada ✅",
    photo_skip: "Foto omitida — continuando.",
    help: `🌧️ *RainSafe — Ayuda*\n\n/registrar — Nueva finca\n/estado — Ver estado\n/disputa — Reportar problema\n\n🌐 rainsafe-frontend.vercel.app`,
  },
  en: {
    welcome: `🌱 *Welcome to RainSafe*\n\nParametric climate insurance on Hedera.\nWhen drought strikes, you get HBAR automatically.\n\n*No paperwork. No banks. No middlemen.*\n\n/register — Register your farm\n/status — View your farms\n/dispute — Report a problem\n/help — Help`,
    step1: "📝 *Step 1/5* — What is your farm's name?",
    step2: "📍 *Step 2/5* — Share your farm's location.\n\n• Send your location 📎\n• Paste a Google Maps link\n• Type coordinates (e.g. 4.5, -75.6)",
    step3: "💰 *Step 3/5* — Choose your coverage:",
    step4: "📷 *Step 4/5* — Send a photo from your farm.\n\n_(or type *skip* to continue)_",
    step5: "👛 *Step 5/5* — What is your wallet?\n\n• HashPack: `0.0.XXXXXXX`\n• EVM: `0x...`\n• Type *skip* if you don't have one",
    registering: "⏳ Registering on Hedera...",
    success: (name, coverage, txUrl) =>
      `✅ *Farm registered on Hedera!*\n\n🌱 ${name}\n💰 Coverage: ${coverage} HBAR\n⏳ Coverage activates in: *30 days*\n\n` +
      (txUrl ? `🔗 [View transaction on HashScan](${txUrl})\n\n` : "") +
      `_We're monitoring climate 24/7. If drought is detected, payment is automatic._`,
    status_none: "You have no registered farms. Use /register to start.",
    status_header: "🌱 *Your RainSafe Farms*\n\n",
    dispute_prompt: "⚠️ *Report a Problem*\n\nType your farm number and issue:\n\nExample: `3 — Drought happened but I didn't receive payment`",
    dispute_ok: (txUrl) => `✅ Dispute recorded on blockchain.\n\n` + (txUrl ? `🔗 [View on HashScan](${txUrl})\n\n` : "") + `An arbitrator will review within 3 business days.`,
    invalid_location: "❌ Could not detect location. Try a Google Maps link or coordinates.",
    photo_ok: "📍 Photo verified ✅",
    photo_skip: "Photo skipped — continuing.",
    help: `🌧️ *RainSafe — Help*\n\n/register — New farm\n/status — View status\n/dispute — Report issue\n\n🌐 rainsafe-frontend.vercel.app`,
  },
  pt: {
    welcome: `🌱 *Bem-vindo ao RainSafe*\n\nSeguro climático paramétrico no Hedera.\nQuando há seca, você recebe HBAR automaticamente.\n\n*Sem papéis. Sem bancos. Sem intermediários.*\n\n/registrar — Registrar fazenda\n/estado — Ver fazendas\n/disputa — Reportar problema\n/ajuda — Ajuda`,
    step1: "📝 *Passo 1/5* — Qual é o nome da sua fazenda?",
    step2: "📍 *Passo 2/5* — Compartilhe a localização da sua fazenda.\n\n• Envie sua localização 📎\n• Cole um link do Google Maps\n• Digite coordenadas (ex: 4.5, -75.6)",
    step3: "💰 *Passo 3/5* — Escolha sua cobertura:",
    step4: "📷 *Passo 4/5* — Envie uma foto da sua fazenda.\n\n_(ou digite *pular* para continuar)_",
    step5: "👛 *Passo 5/5* — Qual é sua carteira?\n\n• HashPack: `0.0.XXXXXXX`\n• EVM: `0x...`\n• Digite *pular* se não tiver",
    registering: "⏳ Registrando no Hedera...",
    success: (name, coverage, txUrl) =>
      `✅ *Fazenda registrada no Hedera!*\n\n🌱 ${name}\n💰 Cobertura: ${coverage} HBAR\n⏳ Cobertura ativa em: *30 dias*\n\n` +
      (txUrl ? `🔗 [Ver transação no HashScan](${txUrl})\n\n` : "") +
      `_Monitoramos o clima 24/7. Se houver seca, o pagamento é automático._`,
    status_none: "Você não tem fazendas. Use /registrar para começar.",
    status_header: "🌱 *Suas Fazendas RainSafe*\n\n",
    dispute_prompt: "⚠️ *Reportar Problema*\n\nDigite o número da fazenda e o problema:\n\nExemplo: `3 — Houve seca mas não recebi pagamento`",
    dispute_ok: (txUrl) => `✅ Disputa registrada na blockchain.\n\n` + (txUrl ? `🔗 [Ver no HashScan](${txUrl})\n\n` : "") + `Um árbitro revisará em 3 dias úteis.`,
    invalid_location: "❌ Não consegui detectar a localização. Tente Google Maps ou coordenadas.",
    photo_ok: "📍 Foto verificada ✅",
    photo_skip: "Foto ignorada — continuando.",
    help: `🌧️ *RainSafe — Ajuda*\n\n/registrar — Nova fazenda\n/estado — Ver status\n/disputa — Reportar problema\n\n🌐 rainsafe-frontend.vercel.app`,
  },
};

// ─── State ────────────────────────────────────────────────────────────────────
const sessions = {};
const userLangs = {};
const disputeSessions = {};

function getLang(chatId) { return userLangs[chatId] || "es"; }
function t(chatId, key, ...args) {
  const lang = getLang(chatId);
  const str = LANG[lang][key];
  return typeof str === "function" ? str(...args) : str;
}

function loadFarms() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch { return []; }
}

function saveFarm(farm) {
  const farms = loadFarms();
  farms.push(farm);
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(farms, null, 2));
  return farms.length - 1;
}

function parseLocation(text) {
  const mapsRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
  const shortRegex = /maps\.google\.[a-z]+.*q=(-?\d+\.\d+),(-?\d+\.\d+)/;
  let m = text.match(mapsRegex) || text.match(shortRegex);
  if (m) return { lat: parseFloat(m[1]), lon: parseFloat(m[2]) };
  const coordRegex = /(-?\d{1,3}\.?\d*)[,\s]+(-?\d{1,3}\.?\d*)/;
  m = text.match(coordRegex);
  if (m) return { lat: parseFloat(m[1]), lon: parseFloat(m[2]) };
  return null;
}

function parcelHash(lat, lon) {
  const grid = `${Math.round(lat * 1000) / 1000},${Math.round(lon * 1000) / 1000}`;
  return crypto.createHash("sha256").update(grid).digest("hex").substring(0, 16);
}

function coverageKeyboard(lang) {
  const labels = {
    es: ["50 HBAR — Básica", "100 HBAR — Estándar", "200 HBAR — Premium"],
    en: ["50 HBAR — Basic", "100 HBAR — Standard", "200 HBAR — Premium"],
    pt: ["50 HBAR — Básico", "100 HBAR — Padrão", "200 HBAR — Premium"],
  };
  const l = labels[lang] || labels.es;
  return {
    reply_markup: {
      keyboard: [[{ text: l[0] }], [{ text: l[1] }], [{ text: l[2] }]],
      one_time_keyboard: true, resize_keyboard: true,
    },
  };
}

function langKeyboard() {
  return {
    reply_markup: {
      keyboard: [[{ text: "🇪🇸 Español" }, { text: "🇬🇧 English" }, { text: "🇧🇷 Português" }]],
      one_time_keyboard: true, resize_keyboard: true,
    },
  };
}

// ─── Commands ─────────────────────────────────────────────────────────────────

bot.onText(/\/(start|inicio)/, (msg) => {
  const chatId = msg.chat.id;
  const code = msg.from.language_code || "";
  if (code.startsWith("pt")) userLangs[chatId] = "pt";
  else if (code.startsWith("en")) userLangs[chatId] = "en";

  if (!userLangs[chatId]) {
    bot.sendMessage(chatId, "🌍 Choose your language / Elige tu idioma / Escolha seu idioma:", langKeyboard());
    sessions[chatId] = { step: "lang" };
  } else {
    bot.sendMessage(chatId, t(chatId, "welcome"), { parse_mode: "Markdown" });
  }
});

bot.onText(/\/(registrar|register|nueva|new)/, (msg) => {
  const chatId = msg.chat.id;
  sessions[chatId] = { step: 1, data: {} };
  bot.sendMessage(chatId, t(chatId, "step1"), { parse_mode: "Markdown", reply_markup: { remove_keyboard: true } });
});

bot.onText(/\/(estado|status)/, (msg) => {
  const chatId = msg.chat.id;
  const farms = loadFarms().filter(f => f.chatId === chatId);
  if (!farms.length) { bot.sendMessage(chatId, t(chatId, "status_none")); return; }
  let text = t(chatId, "status_header");
  farms.forEach(f => {
    const daysLeft = Math.max(0, Math.ceil((new Date(f.coverageActivatesAt) - Date.now()) / 86400000));
    const emoji = daysLeft > 0 ? "⏳" : "✅";
    const statusText = daysLeft > 0 ? `Activa en ${daysLeft}d` : "Activa";
    const chainInfo = f.txId ? `\n   🔗 [HashScan](https://hashscan.io/testnet/transaction/${f.txId})` : "";
    text += `${emoji} *${f.name}*\n   📍 ${f.location}\n   💰 ${f.coverage} HBAR\n   ${statusText}${chainInfo}\n\n`;
  });
  bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
});

bot.onText(/\/(disputa|dispute)/, (msg) => {
  const chatId = msg.chat.id;
  disputeSessions[chatId] = true;
  bot.sendMessage(chatId, t(chatId, "dispute_prompt"), { parse_mode: "Markdown" });
});

bot.onText(/\/(ayuda|help|ajuda)/, (msg) => {
  bot.sendMessage(msg.chat.id, t(msg.chat.id, "help"), { parse_mode: "Markdown" });
});

// ─── Message Handler ──────────────────────────────────────────────────────────

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || "";

  // Language selection
  if (sessions[chatId]?.step === "lang") {
    if (text.includes("English")) userLangs[chatId] = "en";
    else if (text.includes("Português")) userLangs[chatId] = "pt";
    else userLangs[chatId] = "es";
    delete sessions[chatId];
    bot.sendMessage(chatId, t(chatId, "welcome"), { parse_mode: "Markdown", reply_markup: { remove_keyboard: true } });
    return;
  }

  // Dispute flow
  if (disputeSessions[chatId] && text && !text.startsWith("/")) {
    delete disputeSessions[chatId];
    const farms = loadFarms().filter(f => f.chatId === chatId);
    // Try to extract farm number from message
    const numMatch = text.match(/^(\d+)/);
    const farmIdx = numMatch ? parseInt(numMatch[1]) - 1 : 0;
    const farm = farms[farmIdx];

    let txUrl = null;
    if (farm && farm.onChainId !== undefined) {
      const result = await raiseDisputeOnChain(farm.onChainId, text);
      if (result) txUrl = result.hashscanUrl;
    }

    bot.sendMessage(chatId, t(chatId, "dispute_ok", txUrl), { parse_mode: "Markdown" });
    return;
  }

  const session = sessions[chatId];
  if (!session || session.step === "lang") return;
  if (text.startsWith("/")) return;

  const skipWords = ["saltar", "skip", "pular"];
  const isSkip = skipWords.some(w => text.toLowerCase().trim() === w);

  // Step 1: Farm name
  if (session.step === 1) {
    session.data.name = text.trim();
    session.step = 2;
    bot.sendMessage(chatId, t(chatId, "step2"), { parse_mode: "Markdown" });
    return;
  }

  // Step 2: Location
  if (session.step === 2) {
    let coords = msg.location
      ? { lat: msg.location.latitude, lon: msg.location.longitude }
      : parseLocation(text);

    if (!coords) { bot.sendMessage(chatId, t(chatId, "invalid_location")); return; }

    session.data.lat = coords.lat;
    session.data.lon = coords.lon;
    session.data.location = `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`;
    session.data.parcelHash = parcelHash(coords.lat, coords.lon);
    session.step = 3;
    bot.sendMessage(chatId, t(chatId, "step3"), coverageKeyboard(getLang(chatId)));
    return;
  }

  // Step 3: Coverage
  if (session.step === 3) {
    const match = text.match(/(\d+)\s*HBAR/i);
    if (!match || ![50, 100, 200].includes(parseInt(match[1]))) {
      bot.sendMessage(chatId, "⚠️ Elige 50, 100 o 200 HBAR", coverageKeyboard(getLang(chatId)));
      return;
    }
    session.data.coverage = parseInt(match[1]);
    session.step = 4;
    bot.sendMessage(chatId, t(chatId, "step4"), { parse_mode: "Markdown", reply_markup: { remove_keyboard: true } });
    return;
  }

  // Step 4: Photo
  if (session.step === 4) {
    if (msg.photo) {
      session.data.verified = true;
      bot.sendMessage(chatId, t(chatId, "photo_ok"));
    } else if (isSkip) {
      session.data.verified = false;
      bot.sendMessage(chatId, t(chatId, "photo_skip"));
    } else {
      bot.sendMessage(chatId, t(chatId, "step4"), { parse_mode: "Markdown" });
      return;
    }
    session.step = 5;
    bot.sendMessage(chatId, t(chatId, "step5"), { parse_mode: "Markdown" });
    return;
  }

  // Step 5: Wallet + ON-CHAIN REGISTRATION
  if (session.step === 5) {
    const walletRegex = /^(0\.0\.\d+|0x[a-fA-F0-9]{40})$/;
    session.data.wallet = walletRegex.test(text.trim()) ? text.trim() : null;

    const coverageActivatesAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const farm = {
      chatId,
      name: session.data.name,
      location: session.data.location,
      lat: session.data.lat,
      lon: session.data.lon,
      coverage: session.data.coverage,
      parcelHash: session.data.parcelHash,
      wallet: session.data.wallet,
      verified: session.data.verified || false,
      registeredAt: new Date().toISOString(),
      coverageActivatesAt: coverageActivatesAt.toISOString(),
      lang: getLang(chatId),
      onChainId: null,
      txId: null,
    };

    // Show "registering" message
    const loadingMsg = await bot.sendMessage(chatId, t(chatId, "registering"), { parse_mode: "Markdown" });

    // Register on-chain
    const chainResult = await registerFarmOnChain(farm);
    if (chainResult) {
      farm.txId = chainResult.txId;
      farm.hashscanUrl = chainResult.hashscanUrl;
    }

    // Save locally
    const idx = saveFarm(farm);
    farm.onChainId = idx;
    delete sessions[chatId];

    // Notify API server
    try {
      const fetch = require("node-fetch");
      await fetch(`${API_URL}/api/farms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(farm),
      });
    } catch (e) { console.warn("API notify failed:", e.message); }

    // Delete loading message and send success
    try { await bot.deleteMessage(chatId, loadingMsg.message_id); } catch {}

    bot.sendMessage(
      chatId,
      t(chatId, "success", farm.name, farm.coverage, farm.hashscanUrl || null),
      { parse_mode: "Markdown", reply_markup: { remove_keyboard: true } }
    );
    return;
  }
});

// Location pin
bot.on("location", (msg) => {
  const chatId = msg.chat.id;
  const session = sessions[chatId];
  if (!session || session.step !== 2) return;
  session.data.lat = msg.location.latitude;
  session.data.lon = msg.location.longitude;
  session.data.location = `${msg.location.latitude.toFixed(4)}, ${msg.location.longitude.toFixed(4)}`;
  session.data.parcelHash = parcelHash(msg.location.latitude, msg.location.longitude);
  session.step = 3;
  bot.sendMessage(chatId, t(chatId, "step3"), coverageKeyboard(getLang(chatId)));
});

console.log("🤖 RainSafe Bot v2 — ES/EN/PT + On-chain registration + Disputes");
