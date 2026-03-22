// PoolDashboard.jsx v2 — with fee breakdown, carencia info, and MetaMask wallet
import { useState } from "react";

const POOL_CONTRACT_ADDRESS = "0x00000000000000000000000000000000007f1a40"; // 0.0.8329792
const HEDERA_TESTNET = {
  chainId: "0x128", // 296
  chainName: "Hedera Testnet",
  rpcUrls: ["https://testnet.hashio.io/api"],
  nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 18 },
  blockExplorerUrls: ["https://hashscan.io/testnet"],
};

const POOL_ABI = [
  "function fundAsONG() payable",
  "function depositAsInvestor() payable",
  "function claimYield()",
  "function payPremium() payable",
  "function pendingYield(address) view returns (uint256)",
];

async function ensureHederaNetwork() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: HEDERA_TESTNET.chainId }],
    });
  } catch (e) {
    if (e.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [HEDERA_TESTNET],
      });
    }
  }
}

export default function PoolDashboard({ farms = [] }) {
  const [wallet, setWallet] = useState(null);
  const [txStatus, setTxStatus] = useState(null);
  const [pendingYield, setPendingYield] = useState(null);
  const [calling, setCalling] = useState(false);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setTxStatus({ error: "MetaMask not found. Install it from metamask.io" });
      return;
    }
    try {
      await ensureHederaNetwork();
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWallet(accounts[0]);
      setTxStatus(null);
      // Check pending yield
      const { ethers } = await import("ethers");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(POOL_CONTRACT_ADDRESS, POOL_ABI, provider);
      const yieldWei = await contract.pendingYield(accounts[0]);
      setPendingYield(Number(ethers.formatEther(yieldWei)).toFixed(4));
    } catch (e) {
      setTxStatus({ error: e.message });
    }
  };

  const callPool = async (fnName, amountHbar) => {
    if (!wallet) { await connectWallet(); return; }
    setCalling(true);
    setTxStatus(null);
    try {
      const { ethers } = await import("ethers");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(POOL_CONTRACT_ADDRESS, POOL_ABI, signer);
      const valueWei = amountHbar ? ethers.parseEther(amountHbar.toString()) : undefined;
      const tx = valueWei
        ? await contract[fnName]({ value: valueWei })
        : await contract[fnName]();
      setTxStatus({ msg: "⏳ Transaction submitted..." });
      await tx.wait();
      setTxStatus({
        msg: `✅ ${fnName}() confirmed!`,
        url: `https://hashscan.io/testnet/transaction/${tx.hash}`,
      });
    } catch (e) {
      setTxStatus({ error: `❌ ${e.shortMessage || e.message}` });
    } finally {
      setCalling(false);
    }
  };

  const HBAR_USD = 0.093;
  const FEE_PCT = 3;

  const activeFarms = farms.filter(f => f.status !== "carencia").length;
  const inCarencia = farms.filter(f => f.status === "carencia").length;
  const totalPremiums = farms.reduce((s, f) => s + (f.coverageHbar || 100) * 0.1, 0);
  const totalFees = totalPremiums * (FEE_PCT / 100);
  const netPremiums = totalPremiums - totalFees;

  const poolData = {
    balance: 1240 + Math.round(netPremiums),
    totalFromFarmers: 340 + Math.round(netPremiums),
    totalFromONGs: 600,
    totalFromInvestors: 300,
    totalPayouts: 200,
    totalFeesCollected: Math.round(totalFees + 18),
    activePolicies: activeFarms || 34,
    poolContractId: "0.0.8329792",
    coreContractId: "0.0.8324803",
  };

  const sources = [
    { type: "🌱 Farmers", amount: poolData.totalFromFarmers, color: "#22c55e", desc: "Automatic monthly premiums (net of 3% fee)", pct: Math.round((poolData.totalFromFarmers / poolData.balance) * 100) },
    { type: "🤝 ONGs & Grants", amount: poolData.totalFromONGs, color: "#60a5fa", desc: "CGIAR, GIZ, HBAR Foundation", pct: Math.round((poolData.totalFromONGs / poolData.balance) * 100) },
    { type: "📈 ESG Investors", amount: poolData.totalFromInvestors, color: "#f59e0b", desc: "~8% annual yield + impact", pct: Math.round((poolData.totalFromInvestors / poolData.balance) * 100) },
  ];

  const tiers = [
    { tier: "Tier 1 — First Loss", source: "ONGs & Grants", color: "#60a5fa", desc: "Absorbs first claims. No financial return. Receives verifiable on-chain impact reports.", risk: "Highest", return: "Impact only" },
    { tier: "Tier 2 — Mezzanine Capital", source: "ESG Investors", color: "#f59e0b", desc: "Enters after Tier 1. Earns yield from unclaimed premiums + DeFi yield while capital waits.", risk: "Medium", return: "~8% annual" },
    { tier: "Tier 3 — Continuous Flow", source: "Farmer Premiums", color: "#22c55e", desc: "Automatic on-chain premiums. Accumulates continuously. Predictable pool base.", risk: "Low", return: "Coverage" },
  ];

  const impactNumbers = [
    { label: "Active policies", value: poolData.activePolicies, icon: "🌾" },
    { label: "In carencia (30d)", value: inCarencia, icon: "⏳" },
    { label: "Pool total", value: `${poolData.balance} HBAR`, icon: "🏦" },
    { label: "Payouts executed", value: `${poolData.totalPayouts} HBAR`, icon: "💸" },
    { label: "Protocol fees earned", value: `${poolData.totalFeesCollected} HBAR`, icon: "⚡" },
    { label: "Pool value USD", value: `$${(poolData.balance * HBAR_USD).toFixed(0)}`, icon: "💵" },
  ];

  const s = (v) => ({ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.5rem", ...(v || {}) });

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontWeight: 800, fontSize: "1.5rem", marginBottom: "0.5rem" }}>🏦 Insurance Pool</h2>
        <p style={{ color: "var(--text-dim)", fontSize: "0.9rem" }}>
          Multi-source parametric pool · 3% protocol fee on all transactions ·{" "}
          <a href={`https://hashscan.io/testnet/contract/${poolData.poolContractId}`} target="_blank" rel="noreferrer" style={{ color: "var(--green)", fontFamily: "var(--mono)", fontSize: "0.8rem" }}>{poolData.poolContractId}</a>
        </p>
      </div>

      {/* Fee breakdown banner */}
      <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", gap: "2rem", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "0.68rem", fontFamily: "var(--mono)", color: "var(--text-dim)" }}>PROTOCOL FEE</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--green)" }}>3%</div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>on all premiums & payouts</div>
        </div>
        <div>
          <div style={{ fontSize: "0.68rem", fontFamily: "var(--mono)", color: "var(--text-dim)" }}>FEES COLLECTED</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--green)" }}>{poolData.totalFeesCollected} HBAR</div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>≈ ${(poolData.totalFeesCollected * HBAR_USD).toFixed(1)} USD</div>
        </div>
        <div>
          <div style={{ fontSize: "0.68rem", fontFamily: "var(--mono)", color: "var(--text-dim)" }}>INVESTOR YIELD</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f59e0b" }}>8%</div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>annual to investors</div>
        </div>
        <div>
          <div style={{ fontSize: "0.68rem", fontFamily: "var(--mono)", color: "var(--text-dim)" }}>YIELD SPREAD</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f59e0b" }}>4%</div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>protocol revenue</div>
        </div>
        <div>
          <div style={{ fontSize: "0.68rem", fontFamily: "var(--mono)", color: "var(--text-dim)" }}>CARENCIA PERIOD</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--amber)" }}>30 days</div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>industry standard</div>
        </div>
      </div>

      {/* Impact numbers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginBottom: "1.5rem" }}>
        {impactNumbers.map(n => (
          <div key={n.label} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: "1rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.4rem", marginBottom: 6 }}>{n.icon}</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--green)" }}>{n.value}</div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", marginTop: 4 }}>{n.label}</div>
          </div>
        ))}
      </div>

      {/* Pool composition */}
      <div style={{ ...s(), marginBottom: "1.5rem" }}>
        <h3 style={{ fontWeight: 700, marginBottom: "1.25rem" }}>Pool Composition</h3>
        <div style={{ height: 12, borderRadius: 6, overflow: "hidden", display: "flex", marginBottom: "1.5rem", background: "var(--bg3)" }}>
          {sources.map(s => <div key={s.type} style={{ width: `${s.pct}%`, background: s.color, transition: "width 0.5s" }} />)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sources.map(src => (
            <div key={src.type} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: "1rem" }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{src.type}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>{src.desc}</div>
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "0.85rem", color: src.color, fontWeight: 700 }}>{src.amount} HBAR</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "0.75rem", color: "var(--text-dim)" }}>{src.pct}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Capital structure */}
      <div style={{ ...s(), marginBottom: "1.5rem" }}>
        <h3 style={{ fontWeight: 700, marginBottom: "1.25rem" }}>Capital Structure (3-tier)</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {tiers.map(t => (
            <div key={t.tier} style={{ background: "var(--bg3)", borderRadius: 12, padding: "1rem", borderLeft: `3px solid ${t.color}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{t.tier}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontSize: "0.68rem", fontFamily: "var(--mono)", background: "rgba(255,255,255,0.05)", borderRadius: 4, padding: "2px 8px", color: "var(--text-dim)" }}>Risk: {t.risk}</span>
                  <span style={{ fontSize: "0.68rem", fontFamily: "var(--mono)", background: `${t.color}22`, borderRadius: 4, padding: "2px 8px", color: t.color }}>{t.return}</span>
                </div>
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>{t.desc}</div>
              <div style={{ marginTop: 6, fontSize: "0.72rem", fontFamily: "var(--mono)", color: t.color }}>{t.source}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Wallet Connect + Fund the Pool */}
      <div style={s()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: "0.25rem" }}>Fund the Pool</h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>Connect MetaMask on Hedera Testnet to interact directly.</p>
          </div>
          <button
            onClick={connectWallet}
            style={{ background: wallet ? "var(--green-glow)" : "var(--green)", color: wallet ? "var(--green)" : "#000", border: wallet ? "1px solid var(--green)" : "none", borderRadius: 10, padding: "10px 20px", fontFamily: "var(--font)", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
          >
            {wallet ? `✅ ${wallet.slice(0, 6)}...${wallet.slice(-4)}` : "Connect MetaMask →"}
          </button>
        </div>

        {pendingYield && Number(pendingYield) > 0 && (
          <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10, padding: "10px 16px", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "#f59e0b" }}>💰 Pending yield: <b>{pendingYield} HBAR</b></span>
            <button onClick={() => callPool("claimYield", null)} disabled={calling} style={{ background: "#f59e0b", color: "#000", border: "none", borderRadius: 8, padding: "6px 14px", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}>
              Claim Yield
            </button>
          </div>
        )}

        {txStatus && (
          <div style={{ background: txStatus.error ? "rgba(239,68,68,0.1)" : "var(--green-glow)", border: `1px solid ${txStatus.error ? "#ef4444" : "var(--green)"}`, borderRadius: 10, padding: "10px 16px", marginBottom: "1rem", fontSize: "0.82rem", color: txStatus.error ? "#ef4444" : "var(--green)" }}>
            {txStatus.error || txStatus.msg}
            {txStatus.url && <a href={txStatus.url} target="_blank" rel="noreferrer" style={{ display: "block", marginTop: 4, color: "var(--green)", fontSize: "0.75rem" }}>🔗 View on HashScan →</a>}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {[
            { label: "As ONG / Grant", color: "#60a5fa", desc: "Impact reporting on-chain", fn: "fundAsONG", display: "fundAsONG()", amount: 10 },
            { label: "As ESG Investor", color: "#f59e0b", desc: "~8% yield + impact", fn: "depositAsInvestor", display: "depositAsInvestor()", amount: 10 },
            { label: "As Farmer", color: "#22c55e", desc: "10 HBAR premium", fn: "payPremium", display: "payPremium()", amount: 10 },
          ].map(cta => (
            <div key={cta.label} style={{ background: "var(--bg3)", borderRadius: 12, padding: "1rem", textAlign: "center", border: `1px solid ${cta.color}33` }}>
              <div style={{ fontWeight: 700, color: cta.color, marginBottom: 4, fontSize: "0.85rem" }}>{cta.label}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginBottom: 10 }}>{cta.desc}</div>
              <button
                onClick={() => callPool(cta.fn, cta.amount)}
                disabled={calling}
                style={{ width: "100%", background: calling ? "var(--bg2)" : `${cta.color}22`, color: calling ? "var(--text-dim)" : cta.color, border: `1px solid ${cta.color}44`, borderRadius: 8, padding: "7px", fontFamily: "var(--mono)", fontSize: "0.72rem", fontWeight: 700, cursor: calling ? "not-allowed" : "pointer" }}
              >
                {calling ? "⏳..." : cta.display}
              </button>
              <div style={{ fontSize: "0.62rem", fontFamily: "var(--mono)", color: "var(--text-dim)", marginTop: 6 }}>{poolData.poolContractId}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: "0.7rem", color: "var(--text-dim)", fontFamily: "var(--mono)", marginTop: "1rem", textAlign: "center" }}>
          Requires MetaMask · Hedera Testnet (chainId 296) · Contract {poolData.poolContractId}
        </p>
      </div>
    </div>
  );
}
