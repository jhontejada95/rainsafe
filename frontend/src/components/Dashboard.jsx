// Dashboard.jsx — Live farm monitoring dashboard

const STATUS_CONFIG = {
  alert: { color: "#ef4444", label: "🚨 ALERT", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)" },
  warning: { color: "#f59e0b", label: "⚠️ WARNING", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)" },
  normal: { color: "#22c55e", label: "✅ HEALTHY", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)" },
  monitoring: { color: "#6b7c6b", label: "👁 MONITORING", bg: "rgba(107,124,107,0.1)", border: "rgba(107,124,107,0.3)" },
};

function ScoreBar({ score }) {
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ marginTop: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", fontFamily: "var(--mono)" }}>
          RESILIENCE SCORE
        </span>
        <span style={{ fontSize: "0.75rem", fontWeight: 700, color, fontFamily: "var(--mono)" }}>
          {score}/100
        </span>
      </div>
      <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${score}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          borderRadius: "2px",
          transition: "width 1s ease",
          boxShadow: `0 0 8px ${color}66`,
        }} />
      </div>
    </div>
  );
}

function FarmCard({ farm }) {
  const status = STATUS_CONFIG[farm.status] || STATUS_CONFIG.monitoring;

  return (
    <div style={{
      background: "var(--bg2)",
      border: `1px solid ${status.border}`,
      borderRadius: "16px",
      padding: "1.5rem",
      position: "relative",
      overflow: "hidden",
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 8px 32px ${status.bg}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Glow effect */}
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: "120px", height: "120px",
        background: `radial-gradient(circle at top right, ${status.bg}, transparent)`,
        pointerEvents: "none",
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "4px" }}>{farm.name}</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", fontFamily: "var(--mono)" }}>
            📍 {farm.location}
          </p>
        </div>
        <span style={{
          fontSize: "0.7rem", fontWeight: 700,
          color: status.color, background: status.bg,
          border: `1px solid ${status.border}`,
          borderRadius: "6px", padding: "4px 10px",
          fontFamily: "var(--mono)",
        }}>
          {status.label}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "4px" }}>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "12px" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", fontFamily: "var(--mono)", marginBottom: "4px" }}>
            RAIN (7 DAYS)
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: farm.totalMm < 5 ? "#ef4444" : "var(--text)" }}>
            {farm.totalMm.toFixed(1)}<span style={{ fontSize: "0.8rem", fontWeight: 400, marginLeft: "4px" }}>mm</span>
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "12px" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", fontFamily: "var(--mono)", marginBottom: "4px" }}>
            COVERAGE
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--green)" }}>
            {farm.coverageHbar}<span style={{ fontSize: "0.8rem", fontWeight: 400, marginLeft: "4px" }}>HBAR</span>
          </div>
        </div>
      </div>

      {farm.status === "alert" && (
        <div style={{
          marginTop: "12px",
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: "8px", padding: "10px 14px",
          fontSize: "0.8rem", color: "#ef4444",
          fontFamily: "var(--mono)",
        }}>
          🚨 {farm.eventType?.toUpperCase()} DETECTED — Automatic payout initiated
        </div>
      )}

      <ScoreBar score={farm.resilienceScore} />
    </div>
  );
}

export default function Dashboard({ farms }) {
  const alerts = farms.filter((f) => f.status === "alert").length;
  const warnings = farms.filter((f) => f.status === "warning").length;
  const healthy = farms.filter((f) => f.status === "normal").length;

  return (
    <div>
      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "2rem" }}>
        {[
          { label: "TOTAL FARMS", value: farms.length, color: "var(--text)" },
          { label: "ACTIVE ALERTS", value: alerts, color: "#ef4444" },
          { label: "WARNINGS", value: warnings, color: "#f59e0b" },
          { label: "HEALTHY", value: healthy, color: "#22c55e" },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: "var(--bg2)", border: "1px solid var(--border)",
            borderRadius: "12px", padding: "1.25rem",
          }}>
            <div style={{ fontSize: "0.65rem", fontFamily: "var(--mono)", color: "var(--text-dim)", marginBottom: "8px" }}>
              {stat.label}
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Farm cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
        {farms.map((farm) => <FarmCard key={farm.id} farm={farm} />)}
      </div>

      {farms.length === 0 && (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-dim)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🌱</div>
          <p>No farms registered yet. Register your first farm to start monitoring.</p>
        </div>
      )}
    </div>
  );
}
