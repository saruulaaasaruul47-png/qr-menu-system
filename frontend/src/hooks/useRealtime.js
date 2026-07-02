import { useEffect, useRef } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'

function socketUrl() {
  const base = new URL(API_BASE)
  base.pathname = '/'
  base.search = ''
  base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:'
  base.pathname = '/socket.io/'
  base.search = 'EIO=4&transport=websocket'
  return base.toString()
}

function encodeSocketEvent(name, payload) {
  return `42${JSON.stringify([name, payload])}`
}

function decodeSocketEvent(frame) {
  if (!frame.startsWith('42')) return null
  try {
    const [name, payload] = JSON.parse(frame.slice(2))
    return { name, payload }
  } catch {
    return null
  }
}

export function useRealtime({ restaurantId, sessionToken, role, onEvent }) {
  const onEventRef = useRef(onEvent)

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    if (!restaurantId && !sessionToken) return undefined

    let socket
    let closed = false
    let reconnectTimer

    const connect = () => {
      socket = new WebSocket(socketUrl())

      socket.addEventListener('message', (event) => {
        const frame = String(event.data)
        if (frame.startsWith('0')) {
          socket.send('40')
          return
        }
        if (frame === '40') {
          socket.send(encodeSocketEvent('join', { restaurantId, sessionToken, role }))
          return
        }
        if (frame === '2') {
          socket.send('3')
          return
        }
        const decoded = decodeSocketEvent(frame)
        if (decoded?.name === 'realtime:event') onEventRef.current?.(decoded.payload)
      })

      socket.addEventListener('close', () => {
        if (!closed) reconnectTimer = window.setTimeout(connect, 1500)
      })
    }

    connect()

    return () => {
      closed = true
      window.clearTimeout(reconnectTimer)
      socket?.close()
    }
  }, [restaurantId, sessionToken, role])
}
