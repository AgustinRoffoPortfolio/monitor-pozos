import pandas as pd
from pathlib import Path

import joblib
import numpy as np

MODEL_PATH = Path(__file__).parent / "model.pkl"

# Rango empírico de score_samples para IsolationForest con estos datos.
# Valores más negativos = más anómalo. Ajustar si cambia el dataset.
_SCORE_MIN = -0.73
_SCORE_MAX = -0.38


def _load():
    if MODEL_PATH.exists():
        return joblib.load(MODEL_PATH)
    return None


model = _load()


def get_risk_score(pressure: float, temperature: float, flow_rate: float) -> float:
    if model is None:
        return 0.0

    x = pd.DataFrame(
        [[pressure, temperature, flow_rate]],
        columns=["pressure", "temperature", "flow_rate"],
    )

    raw = model.score_samples(x)[0]

    # Normaliza: score más negativo → 1 (crítico), menos negativo → 0 (normal)
    score = (raw - _SCORE_MAX) / (_SCORE_MIN - _SCORE_MAX)
    score = float(np.clip(score, 0.0, 1.0))
    return round(score, 2)


def reload_model():
    global model
    model = _load()
