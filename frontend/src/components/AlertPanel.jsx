import { useState, useEffect, useRef } from 'react'

function toHHMMSS(isoTimestamp) {
  return new Date(isoTimestamp).toLocaleTimeString('es-AR', { hour12: false })
}

const BTN = (disabled) => ({
  background: 'none',
  border: '1px solid #3a1a1a',
  borderRadius: 4,
  color: disabled ? '#444' : '#aaa',
  cursor: disabled ? 'default' : 'pointer',
  padding: '4px 10px',
  fontSize: 12,
})

export default function AlertPanel({ alerts }) {
  const [page, setPage] = useState(0)
  const prevLenRef = useRef(0)

  useEffect(() => {
    const prevLen = prevLenRef.current
    prevLenRef.current = alerts?.length ?? 0
    if ((alerts?.length ?? 0) > prevLen) {
      setPage(0)
    }
  }, [alerts])

  if (!alerts || alerts.length === 0) return null

  const PAGE_SIZE  = 10
  const totalPages = Math.ceil(alerts.length / PAGE_SIZE)
  const visible    = alerts.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <div style={{
      background: '#2a0a0a',
      border: '1px solid #e63946',
      borderRadius: 10,
      padding: 20,
      marginTop: 32,
      marginBottom: 24,
    }}>
      <div style={{
        fontSize: 13,
        color: '#e63946',
        textTransform: 'uppercase',
        fontWeight: 600,
        marginBottom: 12,
        letterSpacing: 1,
      }}>
        Historial de alertas críticas
      </div>

      {visible.map((r, i) => (
        <div
          key={`${r.well_id}-${r.timestamp}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            padding: '10px 0',
            borderTop: i === 0 ? 'none' : '1px solid #3a1a1a',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ color: '#fff', fontWeight: 600, minWidth: 80 }}>
            {r.well_name}
          </span>
          <span style={{ color: '#aaa', fontSize: 13 }}>
            Presión: <b style={{ color: '#ddd' }}>{r.pressure} bar</b>
          </span>
          <span style={{ color: '#aaa', fontSize: 13 }}>
            Temp: <b style={{ color: '#ddd' }}>{r.temperature} °C</b>
          </span>
          <span style={{ color: '#aaa', fontSize: 13 }}>
            Caudal: <b style={{ color: '#ddd' }}>{r.flow_rate} m³/d</b>
          </span>
          <span style={{ color: '#aaa', fontSize: 13 }}>
            Riesgo: <b style={{ color: '#e63946' }}>{Math.round((r.risk_score ?? 0) * 100)}%</b>
          </span>
          <span style={{ color: '#555', fontSize: 12, marginLeft: 'auto' }}>
            {toHHMMSS(r.timestamp)}
          </span>
        </div>
      ))}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginTop: 14,
        borderTop: '1px solid #3a1a1a',
        paddingTop: 12,
      }}>
        <button
          style={BTN(page === 0)}
          disabled={page === 0}
          onClick={() => setPage(p => p - 1)}
        >
          ← Anterior
        </button>
        <span style={{ fontSize: 12, color: '#666' }}>
          Página {page + 1} de {totalPages}
        </span>
        <button
          style={BTN(page === totalPages - 1)}
          disabled={page === totalPages - 1}
          onClick={() => setPage(p => p + 1)}
        >
          Siguiente →
        </button>
      </div>
    </div>
  )
}
