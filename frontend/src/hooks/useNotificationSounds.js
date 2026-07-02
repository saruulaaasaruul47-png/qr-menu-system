import { useCallback, useEffect, useRef, useState } from 'react'
import useSound from 'use-sound'
import ringRing from '../assets/sounds/ring-ring.wav'
import dongDong from '../assets/sounds/dong-dong.wav'
import chime from '../assets/sounds/chime.wav'
import { ROLES } from '../lib/permissions'

const KITCHEN_EVENTS = new Set(['CUSTOMER_ORDER_CREATED', 'CASHIER_ORDER_CREATED'])
const WAITER_EVENTS = new Set(['ORDER_READY', 'WAITER_CALL', 'SERVICE_REQUESTED'])
const CASHIER_EVENTS = new Set(['ORDER_SERVED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED'])

function eventKey(event) {
  const payload = event?.payload || {}
  return [
    event?.type,
    payload.orderId,
    payload.paymentId,
    payload.notificationId,
    payload.tableId,
    event?.createdAt,
  ].filter(Boolean).join(':')
}

export function useNotificationSounds(role) {
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem('notificationSound') !== 'off')
  const recentEvents = useRef(new Set())
  const soundEnabled = audioEnabled && soundOn
  const [playRing] = useSound(ringRing, { volume: 0.72, interrupt: true, soundEnabled })
  const [playDong] = useSound(dongDong, { volume: 0.78, interrupt: true, soundEnabled })
  const [playChime] = useSound(chime, { volume: 0.66, interrupt: true, soundEnabled })

  useEffect(() => {
    const enableAudio = () => setAudioEnabled(true)
    window.addEventListener('pointerdown', enableAudio, { once: true })
    window.addEventListener('keydown', enableAudio, { once: true })

    return () => {
      window.removeEventListener('pointerdown', enableAudio)
      window.removeEventListener('keydown', enableAudio)
    }
  }, [])

  useEffect(() => {
    const syncSoundPreference = () => setSoundOn(localStorage.getItem('notificationSound') !== 'off')
    window.addEventListener('storage', syncSoundPreference)
    window.addEventListener('notification-sound-change', syncSoundPreference)

    return () => {
      window.removeEventListener('storage', syncSoundPreference)
      window.removeEventListener('notification-sound-change', syncSoundPreference)
    }
  }, [])

  return useCallback((event) => {
    if (!event?.type) return

    const key = eventKey(event)
    if (key && recentEvents.current.has(key)) return
    if (key) {
      recentEvents.current.add(key)
      window.setTimeout(() => recentEvents.current.delete(key), 1800)
    }

    if (role === ROLES.KITCHEN && KITCHEN_EVENTS.has(event.type)) {
      playRing()
      return
    }

    if (role === ROLES.WAITER && WAITER_EVENTS.has(event.type)) {
      playDong()
      return
    }

    if (role === ROLES.CASHIER && CASHIER_EVENTS.has(event.type)) {
      playChime()
    }
  }, [playChime, playDong, playRing, role])
}
