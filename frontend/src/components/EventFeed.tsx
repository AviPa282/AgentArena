"use client"
import { SimEvent } from "@/hooks/useSimulation"

type Props = { messages: SimEvent[] }

export default function EventFeed({ messages }: Props) {
  if (messages.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center",
        color: "#94a3b8", fontSize: 13 }}>
        No events yet — start a scenario to begin.
      </div>
    )
  }

  return (
    <div style={{ maxHeight: 340, overflowY: "auto" }}>
      {messages.map((e, i) => (
        <div key={i} style={{
          padding: "10px 14px",
          borderBottom: "1px solid #f1f5f9",
          background: e.flagged ? "#fff1f2" : "white",
        }}>
          <div style={{ display: "flex", alignItems: "center",
            gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, fontFamily: "monospace",
              color: "#94a3b8", minWidth: 28 }}>T{e.turn}</span>
            <span style={{ fontSize: 11, fontWeight: 600,
              color: e.flagged ? "#ef4444" : "#475569",
              textTransform: "uppercase" }}>
              {e.agent?.replace(/_/g, " ")}
            </span>
            <span style={{
              fontSize: 10, padding: "1px 7px", borderRadius: 999,
              fontWeight: 500, background: riskBg(e.risk_score ?? 0),
              color: riskText(e.risk_score ?? 0),
            }}>
              risk {(e.risk_score ?? 0).toFixed(2)}
            </span>
            {e.frustration !== undefined && e.frustration > 0.2 && (
              <span style={{
                fontSize: 10, padding: "1px 7px", borderRadius: 999,
                fontWeight: 500, background: frustBg(e.frustration),
                color: frustText(e.frustration),
              }}>
                frust {e.frustration.toFixed(2)}
              </span>
            )}
            {e.flagged && (
              <span style={{
                fontSize: 10, padding: "1px 7px", borderRadius: 999,
                background: "#fee2e2", color: "#ef4444", fontWeight: 600
              }}>FLAGGED</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "#64748b",
            lineHeight: 1.5, paddingLeft: 36 }}>
            {e.message}
          </div>
        </div>
      ))}
    </div>
  )
}

function riskBg(score: number) {
  if (score > 0.7) return "#fee2e2"
  if (score > 0.4) return "#fef3c7"
  return "#f0fdf4"
}
function riskText(score: number) {
  if (score > 0.7) return "#ef4444"
  if (score > 0.4) return "#d97706"
  return "#16a34a"
}
function frustBg(score: number) {
  if (score > 0.6) return "#fef3c7"
  if (score > 0.35) return "#fff7ed"
  return "#f8fafc"
}
function frustText(score: number) {
  if (score > 0.6) return "#d97706"
  if (score > 0.35) return "#ea580c"
  return "#94a3b8"
}