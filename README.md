# Monitor de Pozos — Vaca Muerta

Sistema de monitoreo en tiempo real con detección de anomalías para pozos petroleros, orientado al sector energético argentino.

https://github.com/user-attachments/assets/ee77dfbf-4225-4a1a-aa7c-70cd4a75d7d5

---

## ¿Qué hace?

- Simula datos de sensores de 10 pozos en Vaca Muerta (presión, temperatura, caudal) actualizándose cada 5 segundos vía WebSocket
- Aplica un modelo de Machine Learning (Isolation Forest) entrenado sobre lecturas normales para detectar anomalías en tiempo real
- Visualiza el estado de cada pozo en un mapa interactivo de Neuquén con alertas por color
- Persiste un historial de eventos críticos en base de datos con paginación

---

## Stack tecnológico

**Backend**
- Python + FastAPI — API REST y WebSocket
- SQLAlchemy — persistencia de datos (SQLite en local, PostgreSQL en producción)
- scikit-learn (Isolation Forest) — detección de anomalías no supervisada
- pandas + numpy — procesamiento de datos

**Frontend**
- React + Vite — interfaz de usuario
- Recharts — gráficos de series de tiempo
- Leaflet.js — mapa interactivo

> El deploy original corrió sobre Render (backend + PostgreSQL) y Vercel (frontend). Hoy está dado de baja: la demo es el video de arriba.

---

## Arquitectura

- ↓ Simulador de sensores → FastAPI → Base de datos
- ↓ Isolation Forest (ML)
- ↓ WebSocket broadcast
- ↓ React Dashboard

---

## Funcionalidades

- **Mapa en tiempo real** — pozos coloreados según nivel de riesgo (verde / amarillo / rojo)
- **Cards por pozo** — presión, temperatura, caudal y barra de riesgo del modelo ML
- **Historial clickeable** — gráfico de serie de tiempo de las últimas 50 lecturas por pozo
- **Panel de alertas** — historial paginado de eventos críticos persistido en DB
- **Endpoint /retrain** — reentrenamiento del modelo sin reiniciar el servidor

---

## Correr localmente

**Requisitos:** Python 3.12+, Node.js 20+

No hace falta levantar una base de datos: la capa de persistencia se resuelve por configuración y, sin la variable `DATABASE_URL`, cae a un archivo SQLite local. El modelo ya viene entrenado en `backend/ml/model.pkl`.

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend (nueva terminal)
cd frontend
npm install
npm run dev
```

Dashboard disponible en `http://localhost:5173`

### Tests

Los tests del backend usan pytest y el `TestClient` de FastAPI contra un SQLite temporal: no tocan `pozos.db` ni una base Postgres, y no reentrenan el modelo.

```bash
cd backend
pip install -r requirements-dev.txt
pytest
```

---

## Contexto

Proyecto desarrollado como parte de un portfolio orientado al sector energético argentino. Los sistemas SCADA industriales se encargan de recolectar datos de sensores; este proyecto agrega una capa de detección de anomalías por encima de esos datos usando ML no supervisado.

## Repos hermanos del portfolio

Los otros dos proyectos están una capa más abajo: se ocupan de cómo el dato
viaja desde el sensor hasta la base. Este se ocupa de qué hacer con el dato
una vez que ya está guardado.

- **[oilfield-scada](https://github.com/AgustinRoffoPortfolio/oilfield-scada)** —
  La cadena industrial completa, construida capa por capa en vez de configurar
  un producto comercial: RTU Modbus TCP → servidor OPC UA cifrado → ingesta →
  TimescaleDB → dashboard propio con motor de alarmas. C# / .NET 10, frontend
  sin una sola dependencia de terceros.
- **[opc-gateway-da-ua](https://github.com/AgustinRoffoPortfolio/opc-gateway-da-ua)** —
  El caso de que esa cadena ya exista y sea de los años 90: un gateway que expone
  un servidor OPC DA legado detrás de un OPC UA moderno, sobre COM interop, sin
  tocar ni migrar el sistema existente.

---

*Agustín Roffo — Ingeniería en Informática, FIUBA*
