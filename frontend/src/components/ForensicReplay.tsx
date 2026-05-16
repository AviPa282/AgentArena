"use client"
import { useState } from "react"

type ReplayEvent = {
  TS: string
  AGENT_NAME: string
  MESSAGE: string
  RISK_SCORE: number
  FLAGGED: boolean
  TURN_NUM: number
  THREAT_TYPE?: string
  SEVERITY?: string
  DETECTION_FLAG?: boolean
}

type Props = { scenario: string }

export default function ForensicReplay({ scenario }: Props) {
  const [replay, setReplay] = useState<ReplayEvent[]>([])
  const [cursor, setCursor] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  async function loadReplay() {
    setLoading(true)
    try {
      const r = await fetch(`http://localhost:8000/forensic/${scenario}`)
      const d = await r.json()
      setReplay(d.replay ?? [])
      setCursor(0)
      setLoaded(true)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const current = replay[cursor]

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "#64748b" }}>
          {loaded ? `${replay.length} events loaded from Snowflake` : "Query Snowflake incident log"}
        </div>
        <button onClick={loadReplay} disabled={loading}
          style={{ fontSize: 12, padding: "6px 14px", borderRadius: 8,
            background: "#1e293b", color: "white", border: "none",
            cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "Loading..." : loaded ? "Refresh" : "Load incident log"}
        </button>
      </div>

      {loaded && replay.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center",
            gap: 12, marginBottom: 16 }}>
            <button onClick={() => setCursor(c => Math.max(0, c - 1))}
              disabled={cursor === 0}
              style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #e2e8f0",
                background: "white", cursor: cursor === 0 ? "not-allowed" : "pointer",
                color: cursor === 0 ? "#cbd5e1" : "#1e293b" }}>←</button>
            <input type="range" min={0} max={replay.length - 1}
              value={cursor} step={1}
              onChange={e => setCursor(Number(e.target.value))}
              style={{ flex: 1 }} />
            <button onClick={() => setCursor(c => Math.min(replay.length - 1, c + 1))}
              disabled={cursor === replay.length - 1}
              style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #e2e8f0",
                background: "white", cursor: cursor === replay.length - 1 ? "not-allowed" : "pointer",
                color: cursor === replay.length - 1 ? "#cbd5e1" : "#1e293b" }}>→</button>
            <span style={{ fontSize: 12, color: "#94a3b8", minWidth: 60, textAlign: "right" }}>
              {cursor + 1} / {replay.length}
            </span>
          </div>

          {current && (
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
              <div style={{
                background: current.FLAGGED ? "#fff1f2" : "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
                padding: "10px 14px",
                display: "flex", alignItems: "center", gap: 10
              }}>
                <span style={{ fontSize: 11, fontFamily: "monospace",
                  color: "#94a3b8" }}>Turn {current.TURN_NUM}</span>
                <span style={{ fontSize: 12, fontWeight: 600,
                  color: current.FLAGGED ? "#ef4444" : "#475569",
                  textTransform: "uppercase" }}>
                  {current.AGENT_NAME?.replace(/_/g, " ")}
                </span>
                <span style={{
                  fontSize: 11, padding: "1px 8px", borderRadius: 999,
                  background: riskBg(current.RISK_SCORE),
                  color: riskText(current.RISK_SCORE), fontWeight: 500
                }}>
                  risk {current.RISK_SCORE?.toFixed(2)}
                </span>
                {current.FLAGGED && (
                  <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 999,
                    background: "#fee2e2", color: "#ef4444", fontWeight: 600 }}>
                    FLAGGED
                  </span>
                )}
                <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: "auto" }}>
                  {new Date(current.TS).toLocaleTimeString()}
                </span>
              </div>

              <div style={{ padding: "12px 14px", fontSize: 13,
                color: "#334155", lineHeight: 1.6 }}>
                {current.MESSAGE}
              </div>

              {current.THREAT_TYPE && (
                <div style={{ padding: "10px 14px",
                  borderTop: "1px solid #e2e8f0",
                  background: "#fff7ed" }}>
                  <span style={{ fontSize: 11, fontWeight: 600,
                    color: "#92400e", marginRight: 8 }}>
                    Threat data cited:
                  </span>
                  <span style={{ fontSize: 12, color: "#78350f" }}>
                    {current.THREAT_TYPE} — severity: {current.SEVERITY} —
                    actually flagged in dataset: {String(current.DETECTION_FLAG)}
                  </span>
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {replay.map((e, i) => (
              <div key={i} onClick={() => setCursor(i)}
                title={`Turn ${e.TURN_NUM} — ${e.AGENT_NAME}`}
                style={{
                  width: 20, height: 20, borderRadius: 4, cursor: "pointer",
                  background: e.FLAGGED ? "#ef4444" : "#e2e8f0",
                  border: i === cursor ? "2px solid #1e293b" : "2px solid transparent",
                  transition: "all 0.15s",
                }} />
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
            Red = flagged event. Click any block to jump to it.
          </div>
        </>
      )}

      {loaded && replay.length === 0 && (
        <div style={{ textAlign: "center", color: "#94a3b8",
          fontSize: 13, padding: "2rem" }}>
          No events found for this scenario yet. Run a simulation first.
        </div>
      )}
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