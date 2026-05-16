"use client"
import { useState } from "react"
import dynamic from "next/dynamic"
import { useSimulation } from "@/hooks/useSimulation"
import RiskChart from "@/components/RiskChart"
import EventFeed from "@/components/EventFeed"

const AgentGraph = dynamic(() => import("@/components/AgentGraph"), { ssr: false })

const SCENARIOS = [
  { id: "rogue_deployment", label: "Rogue Deployment" },
  { id: "financial", label: "Financial Collusion" },
  { id: "emergency", label: "Emergency Response" },
]

const SCENARIO_AGENTS: Record<string, string[]> = {
  rogue_deployment: ["developer_agent", "security_reviewer", "deployment_agent"],
  financial: ["trading_agent", "sentiment_agent", "compliance_agent"],
  emergency: ["routing_agent", "resource_agent", "dispatch_agent"],
}

export default function Home() {
  const [scenario, setScenario] = useState("rogue_deployment")
  const { messages, riskScores, trustScores, alerts, running, connected, startScenario } = useSimulation()

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "white", borderBottom: "1px solid #e2e8f0",
        padding: "0 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%",
            background: connected ? "#22c55e" : "#ef4444" }} />
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.3px" }}>
            Agent Arena
          </span>
          <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 4 }}>
            AI Safety Monitor
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <select value={scenario} onChange={e => setScenario(e.target.value)}
            style={{ fontSize: 13, padding: "6px 10px", borderRadius: 8,
              border: "1px solid #e2e8f0", background: "white", cursor: "pointer" }}>
            {SCENARIOS.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <button onClick={() => startScenario(scenario)} disabled={running}
            style={{ fontSize: 13, padding: "6px 16px", borderRadius: 8,
              background: running ? "#94a3b8" : "#1e293b", color: "white",
              border: "none", cursor: running ? "not-allowed" : "pointer",
              fontWeight: 500 }}>
            {running ? "Running..." : "Run scenario"}
          </button>
        </div>
      </div>

      {alerts.length > 0 && (
        <div style={{ background: "#fff1f2", borderBottom: "2px solid #ef4444",
          padding: "10px 24px", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#ef4444",
            textTransform: "uppercase", letterSpacing: "0.05em",
            flexShrink: 0, paddingTop: 1 }}>Monitor alert</span>
          <span style={{ fontSize: 13, color: "#7f1d1d", lineHeight: 1.5 }}>
            {alerts[0].alert}
          </span>
        </div>
      )}

      <div style={{ padding: 24, display: "grid",
        gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        <div style={{ background: "white", borderRadius: 12,
          border: "1px solid #e2e8f0", padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#475569",
            textTransform: "uppercase", letterSpacing: "0.05em",
            marginBottom: 12 }}>Communication graph</div>
          <AgentGraph
            riskScores={riskScores}
            messages={messages}
            agentNames={SCENARIO_AGENTS[scenario]}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ background: "white", borderRadius: 12,
            border: "1px solid #e2e8f0", padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#475569",
              textTransform: "uppercase", letterSpacing: "0.05em",
              marginBottom: 12 }}>Risk scores over time</div>
            <RiskChart messages={messages} />
          </div>

          <div style={{ background: "white", borderRadius: 12,
            border: "1px solid #e2e8f0", padding: "16px 0 0" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#475569",
              textTransform: "uppercase", letterSpacing: "0.05em",
              marginBottom: 12, padding: "0 16px" }}>Trust scores</div>
            <div style={{ display: "flex", gap: 12, padding: "0 16px 16px" }}>
              {SCENARIO_AGENTS[scenario].map(name => (
                <div key={name} style={{ flex: 1, background: "#f8fafc",
                  borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700,
                    color: trustColor(trustScores[name] ?? 1) }}>
                    {((trustScores[name] ?? 1) * 100).toFixed(0)}%
                  </div>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                    {name.replace(/_/g, " ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ margin: "0 24px 24px", background: "white",
        borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#475569",
          textTransform: "uppercase", letterSpacing: "0.05em",
          padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
          Live event feed — {messages.length} events
        </div>
        <EventFeed messages={messages} />
      </div>
    </div>
  )
}

function trustColor(score: number) {
  if (score < 0.6) return "#ef4444"
  if (score < 0.8) return "#f59e0b"
  return "#22c55e"
}