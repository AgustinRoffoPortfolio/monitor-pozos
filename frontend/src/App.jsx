import { useState, useEffect } from 'react'

function getRiskLevel(reading) {
  if (!reading) return 'neutral'
  const { pressure, temperature, flow_rate } = reading
  if (pressure < 150 || temperature > 110 || flow_rate < 30) return 'red'
  if (pressure < 200 || temperature > 100 || flow_rate < 60) return 'yellow'
  return 'green'
}

const BORDER_COLOR = {
  red:     '#e63946',
  yellow:  '#f4a261',
  green:   '#2a9d8f',
  neutral: '#444',
}

function WellCard({ well, reading }) {
  const risk = getRiskLevel(reading)

  return (
    <div style={{
      background: '#16213e',
      border: `2px solid ${BORDER_COLOR[risk]}`,
      borderRadius: 10,
      padding: '18px 22px',
      minWidth: 200,
    }}>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Pozo</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#eee', marginBottom: 14 }}>
        {well.name}
      </div>
      {reading ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <tbody>
            <Row label="Presión"     value={`${reading.pressure} bar`}   />
            <Row label="Temperatura" value={`${reading.temperature} °C`} />
            <Row label="Caudal"      value={`${reading.flow_rate} m³/d`} />
          </tbody>
        </table>
      ) : (
        <div style={{ color: '#555', fontSize: 13 }}>Sin datos aún…</div>
      )}
      <div style={{
        marginTop: 14,
        fontSize: 11,
        color: BORDER_COLOR[risk],
        textTransform: 'uppercase',
        fontWeight: 600,
        letterSpacing: 1,
      }}>
        {risk === 'green'  && 'Normal'}
        {risk === 'yellow' && 'Advertencia'}
        {risk === 'red'    && 'Crítico'}
        {risk === 'neutral' && '—'}
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <tr>
      <td style={{ color: '#888', paddingBottom: 4, paddingRight: 12 }}>{label}</td>
      <td style={{ color: '#ddd', fontWeight: 500 }}>{value}</td>
    </tr>
  )
}

export default function App() {
  const [wells, setWells]     = useState([])
  const [readings, setReadings] = useState({}) // { well_id: last_reading }

  // Fetch wells on mount
  useEffect(() => {
    fetch('http://localhost:8000/wells')
      .then(r => r.json())
      .then(setWells)
      .catch(console.error)
  }, [])

  // WebSocket: update latest reading per well
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws')

    ws.onmessage = (event) => {
      const batch = JSON.parse(event.data)
      setReadings(prev => {
        const next = { ...prev }
        for (const r of batch) next[r.well_id] = r
        return next
      })
    }

    ws.onerror = (e) => console.error('WebSocket error', e)

    return () => ws.close()
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a1a2e',
      color: '#eee',
      fontFamily: 'system-ui, sans-serif',
      padding: '32px 40px',
    }}>
      <h1 style={{
        fontSize: 26,
        fontWeight: 700,
        marginBottom: 32,
        borderBottom: '1px solid #2a2a4a',
        paddingBottom: 16,
        color: '#a8dadc',
      }}>
        Monitor de Pozos — Vaca Muerta
      </h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 20,
      }}>
        {wells.map(well => (
          <WellCard
            key={well.id}
            well={well}
            reading={readings[well.id] ?? null}
          />
        ))}
      </div>
    </div>
  )
}
