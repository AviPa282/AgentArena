import asyncio
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

clients: list[WebSocket] = []

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

async def broadcast(data: dict):
    for ws in clients[:]:
        try:
            await ws.send_json(data)
        except:
            clients.remove(ws)

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    clients.append(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        clients.remove(ws)

@app.post("/run-scenario/{scenario_name}")
async def run_scenario(scenario_name: str):
    from agents.simulation import run_simulation
    asyncio.create_task(run_simulation(scenario_name, broadcast))
    return {"status": "started", "scenario": scenario_name}

@app.get("/events/{scenario}")
async def events(scenario: str):
    from db.snowflake_client import get_events
    rows = get_events(scenario)
    return {"events": rows}

@app.get("/threat-data")
async def threats():
    from db.snowflake_client import get_threat_data
    return {"threats": get_threat_data(50)}

@app.get("/forensic/{scenario}")
async def forensic(scenario: str):
    from db.snowflake_client import get_forensic
    return {"replay": get_forensic(scenario)}

@app.get("/analytics")
async def analytics():
    from db.snowflake_client import get_analytics
    return {"analytics": get_analytics()}

@app.get("/health")
async def health():
    return {"status": "ok"}