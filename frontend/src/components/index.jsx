// RegisterFarm.jsx
import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function RegisterFarm({ onRegister }) {
  const [form, setForm] = useState({
    name: "",
    location: "",
    lat: "",
    lng: "",
    coverageHbar: 100,
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async () => {
    if (!form.name || !form.location) return;
    setSubmitting(true);
    setError(null);

    const farmData = {
      name: form.name,
      location: form.location,
      lat: parseFloat(form.lat) || 0,
      lon: parseFloat(form.lng) || 0,
      coverage: parseInt(form.coverageHbar) || 100,
      coverageActivatesAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      registeredAt: new Date().toISOString(),
      source: "dashboard",
    };

    try {
      const res = await fetch(`${API_URL}/api/farms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(farmData),
      });
      const data = await res.json();
      if (data.success) {
        onRegister({ ...farmData, lng: farmData.lon });
        setDone(true);
      } else {
        setError("API error. Check that server.js is running.");
      }
    } catch {
      setError("Cannot connect to API (localhost:3001). For full on-chain registration use the Telegram bot @RainSafeHedera_bot.");
      // Still register locally for demo
      onRegister({ ...farmData, lng: farmData.lon });
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) return (
    <div style={{ textAlign: "center", padding: "4rem" }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
      <h2 style={{ fontWeight: 800, marginBottom: "8px" }}>Farm Registered!</h2>
      <p style={{ color: "var(--text-dim)", marginBottom: "1rem" }}>Your farm is now being monitored for climate events.</p>
      <p style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>
        For on-chain registration with blockchain proof, use{" "}
        <a href="https://t.me/RainSafeHedera_bot" target="_blank" rel="noreferrer" style={{ color: "var(--green)" }}>@RainSafeHedera_bot</a>
      </p>
    </div>
  );

  return (
    <div style={{ maxWidth: "560px", margin: "0 auto" }}>
      <h2 style={{ fontWeight: 800, fontSize: "1.5rem", marginBottom: "0.5rem" }}>Register a Farm</h2>
      <p style={{ color: "var(--text-dim)", marginBottom: "2rem", fontSize: "0.9rem" }}>
        Register your farm to receive automatic climate insurance coverage on Hedera.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {[
          { name: "name", label: "Farm Name", placeholder: "Finca El Progreso" },
          { name: "location", label: "Location", placeholder: "Bogotá, Colombia" },
          { name: "lat", label: "Latitude", placeholder: "4.711" },
          { name: "lng", label: "Longitude", placeholder: "-74.0721" },
        ].map((field) => (
          <div key={field.name}>
            <label style={{ display: "block", fontSize: "0.75rem", fontFamily: "var(--mono)", color: "var(--text-dim)", marginBottom: "6px" }}>
              {field.label.toUpperCase()}
            </label>
            <input
              name={field.name}
              value={form[field.name]}
              onChange={handle}
              placeholder={field.placeholder}
              style={{
                width: "100%", background: "var(--bg2)", border: "1px solid var(--border)",
                borderRadius: "10px", padding: "12px 16px",
                color: "var(--text)", fontFamily: "var(--font)", fontSize: "0.95rem",
                outline: "none",
              }}
            />
          </div>
        ))}

        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontFamily: "var(--mono)", color: "var(--text-dim)", marginBottom: "6px" }}>
            COVERAGE AMOUNT (HBAR)
          </label>
          <input
            type="number"
            name="coverageHbar"
            value={form.coverageHbar}
            onChange={handle}
            style={{
              width: "100%", background: "var(--bg2)", border: "1px solid var(--border)",
              borderRadius: "10px", padding: "12px 16px",
              color: "var(--green)", fontFamily: "var(--mono)", fontSize: "1.1rem",
              outline: "none", fontWeight: 700,
            }}
          />
          <p style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "6px", fontFamily: "var(--mono)" }}>
            Premium: {(form.coverageHbar * 0.1).toFixed(1)} HBAR (10% of coverage)
          </p>
        </div>

        {error && (
          <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 10, padding: "10px 14px", fontSize: "0.8rem", color: "#f59e0b" }}>
            ⚠️ {error}
          </div>
        )}

        <button
          onClick={submit}
          disabled={submitting}
          style={{
            background: submitting ? "var(--bg3)" : "var(--green)",
            color: submitting ? "var(--text-dim)" : "#000",
            border: "none", borderRadius: "10px", padding: "14px",
            fontFamily: "var(--font)", fontSize: "1rem", fontWeight: 700,
            cursor: submitting ? "not-allowed" : "pointer",
            marginTop: "8px", transition: "all 0.2s",
          }}
        >
          {submitting ? "⏳ Registering..." : "Register Farm →"}
        </button>

        <p style={{ fontSize: "0.75rem", color: "var(--text-dim)", textAlign: "center", fontFamily: "var(--mono)" }}>
          For full on-chain TX proof use{" "}
          <a href="https://t.me/RainSafeHedera_bot" target="_blank" rel="noreferrer" style={{ color: "var(--green)" }}>@RainSafeHedera_bot</a>
        </p>
      </div>
    </div>
  );
}

// ClimateScore.jsx
export function ClimateScore({ farms }) {
  const scoreColor = (s) => s >= 70 ? "#22c55e" : s >= 40 ? "#f59e0b" : "#ef4444";
  const scoreLabel = (s) => s >= 70 ? "Strong" : s >= 40 ? "Moderate" : "Vulnerable";

  const benefits = [
    { min: 80, label: "🏦 Access to microloans", desc: "Financial institutions can offer credit based on your on-chain score" },
    { min: 70, label: "📉 Reduced insurance premium", desc: "10% discount on next coverage period" },
    { min: 60, label: "🌿 Carbon market access", desc: "Eligible for biodiversity and carbon credit programs" },
    { min: 50, label: "📊 Government program eligibility", desc: "Qualify for agricultural resilience programs" },
  ];

  return (
    <div>
      <h2 style={{ fontWeight: 800, fontSize: "1.5rem", marginBottom: "0.5rem" }}>Climate Resilience Score</h2>
      <p style={{ color: "var(--text-dim)", marginBottom: "2rem", fontSize: "0.9rem" }}>
        AI-computed on-chain financial identity built from climate events, payouts, and farm behavior.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {farms.map((farm) => (
          <div key={farm.id} style={{
            background: "var(--bg2)", border: "1px solid var(--border)",
            borderRadius: "16px", padding: "1.5rem",
          }}>
            <h3 style={{ fontWeight: 700, marginBottom: "4px" }}>{farm.name}</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", fontFamily: "var(--mono)", marginBottom: "1.5rem" }}>
              {farm.location}
            </p>

            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div style={{
                fontSize: "3.5rem", fontWeight: 800,
                color: scoreColor(farm.resilienceScore),
                lineHeight: 1,
                textShadow: `0 0 40px ${scoreColor(farm.resilienceScore)}44`,
              }}>
                {farm.resilienceScore}
              </div>
              <div style={{ fontSize: "0.8rem", color: scoreColor(farm.resilienceScore), marginTop: "4px", fontWeight: 600 }}>
                {scoreLabel(farm.resilienceScore)}
              </div>
            </div>

            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", fontFamily: "var(--mono)" }}>
              UNLOCKED BENEFITS
            </div>
            <div style={{ marginTop: "8px" }}>
              {benefits.filter((b) => farm.resilienceScore >= b.min).map((b) => (
                <div key={b.label} style={{
                  fontSize: "0.8rem", padding: "8px 0",
                  borderBottom: "1px solid var(--border)",
                  color: "var(--text)",
                }}>
                  {b.label}
                </div>
              ))}
              {benefits.filter((b) => farm.resilienceScore < b.min).map((b) => (
                <div key={b.label} style={{
                  fontSize: "0.8rem", padding: "8px 0",
                  borderBottom: "1px solid var(--border)",
                  color: "var(--text-dim)",
                  opacity: 0.5,
                }}>
                  🔒 {b.label} (need {b.min}+)
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: "var(--bg2)", border: "1px solid var(--border)",
        borderRadius: "16px", padding: "1.5rem",
      }}>
        <h3 style={{ fontWeight: 700, marginBottom: "1rem" }}>How the Score Works</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
          {[
            { label: "Weather Stability", desc: "Consistent rainfall patterns improve score", icon: "🌤" },
            { label: "Event Recovery", desc: "Recovering after climate events adds resilience points", icon: "📈" },
            { label: "Coverage History", desc: "Consistent insurance enrollment builds trust", icon: "🛡" },
            { label: "HCS Records", desc: "Every event immutably recorded on Hedera", icon: "🔗" },
          ].map((item) => (
            <div key={item.label} style={{
              background: "rgba(255,255,255,0.02)", borderRadius: "10px", padding: "1rem",
            }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "6px" }}>{item.icon}</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>{item.label}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// PayoutHistory.jsx
export function PayoutHistory({ payouts }) {
  return (
    <div>
      <h2 style={{ fontWeight: 800, fontSize: "1.5rem", marginBottom: "0.5rem" }}>Payout History</h2>
      <p style={{ color: "var(--text-dim)", marginBottom: "2rem", fontSize: "0.9rem" }}>
        All climate events and payouts immutably recorded on Hedera Consensus Service.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {payouts.map((payout) => (
          <div key={payout.id} style={{
            background: "var(--bg2)", border: "1px solid var(--border)",
            borderRadius: "14px", padding: "1.25rem",
            display: "grid", gridTemplateColumns: "1fr auto",
            alignItems: "center", gap: "1rem",
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <span style={{
                  fontSize: "0.7rem", fontWeight: 700,
                  color: payout.eventType === "drought" ? "#f59e0b" : "#60a5fa",
                  background: payout.eventType === "drought" ? "rgba(245,158,11,0.1)" : "rgba(96,165,250,0.1)",
                  border: `1px solid ${payout.eventType === "drought" ? "rgba(245,158,11,0.3)" : "rgba(96,165,250,0.3)"}`,
                  borderRadius: "4px", padding: "2px 8px", fontFamily: "var(--mono)",
                }}>
                  {payout.eventType.toUpperCase()}
                </span>
                <span style={{ fontWeight: 700 }}>{payout.farmName}</span>
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", fontFamily: "var(--mono)" }}>
                {payout.date} · HCS #{payout.hcsSequence}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", fontFamily: "var(--mono)", marginTop: "4px", opacity: 0.6 }}>
                TX: {payout.txHash}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#22c55e" }}>
                +{payout.amount}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", fontFamily: "var(--mono)" }}>HBAR</div>
            </div>
          </div>
        ))}
      </div>

      {payouts.length === 0 && (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-dim)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📋</div>
          <p>No payouts yet. All future payouts will appear here with HCS proof.</p>
        </div>
      )}
    </div>
  );
}
