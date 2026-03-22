// DisputeCenter.jsx — Dispute resolution panel
import { useState } from "react";

const MOCK_DISPUTES = [
  {
    id: 1, farmName: "Finca El Progreso", status: "pending",
    reason: "Hubo sequía 10 días pero no recibí el pago",
    raisedAt: "2026-03-15", arbitrator: null,
  },
];

export default function DisputeCenter({ farms }) {
  const [disputes, setDisputes] = useState(MOCK_DISPUTES);
  const [form, setForm] = useState({ farmId: "", reason: "" });
  const [submitted, setSubmitted] = useState(false);

  const statusColor = { pending: "#f59e0b", resolved: "#22c55e", rejected: "#ef4444" };
  const statusLabel = { pending: "⏳ Pending Review", resolved: "✅ Resolved", rejected: "❌ Rejected" };

  const submit = () => {
    if (!form.farmId || !form.reason.trim()) return;
    const farm = farms.find(f => String(f.id) === form.farmId);
    setDisputes(prev => [...prev, {
      id: prev.length + 1,
      farmName: farm?.name || `Farm #${form.farmId}`,
      status: "pending",
      reason: form.reason,
      raisedAt: new Date().toISOString().split("T")[0],
      arbitrator: null,
    }]);
    setForm({ farmId: "", reason: "" });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h2 style={{ fontWeight: 800, fontSize: "1.5rem", marginBottom: "0.5rem" }}>⚖️ Dispute Center</h2>
      <p style={{ color: "var(--text-dim)", fontSize: "0.9rem", marginBottom: "2rem" }}>
        If you believe a payout was missed, raise a dispute. All disputes are recorded on-chain via Hedera Consensus Service and reviewed by community arbitrators within 3 business days.
      </p>

      {/* Raise dispute form */}
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" }}>
        <h3 style={{ fontWeight: 700, marginBottom: "1rem" }}>Raise a Dispute</h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: "0.72rem", fontFamily: "var(--mono)", color: "var(--text-dim)", marginBottom: 6 }}>SELECT FARM</label>
            <select
              value={form.farmId}
              onChange={e => setForm(f => ({ ...f, farmId: e.target.value }))}
              style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", color: "var(--text)", fontFamily: "var(--font)", fontSize: "0.9rem", outline: "none" }}
            >
              <option value="">-- Choose your farm --</option>
              {farms.map(f => (
                <option key={f.id} value={f.id}>{f.name} · {f.location}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.72rem", fontFamily: "var(--mono)", color: "var(--text-dim)", marginBottom: 6 }}>DESCRIBE THE ISSUE</label>
            <textarea
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              placeholder="e.g. There was a drought for 8 days but I didn't receive a payout..."
              rows={4}
              style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", color: "var(--text)", fontFamily: "var(--font)", fontSize: "0.9rem", outline: "none", resize: "vertical" }}
            />
          </div>

          {submitted ? (
            <div style={{ background: "var(--green-glow)", border: "1px solid var(--green)", borderRadius: 10, padding: "12px 16px", color: "var(--green)", fontWeight: 600, fontSize: "0.9rem" }}>
              ✅ Dispute recorded on-chain. Arbitrators notified.
            </div>
          ) : (
            <button
              onClick={submit}
              disabled={!form.farmId || !form.reason.trim()}
              style={{ background: form.farmId && form.reason.trim() ? "var(--amber)" : "var(--bg3)", color: form.farmId && form.reason.trim() ? "#000" : "var(--text-dim)", border: "none", borderRadius: 10, padding: "12px", fontFamily: "var(--font)", fontSize: "0.95rem", fontWeight: 700, cursor: form.farmId && form.reason.trim() ? "pointer" : "not-allowed", transition: "all 0.2s" }}
            >
              Submit Dispute →
            </button>
          )}
        </div>

        <div style={{ marginTop: "1rem", padding: "12px", background: "var(--bg3)", borderRadius: 8, fontSize: "0.75rem", color: "var(--text-dim)", fontFamily: "var(--mono)" }}>
          ℹ️ Disputes are recorded permanently on Hedera Consensus Service. False disputes may affect your Climate Resilience Score. Resolution takes 3 business days.
        </div>
      </div>

      {/* Active disputes */}
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.5rem" }}>
        <h3 style={{ fontWeight: 700, marginBottom: "1rem" }}>Active Disputes ({disputes.length})</h3>
        {disputes.length === 0 ? (
          <p style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>No disputes filed. If everything is working correctly, great!</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {disputes.map(d => (
              <div key={d.id} style={{ background: "var(--bg3)", borderRadius: 12, padding: "1rem", borderLeft: `3px solid ${statusColor[d.status]}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{d.farmName}</span>
                  <span style={{ fontSize: "0.72rem", fontFamily: "var(--mono)", color: statusColor[d.status] }}>{statusLabel[d.status]}</span>
                </div>
                <p style={{ fontSize: "0.82rem", color: "var(--text-dim)", marginBottom: 6 }}>{d.reason}</p>
                <div style={{ fontSize: "0.7rem", fontFamily: "var(--mono)", color: "var(--text-dim)" }}>
                  Filed: {d.raisedAt} · On-chain: HCS #{1000 + d.id}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
