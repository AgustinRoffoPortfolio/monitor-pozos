import hashlib
import os
import shutil
import tempfile
from pathlib import Path

import pytest

# database.py elige la base al importarse, así que DATABASE_URL tiene que estar
# definida antes de que cualquier test importe main o database. Es un SQLite en
# un directorio temporal: los tests nunca tocan pozos.db ni un Postgres.
_TMP_DIR = tempfile.mkdtemp(prefix="monitor-pozos-tests-")
os.environ["DATABASE_URL"] = f"sqlite:///{Path(_TMP_DIR, 'test.db').as_posix()}"

MODEL_PATH = Path(__file__).resolve().parent.parent / "ml" / "model.pkl"


@pytest.fixture(scope="session")
def client():
    from fastapi.testclient import TestClient

    import main

    model_hash = hashlib.sha256(MODEL_PATH.read_bytes()).hexdigest()

    # El context manager corre el lifespan: crea las tablas, carga los 10 pozos
    # y arranca el loop del simulador.
    with TestClient(main.app) as c:
        yield c

    # Ningún test llama a /retrain: el modelo versionado tiene que quedar intacto.
    assert hashlib.sha256(MODEL_PATH.read_bytes()).hexdigest() == model_hash


@pytest.fixture
def db():
    from database import SessionLocal

    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def pytest_sessionfinish(session, exitstatus):
    from database import engine

    # En Windows el archivo queda bloqueado mientras el engine tenga conexiones.
    engine.dispose()
    shutil.rmtree(_TMP_DIR, ignore_errors=True)
