import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const CENTER = [-38.85, -69.10]
const ZOOM   = 10

function getColor(reading) {
  if (!reading) return '#888'
  const { pressure, temperature, flow_rate } = reading
  if (pressure < 150 || temperature > 110 || flow_rate < 30) return '#e63946'
  if (pressure < 200 || temperature > 100 || flow_rate < 60) return '#f4a261'
  return '#2a9d8f'
}

export default function WellMap({ wells, readings }) {
  return (
    <MapContainer
      center={CENTER}
      zoom={ZOOM}
      style={{ height: 400, width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {wells.map(well => {
        const color = getColor(readings[well.id] ?? null)
        return (
          <CircleMarker
            key={well.id}
            center={[well.lat, well.lon]}
            radius={10}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.85 }}
          >
            <Tooltip permanent>{well.name}</Tooltip>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
