import { api } from './api'

export interface IGuestEvent {
  title: string
  eventDate: string
  location: string
  status: 'draft' | 'active' | 'expired'
}

export function getGuestEvent(token: string) {
  return api.get<IGuestEvent>(`/guest/events/${token}`)
}

const GUEST_NAME_KEY = 'momentos.guest-name'

export function saveGuestName(name: string) {
  localStorage.setItem(GUEST_NAME_KEY, name)
}

export function getGuestName(): string {
  return localStorage.getItem(GUEST_NAME_KEY) ?? ''
}
