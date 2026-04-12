# Monitor de Pozos — Vaca Muerta

Sistema de monitoreo en tiempo real con detección predictiva de anomalías para pozos petroleros, orientado al sector energético argentino.

**[Ver demo en vivo](https://monitor-pozos.vercel.app)**

---

## ¿Qué hace?

- Simula datos de sensores de 10 pozos en Vaca Muerta (presión, temperatura, caudal) actualizándose cada 5 segundos via WebSocket
- Aplica un modelo de Machine Learning (Isolation Forest) entrenado sobre lecturas normales para detectar anomalías en tiempo real
- Visualiza el estado de cada pozo en un mapa interactivo de Neuquén con alertas por color
- Persiste un historial de eventos críticos en base de datos con paginación

---

## Stack tecnológico

**Backend**
- Python + FastAPI — API REST y WebSocket
- SQLAlchemy + PostgreSQL — persistencia de datos
- scikit-learn (Isolation Forest) — detección de anomalías no supervisada
- pandas + numpy — procesamiento de datos

**Frontend**
- React + Vite — interfaz de usuario
- Recharts — gráficos de series de tiempo
- Leaflet.js — mapa interactivo

**Deploy**
- Render — backend + base de datos PostgreSQL
- Vercel — frontend

---

## Arquitectura

- ↓ Simulador de sensores → FastAPI → PostgreSQL
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

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend (nueva terminal)
cd frontend
npm install
npm run dev
```

Dashboard disponible en `http://localhost:5173`

---

## Contexto

Proyecto desarrollado como parte de un portfolio orientado al sector energético argentino (YPF, Shell, Pampa Energía). Los sistemas SCADA industriales se encargan de recolectar datos de sensores; este proyecto agrega una capa de detección predictiva por encima de esos datos usando ML no supervisado.

---

*Agustín Roffo — Ingeniería en Sistemas, UBA*