import asyncio
import json
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import Well, Reading, SessionLocal, get_db, init_db
from simulator import get_all_wells, simulate_batch


# ---------------------------------------------------------------------------
# Pydantic response models
# ---------------------------------------------------------------------------

class WellResponse(BaseModel):
    id: int
    name: str
    lat: float
    lon: float

    model_config = {"from_attributes": True}


class ReadingResponse(BaseModel):
    id: int
    well_id: int
    timestamp: str
    pressure: float
    temperature: float
    flow_rate: float

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# WebSocket connection manager
# ---------------------------------------------------------------------------

class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        self.active.remove(ws)

    async def broadcast(self, data: str):
        for ws in list(self.active):
            try:
                await ws.send_text(data)
            except Exception:
                self.disconnect(ws)


manager = ConnectionManager()


# ---------------------------------------------------------------------------
# Background task: simulate + broadcast every 5 seconds
# ---------------------------------------------------------------------------

async def simulator_loop():
    while True:
        await asyncio.sleep(5)
        if not manager.active:
            continue

        db = SessionLocal()
        try:
            readings = simulate_batch()
            db_readings = []
            for r in readings:
                row = Reading(**r)
                db.add(row)
                db_readings.append(row)
            db.commit()
            for row in db_readings:
                db.refresh(row)

            payload = [ReadingResponse.model_validate(row).model_dump() for row in db_readings]
            await manager.broadcast(json.dumps(payload))
        finally:
            db.close()


# ---------------------------------------------------------------------------
# Lifespan: init DB, seed wells, start background loop
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()

    db = SessionLocal()
    try:
        if db.query(Well).count() == 0:
            for w in get_all_wells():
                db.add(Well(**w))
            db.commit()
    finally:
        db.close()

    task = asyncio.create_task(simulator_loop())
    yield
    task.cancel()


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(title="Monitor Pozos", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# REST endpoints
# ---------------------------------------------------------------------------

@app.get("/wells", response_model=list[WellResponse])
def get_wells(db: Session = Depends(get_db)):
    return db.query(Well).all()


@app.get("/wells/{well_id}/readings", response_model=list[ReadingResponse])
def get_readings(well_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Reading)
        .filter(Reading.well_id == well_id)
        .order_by(Reading.id.desc())
        .limit(50)
        .all()
    )


@app.post("/simulate", response_model=list[ReadingResponse])
def simulate(
    anomaly_well_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
):
    readings = simulate_batch(anomaly_well_id=anomaly_well_id)
    db_readings = []
    for r in readings:
        row = Reading(**r)
        db.add(row)
        db_readings.append(row)
    db.commit()
    for row in db_readings:
        db.refresh(row)
    return db_readings


# ---------------------------------------------------------------------------
# WebSocket endpoint
# ---------------------------------------------------------------------------

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            await ws.receive_text()  # keep connection alive, ignore incoming
    except WebSocketDisconnect:
        manager.disconnect(ws)
