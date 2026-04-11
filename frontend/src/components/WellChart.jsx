import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

function toHHMMSS(isoTimestamp) {
  return new Date(isoTimestamp).toLocaleTimeString("es-AR", { hour12: false });
}

export default function WellChart({ wellId, wellName }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/wells/${wellId}/readings`)
      .then((r) => r.json())
      .then((readings) => {
        const sorted = [...readings].reverse().map((r) => ({
          time: toHHMMSS(r.timestamp),
          presión: r.pressure,
          temperatura: r.temperature,
          caudal: r.flow_rate,
        }));
        setData(sorted);
      })
      .catch(console.error);
  }, [wellId]);

  if (data.length === 0) {
    return <div style={{ color: "#555", fontSize: 13 }}>Cargando datos...</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <XAxis dataKey="time" tick={{ fill: "#888", fontSize: 11 }} />
        <YAxis tick={{ fill: "#888", fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            background: "#16213e",
            border: "1px solid #2a2a4a",
            borderRadius: 6,
          }}
          labelStyle={{ color: "#aaa" }}
          itemStyle={{ color: "#ddd" }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "#aaa" }} />
        <Line
          type="monotone"
          dataKey="presión"
          stroke="#a8dadc"
          dot={false}
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="temperatura"
          stroke="#f4a261"
          dot={false}
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="caudal"
          stroke="#2a9d8f"
          dot={false}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
