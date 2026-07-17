import { IEvent } from '../entities/i-event'

export type EventWindowState = 'upcoming' | 'open' | 'closed'

export function normalizeEventWindow(
  opensAt: Date | null,
  expiresAt: Date | null,
): { opensAt: Date | null; expiresAt: Date | null } {
  if (opensAt && expiresAt && expiresAt <= opensAt) {
    const rolled = new Date(expiresAt)
    rolled.setDate(rolled.getDate() + 1)
    return { opensAt, expiresAt: rolled }
  }
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
