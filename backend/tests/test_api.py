import pytest

from database import Alert
from simulator import get_all_wells

FRONTEND_ORIGIN = "http://localhost:5173"
OTHER_ORIGIN = "https://evil.example"
WELL_IDS = [w["id"] for w in get_all_wells()]


# ---------------------------------------------------------------------------
# /wells
# ---------------------------------------------------------------------------


def test_wells_devuelve_los_pozos_cargados_al_arrancar(client):
    r = client.get("/wells")

    assert r.status_code == 200
    wells = r.json()
    assert [w["name"] for w in wells] == [w["name"] for w in get_all_wells()]
    assert set(wells[0]) == {"id", "name", "lat", "lon"}


# ---------------------------------------------------------------------------
# /simulate
# ---------------------------------------------------------------------------


def test_simulate_crea_una_lectura_por_pozo(client):
    r = client.post("/simulate")

    assert r.status_code == 200
    readings = r.json()
    assert sorted(x["well_id"] for x in readings) == WELL_IDS
    for x in readings:
        assert {"id", "timestamp", "pressure", "temperature", "flow_rate"} <= set(x)
        assert x["flow_rate"] >= 0


def test_simulate_con_anomalia_degrada_solo_ese_pozo(client):
    r = client.post("/simulate", params={"anomaly_well_id": 3})

    assert r.status_code == 200
    by_well = {x["well_id"]: x for x in r.json()}
    # Falla simulada: presión al 40-60 % de 250 bar, caudal al 10-30 % de 120 m³/d.
    assert by_well[3]["pressure"] <= 150
    assert by_well[3]["flow_rate"] <= 36
    assert all(x["pressure"] > 150 for well_id, x in by_well.items() if well_id != 3)


# ---------------------------------------------------------------------------
# /wells/{id}/readings
# ---------------------------------------------------------------------------


def test_readings_devuelve_las_del_pozo_mas_nuevas_primero(client):
    created = next(x for x in client.post("/simulate").json() if x["well_id"] == 2)

    r = client.get("/wells/2/readings")

    assert r.status_code == 200
    readings = r.json()
    assert created["id"] in [x["id"] for x in readings]
    assert all(x["well_id"] == 2 for x in readings)
    ids = [x["id"] for x in readings]
    assert ids == sorted(ids, reverse=True)


def test_readings_trae_como_maximo_50(client):
    for _ in range(51):
        client.post("/simulate")

    r = client.get("/wells/1/readings")

    assert r.status_code == 200
    assert len(r.json()) == 50


def test_readings_de_un_pozo_inexistente_es_lista_vacia(client):
    r = client.get("/wells/999/readings")

    assert r.status_code == 200
    assert r.json() == []


# ---------------------------------------------------------------------------
# /alerts
# ---------------------------------------------------------------------------


def _alert(i):
    return Alert(
        well_id=1,
        well_name="VH-001",
        timestamp=f"2026-10-23T00:00:{i % 60:02d}+00:00",
        pressure=120.0,
        temperature=120.0,
        flow_rate=20.0,
        risk_score=0.95,
    )


def test_alerts_devuelve_las_mas_recientes_primero(client, db):
    db.add_all([_alert(0), _alert(1)])
    db.commit()

    r = client.get("/alerts")

    assert r.status_code == 200
    alerts = r.json()
    ids = [a["id"] for a in alerts]
    assert ids == sorted(ids, reverse=True)
    assert alerts[0]["well_name"] == "VH-001"
    assert alerts[0]["risk_score"] == 0.95


def test_alerts_trae_como_maximo_100(client, db):
    db.add_all([_alert(i) for i in range(105)])
    db.commit()

    r = client.get("/alerts")

    assert r.status_code == 200
    assert len(r.json()) == 100


# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------


def _preflight(client, origin):
    return client.options(
        "/wells",
        headers={"Origin": origin, "Access-Control-Request-Method": "GET"},
    )


def test_cors_acepta_el_origen_del_frontend(client):
    r = _preflight(client, FRONTEND_ORIGIN)

    assert r.status_code == 200
    assert r.headers["access-control-allow-origin"] == FRONTEND_ORIGIN
    assert r.headers["access-control-allow-credentials"] == "true"


def test_cors_rechaza_otros_origenes(client):
    preflight = _preflight(client, OTHER_ORIGIN)
    simple = client.get("/wells", headers={"Origin": OTHER_ORIGIN})

    assert preflight.status_code == 400
    assert "access-control-allow-origin" not in preflight.headers
    assert "access-control-allow-origin" not in simple.headers


# ---------------------------------------------------------------------------
# WebSocket
# ---------------------------------------------------------------------------


@pytest.mark.timeout(30)
def test_websocket_recibe_lecturas_del_simulador(client):
    # El loop del simulador emite cada 5 s, y solo si hay clientes conectados.
    with client.websocket_connect("/ws") as ws:
        batch = ws.receive_json()

    assert sorted(x["well_id"] for x in batch) == WELL_IDS
    assert all(0.0 <= x["risk_score"] <= 1.0 for x in batch)
