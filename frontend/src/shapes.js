import PropTypes from 'prop-types'

// Formas de los objetos que manda el backend (modelos de respuesta en backend/main.py).

export const wellShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  lat: PropTypes.number.isRequired,
  lon: PropTypes.number.isRequired,
})

const readingFields = {
  well_id: PropTypes.number.isRequired,
  timestamp: PropTypes.string.isRequired,
  pressure: PropTypes.number.isRequired,
  temperature: PropTypes.number.isRequired,
  flow_rate: PropTypes.number.isRequired,
  risk_score: PropTypes.number,
}

export const readingShape = PropTypes.shape(readingFields)

// Las alertas son lecturas con el nombre del pozo: vienen de /alerts o se arman
// en el cliente a partir del WebSocket.
export const alertShape = PropTypes.shape({
  ...readingFields,
  well_name: PropTypes.string.isRequired,
})
