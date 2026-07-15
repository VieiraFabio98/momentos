import { api } from './api'
import type { PlanId } from '../stores/event-draft'

export interface IEventResponse {
  id: string
  title: string
  eventDate: string
  location: string
  publicToken: string
  plan: PlanId
  status: 'draft' | 'active' | 'expired'
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

export function createEvent(data: {
  title: string
  eventDate: string
  location: string
  plan: PlanId
}) {
  return api.post<IEventResponse>('/events', data)
}

export function listMyEvents() {
  return api.get<IEventResponse[]>('/events')
}

export function getEvent(id: string) {
  return api.get<IEventResponse>(`/events/${id}`)
}

export function getEventQrCode(id: string) {
  return api.get<{ guestLink: string; qrCode: string }>(`/events/${id}/qrcode`)
}
