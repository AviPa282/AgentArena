"use client"
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine
} from "recharts"
import { SimEvent } from "@/hooks/useSimulation"

type Props = { messages: SimEvent[] }

const AGENT_COLORS: Record<string, string> = {
  developer_agent:   "#3b82f6",
  security_reviewer: "#22c55e",
  deployment_agent:  "#ef4444",
  trading_agent:     "#3b82f6",
  sentiment_agent:   "#ef4444",
  compliance_agent:  "#22c55e",
  routing_agent:     "#3b82f6",
  resource_agent:    "#ef4444",
  dispatch_agent:    "#22c55e",
}

export default function RiskChart({ messages }: Props) {
  const agentNames = [...new Set(messages.map(m => m.agent).filter(Boolean))] as string[]

  const byTurn: Record<number, Record<string, number>> = {}
  messages.forEach(m => {
    if (m.turn === undefined || !m.agent) return
    if (!byTurn[m.turn]) byTurn[m.turn] = {}
    byTurn[m.turn][m.agent] = m.risk_score ?? 0
  })

  const chartData = Object.entries(byTurn)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([turn, scores]) => ({ turn: `T${turn}`, ...scores }))

  if (chartData.length === 0) {
    return (
      <div style={{ height: 220, display: "flex", alignItems: "center",
        justifyContent: "center", color: "#94a3b8", fontSize: 13,
        border: "1px solid #e2e8f0", borderRadius: 12 }}>
        Waiting for simulation data...
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
        <XAxis dataKey="turn" fontSize={11} tick={{ fill: "#94a3b8" }} />
        <YAxis domain={[0, 1]} fontSize={11} tick={{ fill: "#94a3b8" }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
          formatter={(val) => (typeof val === "number" ? val.toFixed(2) : val)}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <ReferenceLine y={0.55} stroke="#f59e0b" strokeDasharray="4 2"
          label={{ value: "flag threshold", fontSize: 10, fill: "#f59e0b" }} />
        {agentNames.map(name => (
          <Line key={name} type="monotone" dataKey={name}
            stroke={AGENT_COLORS[name] ?? "#8b5cf6"}
            strokeWidth={2} dot={false} connectNulls />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}