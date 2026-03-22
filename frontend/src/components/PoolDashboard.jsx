// PoolDashboard.jsx — Multi-source insurance pool page

export default function PoolDashboard() {
  const HBAR_USD = 0.093;

  const poolData = {
    balance: 1240,
    totalFromFarmers: 340,
    totalFromONGs: 600,
    totalFromInvestors: 300,
    totalPayouts: 200,
    activePolicies: 34,
    contractId: "0.0.8324067",
  };

  const sources = [
    {
      type: "🌱 Agricultores",
      amount: poolData.totalFromFarmers,
      color: "#22c55e",
      desc: "Primas mensuales automáticas",
      pct: Math.round((poolData.totalFromFarmers / poolData.balance) * 100),
    },
    {
      type: "🤝 ONGs & Grants",
      amount: poolData.totalFromONGs,
      color: "#60a5fa",
      desc: "CGIAR, GIZ, HBAR Foundation",
      pct: Math.round((poolData.totalFromONGs / poolData.balance) * 100),
    },
    {
      type: "📈 Inversores ESG",
      amount: poolData.totalFromInvestors,
      color: "#f59e0b",
      desc: "Yield ~12% anual + impacto",
      pct: Math.round((poolData.totalFromInvestors / poolData.balance) * 100),
    },
  ];

  const tiers = [
    {
      tier: "Tier 1 — Primera pérdida",
      source: "ONGs & Grants",
      color: "#60a5fa",
      desc: "Absorben primeros siniestros. Sin expectativa de retorno financiero. Reciben reportes de impacto verificables on-chain.",
      risk: "Más alto",
      return: "Solo impacto",
    },
    {
      tier: "Tier 2 — Capital mezzanine",
      source: "Inversores ESG",
      color: "#f59e0b",
      desc: "Entran después del Tier 1. Reciben yield de primas no reclamadas + rendimiento DeFi mientras el capital espera.",
      risk: "Medio",
      return: "~12% anual",
    },
    {
      tier: "Tier 3 — Flujo continuo",
      source: "Primas agricultores",
      color: "#22c55e",
      desc: "Primas automáticas on-chain. Se acumulan continuamente. Base predecible del pool.",
      risk: "Bajo",
      return: "Cobertura",
    },
  ];

  const impactNumbers = [
    { label: "Agricultores cubiertos", value: poolData.activePolicies, icon: "🌾" },
    { label: "Pool total", value: `${poolData.balance} HBAR`, icon: "🏦" },
    { label: "Capacidad de cobertura", value: `${poolData.balance * 10} HBAR`, icon: "🛡" },
    { label: "Pagos ejecutados", value: `${poolData.totalPayouts} HBAR`, icon: "💸" },
    { label: "Valor pool en USD", value: `$${(poolData.balance * HBAR_USD).toFixed(0)}`, icon: "💵" },
    { label: "Países cubiertos", value: "3", icon: "🌎" },
  ];

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontWeight: 800, fontSize: "1.5rem", marginBottom: "0.5rem" }}>
          Insurance Pool
        </h2>
        <p style={{ color: "var(--text-dim)", fontSize: "0.9rem" }}>
          Multi-source parametric pool · Verified on Hedera ·{" "}
          <a
            href={`https://hashscan.io/testnet/contract/${poolData.contractId}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--green)", fontFamily: "var(--mono)", fontSize: "0.8rem" }}
          >
            {poolData.contractId}
          </a>
        </p>
      </div>

      {/* Impact Numbers */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: "12px",
        marginBottom: "2rem",
      }}>
        {impactNumbers.map((n) => (
          <div key={n.label} style={{
            background: "var(--bg2)", border: "1px solid var(--border)",
            borderRadius: "12px", padding: "1rem", textAlign: "center",
          }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "6px" }}>{n.icon}</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--green)" }}>{n.value}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", marginTop: "4px" }}>{n.label}</div>
          </div>
        ))}
      </div>

      {/* Pool composition */}
      <div style={{
        background: "var(--bg2)", border: "1px solid var(--border)",
        borderRadius: "16px", padding: "1.5rem", marginBottom: "1.5rem",
      }}>
        <h3 style={{ fontWeight: 700, marginBottom: "1.25rem" }}>Pool Composition</h3>

        {/* Bar */}
        <div style={{
          height: "12px", borderRadius: "6px", overflow: "hidden",
          display: "flex", marginBottom: "1.5rem",
          background: "var(--bg3)",
        }}>
          {sources.map((s) => (
            <div key={s.type} style={{
              width: `${s.pct}%`, background: s.color,
              transition: "width 0.5s ease",
            }} />
          ))}
        </div>

        {/* Sources */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {sources.map((s) => (
            <div key={s.type} style={{
              display: "grid", gridTemplateColumns: "1fr auto auto",
              alignItems: "center", gap: "1rem",
            }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: "2px" }}>{s.type}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>{s.desc}</div>
              </div>
              <div style={{
                fontFamily: "var(--mono)", fontSize: "0.85rem",
                color: s.color, fontWeight: 700,
              }}>
                {s.amount} HBAR
              </div>
              <div style={{
                fontFamily: "var(--mono)", fontSize: "0.75rem",
                color: "var(--text-dim)",
              }}>
                {s.pct}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tier structure */}
      <div style={{
        background: "var(--bg2)", border: "1px solid var(--border)",
        borderRadius: "16px", padding: "1.5rem", marginBottom: "1.5rem",
      }}>
        <h3 style={{ fontWeight: 700, marginBottom: "1.25rem" }}>Capital Structure</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {tiers.map((t) => (
            <div key={t.tier} style={{
              background: "var(--bg3)", borderRadius: "12px", padding: "1rem",
              borderLeft: `3px solid ${t.color}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{t.tier}</div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <span style={{
                    fontSize: "0.7rem", fontFamily: "var(--mono)",
                    background: "rgba(255,255,255,0.05)", borderRadius: "4px",
                    padding: "2px 8px", color: "var(--text-dim)",
                  }}>
                    Risk: {t.risk}
                  </span>
                  <span style={{
                    fontSize: "0.7rem", fontFamily: "var(--mono)",
                    background: `${t.color}22`, borderRadius: "4px",
                    padding: "2px 8px", color: t.color,
                  }}>
                    {t.return}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>{t.desc}</div>
              <div style={{
                marginTop: "6px", fontSize: "0.75rem",
                fontFamily: "var(--mono)", color: t.color,
              }}>
                {t.source}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fund pool CTA */}
      <div style={{
        background: "var(--bg2)", border: "1px solid var(--border)",
        borderRadius: "16px", padding: "1.5rem",
      }}>
        <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Fund the Pool</h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-dim)", marginBottom: "1.25rem" }}>
          Support climate resilience for smallholder farmers worldwide.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
          {[
            { label: "As ONG / Grant", color: "#60a5fa", desc: "Impact reporting on-chain" },
            { label: "As ESG Investor", color: "#f59e0b", desc: "~12% yield + impact" },
            { label: "As Farmer", color: "#22c55e", desc: "Via Telegram bot" },
          ].map((cta) => (
            <div key={cta.label} style={{
              background: "var(--bg3)", borderRadius: "12px",
              padding: "1rem", textAlign: "center",
              border: `1px solid ${cta.color}33`,
              cursor: "pointer",
            }}>
              <div style={{ fontWeight: 700, color: cta.color, marginBottom: "4px", fontSize: "0.85rem" }}>
                {cta.label}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>{cta.desc}</div>
              <div style={{
                marginTop: "10px", fontSize: "0.75rem", fontFamily: "var(--mono)",
                color: cta.color, background: `${cta.color}22`,
                borderRadius: "6px", padding: "4px 8px",
              }}>
                Contract: 0.0.8324067
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
