import { api } from './api'
import type { PlanId } from '../stores/event-draft'

export interface IEventResponse {
  id: string
  title: string
  eventDate: string
  publicToken: string
  plan: PlanId
  status: 'draft' | 'active' | 'expired'
  opensAt: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

export function createEvent(data: {
  title: string
  eventDate: string
  plan: PlanId
  opensAt?: string
  expiresAt?: string
}) {
  return api.post<IEventResponse>('/events', data)
}

export function listMyEvents() {
  return api.get<IEventResponse[]>('/events')
}

export function getEvent(id: string) {
  return api.get<IEventResponse>(`/events/${id}`)
}

export function updateEvent(
  id: string,
  data: Partial<{
    title: string
    eventDate: string
    plan: PlanId
    opensAt: string | null
    expiresAt: string | null
  }>,
) {
  return api.patch<IEventResponse>(`/events/${id}`, data)
}

export function deleteEvent(id: string) {
  return api.delete(`/events/${id}`)
}

export function getEventQrCode(id: string) {
  return api.get<{ guestLink: string; qrCode: string }>(`/events/${id}/qrcode`)
}

export interface IEventPhoto {
  id: string
  url: string
  downloadUrl: string
  guestName: string | null
  createdAt: string
}

export interface IEventAlbum {
  total: number
  participants: number
  photos: IEventPhoto[]
}

export function listEventPhotos(id: string) {
  return api.get<IEventAlbum>(`/events/${id}/photos`)
}

export async function downloadEventAlbum(id: string, filename: string) {
  const blob = await api.getBlob(`/events/${id}/photos/archive`)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
