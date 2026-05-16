"use client"
import ReactFlow, {
  Node, Edge, Background, Controls, MarkerType
} from "reactflow"
import "reactflow/dist/style.css"
import { SimEvent } from "@/hooks/useSimulation"

const AGENT_POSITIONS: Record<string, { x: number; y: number }> = {
  developer_agent:   { x: 80,  y: 200 },
  security_reviewer: { x: 480, y: 200 },
  deployment_agent:  { x: 280, y: 380 },
  trading_agent:     { x: 80,  y: 200 },
  sentiment_agent:   { x: 480, y: 200 },
  compliance_agent:  { x: 280, y: 380 },
  routing_agent:     { x: 80,  y: 200 },
  resource_agent:    { x: 480, y: 200 },
  dispatch_agent:    { x: 280, y: 380 },
  monitor_agent:     { x: 280, y: 40  },
}

function nodeColor(risk: number, frustration: number) {
  if (frustration > 0.6) return "#fef3c7"
  if (risk > 0.7) return "#fee2e2"
  if (risk > 0.4) return "#fff7ed"
  return "#f0fdf4"
}

function nodeBorder(risk: number, frustration: number) {
  if (frustration > 0.6) return "#f59e0b"
  if (risk > 0.7) return "#ef4444"
  if (risk > 0.4) return "#f97316"
  return "#22c55e"
}

type Props = {
  riskScores: Record<string, number>
  frustrationScores: Record<string, number>
  messages: SimEvent[]
  agentNames: string[]
}

export default function AgentGraph({ riskScores, frustrationScores, messages, agentNames }: Props) {
  const allAgents = [...agentNames, "monitor_agent"]

  const nodes: Node[] = allAgents.map(id => {
    const isMonitor = id === "monitor_agent"
    const score = riskScores[id] ?? 0
    const frustration = frustrationScores[id] ?? 0
    const pos = AGENT_POSITIONS[id] ?? { x: 200, y: 200 }
    return {
      id,
      position: pos,
      data: {
        label: (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 600,
              color: isMonitor ? "#1e40af" : "#111" }}>
              {id.replace(/_/g, " ").toUpperCase()}
            </div>
            {!isMonitor && (
              <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>
                risk: {score.toFixed(2)} · frust: {frustration.toFixed(2)}
              </div>
            )}
          </div>
        )
      },
      style: {
        background: isMonitor ? "#dbeafe" : nodeColor(score, frustration),
        border: `2px solid ${isMonitor ? "#3b82f6" : nodeBorder(score, frustration)}`,
        borderRadius: 10,
        padding: "8px 12px",
        minWidth: 130,
        transition: "all 0.5s ease",
      }
    }
  })

  const lastMsg = messages[0]
  const edges: Edge[] = []

  if (lastMsg?.agent) {
    agentNames.filter(n => n !== lastMsg.agent).forEach((target, i) => {
      edges.push({
        id: `e-${lastMsg.agent}-${target}-${i}`,
        source: lastMsg.agent!,
        target,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: lastMsg.flagged ? "#ef4444" : "#94a3b8", strokeWidth: 2 },
      })
    })
    edges.push({
      id: `e-${lastMsg.agent}-monitor`,
      source: lastMsg.agent,
      target: "monitor_agent",
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: {
        stroke: lastMsg.flagged ? "#ef4444" : "#93c5fd",
        strokeWidth: lastMsg.flagged ? 3 : 1.5,
        strokeDasharray: "5,3"
      },
    })
  }

  return (
    <div style={{ height: 440, borderRadius: 12, overflow: "hidden",
      border: "1px solid #e2e8f0" }}>
      <ReactFlow nodes={nodes} edges={edges} fitView
        nodesConnectable={false} nodesDraggable={false}>
        <Background color="#f1f5f9" gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}