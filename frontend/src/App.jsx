import { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import RegisterFarm from "./components/RegisterFarm";
import ClimateScore from "./components/ClimateScore";
import PayoutHistory from "./components/PayoutHistory";
import PoolDashboard from "./components/PoolDashboard";

const API_URL = "http://localhost:3001";

const DEMO_PAYOUTS = [
  {
    id: 1,
    farmName: "Finca El Progreso",
    eventType: "drought",
    amount: 100,
    date: "2026-03-14",
    hcsSequence: "42",
    txHash: "0.0.8323474@1710892800",
  },
];

function normalizeFarm(farm, index) {
  const now = Date.now();
  const activatesAt = farm.activatesAt || now;
  const isActive = now >= activatesAt;
  const cooldownRemaining = isActive ? 0 : activatesAt - now;
  const hoursLeft = Math.ceil(cooldownRemaining / 3600000);

  let status = farm.status || "monitoring";
  if (!isActive) status = "cooldown";

  return {
    id: farm.apiId || farm.id || index,
    name: farm.name || "Sin nombre",
    location: farm.location || `${farm.lat?.toFixed(4)}, ${farm.lng?.toFixed(4)}`,
    lat: farm.lat,
    lng: farm.lng,
    coverageHbar: farm.coverageHbar || 100,
    status,
    eventType: farm.eventType || null,
    totalMm: farm.totalMm || 0,
    resilienceScore: farm.resilienceScore || 50,
    active: true,
    verified: farm.verified || false,
    parcelHash: farm.parcelHash || "",
    hcsTopic: farm.hcsTopic || "",
    cooldownHoursLeft: hoursLeft,
  };
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
    } catch (err) {
      setApiOnline(false);
      if (farms.length === 0) {
        setFarms([
          {
            id: 0, name: "Finca El Progreso", location: "Bogotá, Colombia",
            lat: 4.711, lng: -74.0721, coverageHbar: 100,
            status: "alert", eventType: "drought", totalMm: 2.3,
            resilienceScore: 42, active: true,
          },
          {
            id: 1, name: "Rancho Las Palmas", location: "Caracas, Venezuela",
            lat: 10.4806, lng: -66.9036, coverageHbar: 100,
            status: "normal", eventType: null, totalMm: 28.5,
            resilienceScore: 71, active: true,
          },
          {
            id: 2, name: "Parcela San Miguel", location: "Oaxaca, México",
            lat: 17.0732, lng: -96.7266, coverageHbar: 100,
            status: "warning", eventType: null, totalMm: 11.2,
            resilienceScore: 58, active: true,
          },
          {
            id: 3, name: "Finca San Antonio", location: "Salento, Colombia",
            lat: 4.585518, lng: -75.640176, coverageHbar: 100,
            status: "normal", eventType: null, totalMm: 37.1,
            resilienceScore: 72, active: true,
          },
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
    setFarms((prev) => [
      ...prev,
      {
        ...farm,
        id: prev.length,
        status: "monitoring",
        totalMm: 0,
        resilienceScore: 50,
        active: true,
      },
    ]);
    setTab("dashboard");
  };

  return (
    <div className="app">
      <header>
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">🌧️</span>
            <span className="logo-text">RainSafe</span>
            <span className="logo-badge">Testnet</span>
          </div>
          <nav>
            {[
              { id: "dashboard", label: "Dashboard" },
              { id: "register", label: "Register Farm" },
              { id: "score", label: "Resilience Score" },
              { id: "history", label: "Payout History" },
              { id: "pool", label: "Insurance Pool" },
            ].map((item) => (
              <button
                key={item.id}
                className={`nav-btn ${tab === item.id ? "active" : ""}`}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="api-status">
            <span className={`status-dot ${apiOnline ? "online" : "offline"}`} />
            <span className="status-label">
              {apiOnline
                ? lastUpdated
                  ? `Live · ${lastUpdated.toLocaleTimeString()}`
                  : "Live"
                : "Demo mode"}
            </span>
          </div>
        </div>
      </header>

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
            {tab === "pool" && <PoolDashboard />}
          </>
        )}
      </main>

      <footer>
        <span>Built on Hedera · Powered by Open-Meteo · Hedera Hello Future Apex 2026</span>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #0a0f0a;
          --bg2: #0f1a0f;
          --bg3: #152015;
          --green: #22c55e;
          --green-dim: #16a34a;
          --green-glow: rgba(34,197,94,0.15);
          --amber: #f59e0b;
          --red: #ef4444;
          --text: #e8f5e9;
          --text-dim: #6b7c6b;
          --border: rgba(34,197,94,0.15);
          --font: 'Syne', sans-serif;
          --mono: 'IBM Plex Mono', monospace;
        }

        body { background: var(--bg); color: var(--text); font-family: var(--font); min-height: 100vh; }
        .app { display: flex; flex-direction: column; min-height: 100vh; }

        header {
          border-bottom: 1px solid var(--border);
          background: rgba(10,15,10,0.95);
          backdrop-filter: blur(12px);
          position: sticky; top: 0; z-index: 100;
        }

        .header-inner {
          max-width: 1200px; margin: 0 auto;
          padding: 0 2rem;
          display: flex; align-items: center; justify-content: space-between;
          height: 64px;
        }

        .logo { display: flex; align-items: center; gap: 10px; }
        .logo-icon { font-size: 1.5rem; }
        .logo-text { font-size: 1.25rem; font-weight: 800; color: var(--green); letter-spacing: -0.02em; }
        .logo-badge {
          font-family: var(--mono); font-size: 0.65rem;
          background: var(--green-glow); color: var(--green);
          border: 1px solid var(--border); border-radius: 4px;
          padding: 2px 6px; letter-spacing: 0.05em;
        }

        nav { display: flex; gap: 4px; }
        .nav-btn {
          background: none; border: none; cursor: pointer;
          font-family: var(--font); font-size: 0.85rem; font-weight: 600;
          color: var(--text-dim); padding: 8px 16px; border-radius: 8px;
          transition: all 0.2s;
        }
        .nav-btn:hover { color: var(--text); background: var(--bg3); }
        .nav-btn.active { color: var(--green); background: var(--green-glow); }

        .api-status { display: flex; align-items: center; gap: 6px; }
        .status-dot {
          width: 8px; height: 8px; border-radius: 50%;
          animation: pulse 2s infinite;
        }
        .status-dot.online { background: var(--green); }
        .status-dot.offline { background: var(--amber); animation: none; }
        .status-label { font-family: var(--mono); font-size: 0.7rem; color: var(--text-dim); }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        main { flex: 1; max-width: 1200px; margin: 0 auto; padding: 2rem; width: 100%; }

        .loading {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; height: 300px; gap: 1rem; color: var(--text-dim);
        }
        .loading-spinner {
          width: 32px; height: 32px; border: 2px solid var(--border);
          border-top-color: var(--green); border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        footer {
          text-align: center; padding: 1.5rem;
          font-family: var(--mono); font-size: 0.7rem;
          color: var(--text-dim); border-top: 1px solid var(--border);
        }
      `}</style>
    </div>
  );
}
