import sys
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import IsolationForest

sys.path.insert(0, str(Path(__file__).parent.parent))
from database import SessionLocal, Reading

MODEL_PATH = Path(__file__).parent / "model.pkl"
FEATURES   = ["pressure", "temperature", "flow_rate"]
MIN_ROWS   = 50


def train():
    db = SessionLocal()
    try:
        rows = db.query(Reading).all()
    finally:
        db.close()

    df = pd.DataFrame([
        {
            "pressure":    r.pressure,
            "temperature": r.temperature,
            "flow_rate":   r.flow_rate,
        }
        for r in rows
    ])

    mask = (
        df["pressure"].between(200, 300) &
        df["temperature"].between(70, 100) &
        (df["flow_rate"] > 60)
    )
    df_filtered = df[mask]
    print(f"Registros tras el filtrado: {len(df_filtered)} (descartados: {len(df) - len(df_filtered)})")

    if len(df_filtered) < MIN_ROWS:
        print(f"[warning] Solo hay {len(df_filtered)} registros tras el filtrado — se necesitan al menos {MIN_ROWS} para entrenar.")
        return

    model = IsolationForest(contamination=0.1, random_state=42)
    model.fit(df_filtered[FEATURES])

    joblib.dump(model, MODEL_PATH)
    print(f"Modelo entrenado con {len(df_filtered)} registros. Guardado en: {MODEL_PATH}")


if __name__ == "__main__":
    train()
