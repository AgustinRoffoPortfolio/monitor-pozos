import { useState, useEffect } from "react";
import WellMap from "./components/WellMap";
import WellChart from "./components/WellChart";
import AlertPanel from "./components/AlertPanel";

function getRiskLevel(reading) {
  if (!reading) return "neutral";
  const { pressure, temperature, flow_rate, risk_score = 0 } = reading;
  if (
    risk_score >= 0.9 ||
    pressure < 150 ||
    temperature > 110 ||
    flow_rate < 30
  )
    return "red";
  if (
    risk_score >= 0.7 ||
    pressure < 200 ||
    temperature > 100 ||
    flow_rate < 60
  )
    return "yellow";
  return "green";
}

const BORDER_COLOR = {
  red: "#e63946",
  yellow: "#f4a261",
  green: "#2a9d8f",
  neutral: "#444",
};

function WellCard({ well, reading, onSelect, isSelected }) {
  const risk = getRiskLevel(reading);

  return (
    <div
      onClick={onSelect}
      style={{
        background: "#16213e",
        border: `2px solid ${BORDER_COLOR[risk]}`,
        outline: isSelected ? "2px solid #a8dadc" : "none",
        outlineOffset: 2,
        borderRadius: 10,
        padding: "18px 22px",
        minWidth: 200,
        cursor: "pointer",
      }}
    >
      <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>Pozo</div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: "#eee",
          marginBottom: 14,
        }}
      >
        {well.name}
      </div>
      {reading ? (
        <>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
          >
            <tbody>
              <Row label="Presión" value={`${reading.pressure} bar`} />
              <Row label="Temperatura" value={`${reading.temperature} °C`} />
              <Row label="Caudal" value={`${reading.flow_rate} m³/d`} />
            </tbody>
          </table>
          <div
            style={{
              marginTop: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                flex: 1,
                background: "#2a2a4a",
                borderRadius: 4,
                height: 8,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.round((reading.risk_score ?? 0) * 100)}%`,
                  height: "100%",
                  background: BORDER_COLOR[risk],
                  borderRadius: 4,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 12,
                color: "#aaa",
                minWidth: 36,
                textAlign: "right",
              }}
            >
              {Math.round((reading.risk_score ?? 0) * 100)}%
            </span>
          </div>
        </>
      ) : (
        <div style={{ color: "#555", fontSize: 13 }}>Sin datos aún…</div>
      )}
      <div
        style={{
          marginTop: 14,
          fontSize: 11,
          color: BORDER_COLOR[risk],
          textTransform: "uppercase",
          fontWeight: 600,
          letterSpacing: 1,
        }}
      >
        {risk === "green" && "Normal"}
        {risk === "yellow" && "Advertencia"}
        {risk === "red" && "Crítico"}
        {risk === "neutral" && "—"}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <tr>
      <td style={{ color: "#888", paddingBottom: 4, paddingRight: 12 }}>
        {label}
      </td>
      <td style={{ color: "#ddd", fontWeight: 500 }}>{value}</td>
    </tr>
  );
}

export default function App() {
  const [wells, setWells] = useState([]);
  const [readings, setReadings] = useState({}); // { well_id: last_reading }
  const [selectedWell, setSelectedWell] = useState(null);
  const [alertHistory, setAlertHistory] = useState([]);

  // Fetch wells and initial alert history on mount
  useEffect(() => {
    fetch("http://localhost:8000/wells")
      .then((r) => r.json())
      .then(setWells)
      .catch(console.error);

    fetch("http://localhost:8000/alerts")
      .then((r) => r.json())
      .then(setAlertHistory)
      .catch(console.error);
  }, []);

  // WebSocket: update latest reading per well
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");

    ws.onmessage = (event) => {
      const batch = JSON.parse(event.data);
      setReadings((prev) => {
        const next = { ...prev };
        for (const r of batch) next[r.well_id] = r;
        return next;
      });
      setWells((currentWells) => {
        const newAlerts = batch
          .filter(
            (r) =>
              (r.risk_score ?? 0) >= 0.9 ||
              r.pressure < 150 ||
              r.temperature > 110 ||
              r.flow_rate < 30,
          )
          .map((r) => {
            const well = currentWells.find((w) => w.id === r.well_id);
            return { ...r, well_name: well?.name ?? `Pozo ${r.well_id}` };
          });
        setAlertHistory((prev) => {
          const existingKeys = new Set(
            prev.map((a) => `${a.well_id}-${a.timestamp}`),
          );
          const filtered = newAlerts.filter(
            (a) => !existingKeys.has(`${a.well_id}-${a.timestamp}`),
          );
          if (filtered.length === 0) return prev;
          return [...filtered, ...prev].slice(0, 50);
        });
        return currentWells;
      });
    };

    ws.onerror = (e) => console.error("WebSocket error", e);

    return () => ws.close();
  }, []);

  return (
    <div
      style={{
        width: "100%",
        boxSizing: "border-box",
        minHeight: "100vh",
        background: "#1a1a2e",
        color: "#eee",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "32px 40px",
          boxSizing: "border-box",
        }}
      >
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            marginBottom: 32,
            borderBottom: "1px solid #2a2a4a",
            paddingBottom: 16,
            color: "#a8dadc",
          }}
        >
          Monitor de Pozos — Vaca Muerta
        </h1>

        <div style={{ marginBottom: 32 }}>
          <WellMap wells={wells} readings={readings} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 20,
          }}
        >
          {wells.map((well) => (
            <WellCard
              key={well.id}
              well={well}
              reading={readings[well.id] ?? null}
              isSelected={selectedWell?.id === well.id}
              onSelect={() =>
                setSelectedWell((prev) => (prev?.id === well.id ? null : well))
              }
            />
          ))}
        </div>

        <AlertPanel alerts={alertHistory} />

        {selectedWell && (
          <div
            style={{
              marginTop: 32,
              background: "#16213e",
              borderRadius: 10,
              padding: 24,
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#a8dadc",
                marginBottom: 20,
              }}
            >
              Historial — {selectedWell.name}
            </h2>
            <WellChart wellId={selectedWell.id} wellName={selectedWell.name} />
          </div>
        )}
      </div>
    </div>
  );
}
