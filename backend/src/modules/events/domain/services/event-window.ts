import { IEvent } from '../entities/i-event'

export type EventWindowState = 'upcoming' | 'open' | 'closed'

export const EVENT_WINDOW_HOURS = 16

export function deriveEventWindow(opensAt: Date | null): {
  opensAt: Date | null
  expiresAt: Date | null
} {
  if (!opensAt) {
    return { opensAt: null, expiresAt: null }
  }
  const expiresAt = new Date(opensAt.getTime() + EVENT_WINDOW_HOURS * 60 * 60 * 1000)
  return { opensAt, expiresAt }
}

export function getEventWindowState(event: IEvent, now: Date = new Date()): EventWindowState {
  if (event.status === 'expired') {
    return 'closed'
  }
  if (event.expiresAt && now >= event.expiresAt) {
    return 'closed'
  }
  if (event.opensAt && now < event.opensAt) {
    return 'upcoming'
  }
  return 'open'
}
