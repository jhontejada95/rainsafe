import { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import RegisterFarm from "./components/RegisterFarm";
import ClimateScore from "./components/ClimateScore";
import PayoutHistory from "./components/PayoutHistory";
import PoolDashboard from "./components/PoolDashboard";
import DisputeCenter from "./components/DisputeCenter";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const DEMO_PAYOUTS = [
  {
    id: 1, farmName: "Finca El Progreso", eventType: "drought",
    amount: 97, fee: 3, gross: 100,
    date: "2026-03-14", hcsSequence: "42",
    txHash: "0.0.8324803@1710892800",
  },
  {
    id: 2, farmName: "Parcela San Miguel", eventType: "drought",
    amount: 97, fee: 3, gross: 100,
    date: "2026-03-10", hcsSequence: "38",
    txHash: "0.0.8324803@1709164800",
  },
];

function normalizeFarm(farm, index) {
  const now = Date.now();
  const coverageActivatesAt = farm.coverageActivatesAt
    ? new Date(farm.coverageActivatesAt).getTime()
    : now;
  const isActive = now >= coverageActivatesAt;
  const daysLeft = isActive
    ? 0
    : Math.ceil((coverageActivatesAt - now) / 86400000);

  let status = farm.status || "monitoring";
  if (!isActive) status = "carencia";

  return {
    id: farm.apiId || farm.id || index,
    name: farm.name || "Sin nombre",
    location: farm.location || `${Number(farm.lat).toFixed(4)}, ${Number(farm.lng || farm.lon).toFixed(4)}`,
    lat: parseFloat(farm.lat),
    lng: parseFloat(farm.lng || farm.lon),
    coverageHbar: farm.coverage || farm.coverageHbar || 100,
    status,
    eventType: farm.eventType || null,
    totalMm: farm.totalMm || 0,
    resilienceScore: farm.resilienceScore || 50,
    active: true,
    verified: farm.verified || false,
    parcelHash: farm.parcelHash || "",
    daysUntilActive: daysLeft,
    wallet: farm.wallet || null,
    lang: farm.lang || "es",
  };
}

// ── Protocol stats banner ────────────────────────────────────────────────────
function ProtocolBanner({ farms, apiOnline }) {
  const alerts = farms.filter(f => f.status === "alert").length;
  const inCarencia = farms.filter(f => f.status === "carencia").length;
  const active = farms.filter(f => f.status !== "carencia").length;
  const feeRate = "3%";

  return (
    <div style={{
      background: "var(--bg2)", borderBottom: "1px solid var(--border)",
      padding: "8px 0",
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto", padding: "0 2rem",
        display: "flex", gap: "2rem", alignItems: "center",
        fontFamily: "var(--mono)", fontSize: "0.72rem", color: "var(--text-dim)",
        flexWrap: "wrap",
      }}>
        <span>🌱 <b style={{ color: "var(--green)" }}>{farms.length}</b> fincas registradas</span>
        <span>✅ <b style={{ color: "var(--green)" }}>{active}</b> coberturas activas</span>
        {inCarencia > 0 && <span>⏳ <b style={{ color: "var(--amber)" }}>{inCarencia}</b> en período de carencia (30d)</span>}
        {alerts > 0 && <span>🚨 <b style={{ color: "var(--red)" }}>{alerts}</b> alertas climáticas</span>}
        <span>💸 Fee protocolo: <b style={{ color: "var(--green)" }}>{feeRate}</b></span>
        <span>🌍 ES · EN · PT</span>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [farms, setFarms] = useState([]);
  const [payouts] = useState(DEMO_PAYOUTS);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [apiOnline, setApiOnline] = useState(false);

  async function fetchFarms() {
    try {
      const res = await fetch(`${API_URL}/api/farms`);
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setFarms(data.map(normalizeFarm));
      setLastUpdated(new Date());
      setApiOnline(true);
    } catch {
      setApiOnline(false);
      if (farms.length === 0) {
        setFarms([
          { id: 0, name: "Finca El Progreso", location: "Bogotá, Colombia", lat: 4.711, lng: -74.0721, coverageHbar: 100, status: "alert", eventType: "drought", totalMm: 2.3, resilienceScore: 42, active: true, daysUntilActive: 0 },
          { id: 1, name: "Rancho Las Palmas", location: "Caracas, Venezuela", lat: 10.4806, lng: -66.9036, coverageHbar: 100, status: "normal", eventType: null, totalMm: 28.5, resilienceScore: 71, active: true, daysUntilActive: 0 },
          { id: 2, name: "Parcela San Miguel", location: "Oaxaca, México", lat: 17.0732, lng: -96.7266, coverageHbar: 100, status: "warning", eventType: null, totalMm: 11.2, resilienceScore: 58, active: true, daysUntilActive: 0 },
          { id: 3, name: "Finca San Antonio", location: "Salento, Colombia", lat: 4.585518, lng: -75.640176, coverageHbar: 100, status: "normal", eventType: null, totalMm: 37.1, resilienceScore: 72, active: true, daysUntilActive: 0 },
          { id: 4, name: "Hacienda Los Mangos", location: "Valle del Cauca, Colombia", lat: 3.8721, lng: -76.3012, coverageHbar: 200, status: "carencia", eventType: null, totalMm: 27.4, resilienceScore: 50, active: true, daysUntilActive: 28 },
        ]);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFarms();
    const interval = setInterval(fetchFarms, 10000);
    return () => clearInterval(interval);
  }, []);

  const addFarm = (farm) => {
    setFarms((prev) => [...prev, {
      ...farm, id: prev.length, status: "carencia",
      totalMm: 0, resilienceScore: 50, active: true, daysUntilActive: 30,
    }]);
    setTab("dashboard");
  };

  const TABS = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "register", label: "Register Farm", icon: "🌱" },
    { id: "score", label: "Resilience Score", icon: "⚡" },
    { id: "history", label: "Payout History", icon: "💸" },
    { id: "pool", label: "Insurance Pool", icon: "🏦" },
    { id: "disputes", label: "Disputes", icon: "⚖️" },
  ];

  return (
    <div className="app">
      <header>
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">🌧️</span>
            <span className="logo-text">RainSafe</span>
            <span className="logo-badge">TESTNET</span>
          </div>
          <nav>
            {TABS.map((item) => (
              <button
                key={item.id}
                className={`nav-btn ${tab === item.id ? "active" : ""}`}
                onClick={() => setTab(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="api-status">
            <span className={`status-dot ${apiOnline ? "online" : "offline"}`} />
            <span className="status-label">
              {apiOnline
                ? lastUpdated ? `Live · ${lastUpdated.toLocaleTimeString()}` : "Live"
                : "Demo mode"}
            </span>
          </div>
        </div>
      </header>

      <ProtocolBanner farms={farms} apiOnline={apiOnline} />

      <main>
        {loading ? (
          <div className="loading">
            <div className="loading-spinner" />
            <p>Connecting to RainSafe network...</p>
          </div>
        ) : (
          <>
            {tab === "dashboard" && <Dashboard farms={farms} />}
            {tab === "register" && <RegisterFarm onRegister={addFarm} />}
            {tab === "score" && <ClimateScore farms={farms} />}
            {tab === "history" && <PayoutHistory payouts={payouts} />}
            {tab === "pool" && <PoolDashboard farms={farms} />}
            {tab === "disputes" && <DisputeCenter farms={farms} />}
          </>
        )}
      </main>

      <footer>
        <span>Built on Hedera · Powered by Open-Meteo · Hedera Hello Future Apex 2026</span>
        <span style={{ margin: "0 1rem" }}>·</span>
        <a href="https://t.me/RainSafeHedera_bot" target="_blank" rel="noreferrer" style={{ color: "var(--green)" }}>@RainSafeHedera_bot</a>
        <span style={{ margin: "0 1rem" }}>·</span>
        <a href="https://hashscan.io/testnet/contract/0.0.8324803" target="_blank" rel="noreferrer" style={{ color: "var(--green)" }}>0.0.8324803</a>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #0a0f0a; --bg2: #0f1a0f; --bg3: #152015;
          --green: #22c55e; --green-dim: #16a34a; --green-glow: rgba(34,197,94,0.15);
          --amber: #f59e0b; --red: #ef4444;
          --text: #e8f5e9; --text-dim: #6b7c6b; --border: rgba(34,197,94,0.15);
          --font: 'Syne', sans-serif; --mono: 'IBM Plex Mono', monospace;
        }
        body { background: var(--bg); color: var(--text); font-family: var(--font); min-height: 100vh; }
        .app { display: flex; flex-direction: column; min-height: 100vh; }
        header { border-bottom: 1px solid var(--border); background: rgba(10,15,10,0.97); backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 100; }
        .header-inner { max-width: 1200px; margin: 0 auto; padding: 0 2rem; display: flex; align-items: center; justify-content: space-between; height: 64px; gap: 1rem; }
        .logo { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .logo-icon { font-size: 1.4rem; }
        .logo-text { font-size: 1.2rem; font-weight: 800; color: var(--green); letter-spacing: -0.02em; }
        .logo-badge { font-family: var(--mono); font-size: 0.6rem; background: var(--green-glow); color: var(--green); border: 1px solid var(--border); border-radius: 4px; padding: 2px 6px; }
        nav { display: flex; gap: 2px; flex-wrap: wrap; }
        .nav-btn { background: none; border: none; cursor: pointer; font-family: var(--font); font-size: 0.8rem; font-weight: 600; color: var(--text-dim); padding: 6px 12px; border-radius: 8px; transition: all 0.2s; display: flex; align-items: center; gap: 5px; }
        .nav-btn:hover { color: var(--text); background: var(--bg3); }
        .nav-btn.active { color: var(--green); background: var(--green-glow); }
        .nav-icon { font-size: 0.85rem; }
        .nav-label { }
        .api-status { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; animation: pulse 2s infinite; }
        .status-dot.online { background: var(--green); }
        .status-dot.offline { background: var(--amber); animation: none; }
        .status-label { font-family: var(--mono); font-size: 0.68rem; color: var(--text-dim); }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        main { flex: 1; max-width: 1200px; margin: 0 auto; padding: 2rem; width: 100%; }
        .loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; gap: 1rem; color: var(--text-dim); }
        .loading-spinner { width: 32px; height: 32px; border: 2px solid var(--border); border-top-color: var(--green); border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        footer { text-align: center; padding: 1.5rem; font-family: var(--mono); font-size: 0.7rem; color: var(--text-dim); border-top: 1px solid var(--border); }
        footer a { text-decoration: none; }
        footer a:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}
