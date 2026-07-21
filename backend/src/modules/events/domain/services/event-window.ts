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

const EVENT_TIME_ZONE = 'America/Sao_Paulo'

// 'YYYY-MM-DD' do instante no fuso do evento — comparar em UTC erraria o dia
// para horários noturnos (21h em Brasília já é o dia seguinte em UTC)
export function toEventDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: EVENT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

// os envios sempre começam no dia da festa: o casal escolhe só o horário
export function opensAtMatchesEventDate(opensAt: Date, eventDate: string): boolean {
  return toEventDate(opensAt) === eventDate
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
