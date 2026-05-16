"use client"
import { useEffect, useRef, useState } from "react"

export type SimEvent = {
  type: string
  agent?: string
  message?: string
  risk_score?: number
  flagged?: boolean
  turn?: number
  alert?: string
  trust?: number
  scenario?: string
  agents?: string[]
  trust_scores?: Record<string, number>
}

export function useSimulation() {
  const [events, setEvents] = useState<SimEvent[]>([])
  const [riskScores, setRiskScores] = useState<Record<string, number>>({})
  const [trustScores, setTrustScores] = useState<Record<string, number>>({})
  const [alerts, setAlerts] = useState<SimEvent[]>([])
  const [running, setRunning] = useState(false)
  const [connected, setConnected] = useState(false)
  const ws = useRef<WebSocket | null>(null)

  useEffect(() => {
    function connect() {
      ws.current = new WebSocket("ws://localhost:8000/ws")
      ws.current.onopen = () => setConnected(true)
      ws.current.onclose = () => {
        setConnected(false)
        setTimeout(connect, 2000)
      }
      ws.current.onmessage = (e) => {
        const data: SimEvent = JSON.parse(e.data)
        setEvents(prev => [data, ...prev].slice(0, 300))
        if (data.type === "agent_message" && data.agent && data.risk_score !== undefined) {
          setRiskScores(prev => ({ ...prev, [data.agent!]: data.risk_score! }))
          if (data.trust !== undefined) {
            setTrustScores(prev => ({ ...prev, [data.agent!]: data.trust! }))
          }
        }
        if (data.type === "monitor_alert") {
          setAlerts(prev => [data, ...prev])
        }
        if (data.type === "simulation_start") setRunning(true)
        if (data.type === "simulation_end") setRunning(false)
      }
    }
    connect()
    return () => ws.current?.close()
  }, [])

  async function startScenario(name: string) {
    setEvents([])
    setRiskScores({})
    setTrustScores({})
    setAlerts([])
    await fetch(`http://localhost:8000/run-scenario/${name}`, { method: "POST" })
  }

  const messages = events.filter(e => e.type === "agent_message")

  return { events, messages, riskScores, trustScores, alerts, running, connected, startScenario }
}