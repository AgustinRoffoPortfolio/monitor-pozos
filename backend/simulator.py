import random
from datetime import datetime, timezone

WELLS = [
    {"id": 1, "name": "VH-001", "lat": -38.85, "lon": -69.10},
    {"id": 2, "name": "VH-002", "lat": -38.90, "lon": -69.05},
    {"id": 3, "name": "VH-003", "lat": -38.80, "lon": -69.20},
    {"id": 4, "name": "VH-004", "lat": -38.95, "lon": -68.95},
    {"id": 5, "name": "VH-005", "lat": -38.75, "lon": -69.15},
    {"id": 6, "name": "VH-006", "lat": -39.00, "lon": -69.00},
    {"id": 7, "name": "VH-007", "lat": -38.88, "lon": -69.30},
    {"id": 8, "name": "VH-008", "lat": -38.70, "lon": -68.90},
    {"id": 9, "name": "VH-009", "lat": -39.05, "lon": -69.25},
    {"id": 10, "name": "VH-010", "lat": -38.82, "lon": -68.85},
]


def generate_reading(well_id: int, force_anomaly: bool = False) -> dict:
    # Valores normales de operación para pozos de Vaca Muerta
    base_pressure = 250.0  # bar
    base_temperature = 85.0  # °C
    base_flow_rate = 120.0  # m³/día

    if force_anomaly:
        # Simula una falla: presión cae, temperatura sube, caudal se desploma
        pressure = base_pressure * random.uniform(0.4, 0.6)
        temperature = base_temperature * random.uniform(1.3, 1.6)
        flow_rate = base_flow_rate * random.uniform(0.1, 0.3)
    else:
        # Operación normal con ruido gaussiano realista
        pressure = base_pressure + random.gauss(0, 8)
        temperature = base_temperature + random.gauss(0, 3)
        flow_rate = base_flow_rate + random.gauss(0, 10)

    return {
        "well_id": well_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "pressure": round(pressure, 2),
        "temperature": round(temperature, 2),
        "flow_rate": round(max(flow_rate, 0), 2),  # no puede ser negativo
    }


def get_all_wells():
    return WELLS


def simulate_batch(anomaly_well_id: int = None) -> list:
    readings = []
    for well in WELLS:
        force = well["id"] == anomaly_well_id
        readings.append(generate_reading(well["id"], force_anomaly=force))
    return readings


if __name__ == "__main__":
    print("=== Lectura normal ===")
    print(generate_reading(1))
    print("\n=== Lectura con anomalía ===")
    print(generate_reading(1, force_anomaly=True))
