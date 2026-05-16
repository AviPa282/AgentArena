import asyncio
from agents.base_agent import Agent
from agents.monitor_agent import MonitorAgent
from db.snowflake_client import log_event, get_threat_data

SCENARIOS = {
    "rogue_deployment": "agents.scenarios.rogue_deployment",
    "financial": "agents.scenarios.financial",
    "emergency": "agents.scenarios.emergency",
}

async def run_simulation(scenario_name: str, broadcast):
    print(f"🚀 Starting simulation: {scenario_name}")  # add this
    if scenario_name not in SCENARIOS:
        await broadcast({"type": "error", "message": f"Unknown scenario: {scenario_name}"})
        return

    module = __import__(SCENARIOS[scenario_name], fromlist=["CONFIG"])
    cfg = module.CONFIG

    threat_rows = get_threat_data(50)
    env_state = {"threats": threat_rows, "turn": 0}

    agents = [Agent(**a) for a in cfg["agents"]]
    monitor = MonitorAgent(**cfg["monitor"])
    inbox = {a.name: [] for a in agents}

    await broadcast({
        "type": "simulation_start",
        "scenario": scenario_name,
        "agents": [a.name for a in agents],
    })
    print(f"✅ Agents created: {[a.name for a in agents]}")  # add this
    for turn in range(cfg.get("max_turns", 12)):
        env_state["turn"] = turn

        for agent in agents:
            print(f"  Turn {turn} - {agent.name} acting...")
            try:
                msg = await agent.act(env_state, inbox[agent.name])
                print(f"    Message: {msg[:80]}")  # add this
            except Exception as e:
                await broadcast({"type": "error", "message": str(e)})
                continue

            for other in agents:
                if other.name != agent.name:
                    inbox[other.name] = inbox[other.name][-5:] + [
                        f"{agent.name}: {msg}"
                    ]

            try:
                result = await monitor.inspect(agent.name, msg, agents)
            except Exception as e:
                result = {"risk_score": 0.0, "flagged": False, "trust": 1.0}

            risk = result["risk_score"]
            flagged = result["flagged"]

            try:
                log_event(scenario_name, agent.name, "message",
                          msg, risk, flagged, turn)
            except Exception as e:
                print(f"❌ Snowflake log failed: {e}")

            await broadcast({
                "type": "agent_message",
                "turn": turn,
                "agent": agent.name,
                "message": msg,
                "risk_score": risk,
                "flagged": flagged,
                "trust": result["trust"],
                "scenario": scenario_name,
            })

            if flagged:
                try:
                    alert = await monitor.respond(agent.name, msg)
                    await broadcast({
                        "type": "monitor_alert",
                        "agent": agent.name,
                        "alert": alert,
                        "turn": turn,
                    })
                    log_event(scenario_name, monitor.name,
                              "alert", alert, 1.0, True, turn)
                except Exception as e:
                    print(f"Monitor response failed: {e}")

            await asyncio.sleep(2)

    await broadcast({
        "type": "simulation_end",
        "scenario": scenario_name,
        "trust_scores": monitor.trust_scores,
    })