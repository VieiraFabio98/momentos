import { api } from './api'

export interface IEventResponse {
  id: string
  title: string
  eventDate: string
  publicToken: string
  status: 'draft' | 'active' | 'expired'
  opensAt: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

export function createEvent(data: { title: string; eventDate: string; opensAt: string }) {
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
    opensAt: string | null
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

export function deleteEventPhoto(eventId: string, photoId: string) {
  return api.delete(`/events/${eventId}/photos/${photoId}`)
}

export function getDisplayLink(eventId: string) {
  return api.get<{ displayUrl: string }>(`/events/${eventId}/display-link`)
}

export function rotateDisplayLink(eventId: string) {
  return api.post<{ displayUrl: string }>(`/events/${eventId}/display-link`, {})
}

export interface IDisplayPhoto {
  id: string
  url: string
  guestName: string | null
  createdAt: string
}

export interface IDisplayFeed {
  title: string
  total: number
  // só na carga completa
  guestLink?: string
  qrCode?: string
  // só na consulta incremental: ids que ainda existem, p/ soltar foto apagada
  photoIds?: string[]
  photos: IDisplayPhoto[]
}

export function getDisplayFeed(displayToken: string, since?: string) {
  const query = since ? `?since=${encodeURIComponent(since)}` : ''
  return api.get<IDisplayFeed>(`/display/events/${displayToken}${query}`)
}

export async function downloadEventAlbum(id: string, filename: string) {
  const blob = await api.getBlob(`/events/${id}/photos/archive`)
  triggerDownload(blob, filename)
}

// --- Álbum curado do casal (link público read-only) ---

export interface IAlbumLink {
  released: boolean
  albumUrl: string | null
  releasedAt: string | null
}

export function getAlbumLink(eventId: string) {
  return api.get<IAlbumLink>(`/events/${eventId}/album-link`)
}

export function releaseAlbum(eventId: string) {
  return api.post<IAlbumLink>(`/events/${eventId}/album-link`, {})
}

export function revokeAlbum(eventId: string) {
  return api.delete<IAlbumLink>(`/events/${eventId}/album-link`)
}

export interface IPublicAlbum {
  title: string
  eventDate: string
  releasedAt: string
  total: number
  participants: number
  photos: IEventPhoto[]
}

// rota pública, sem auth: quem tem o albumToken (o casal) vê o álbum curado
export function getPublicAlbum(albumToken: string) {
  return api.get<IPublicAlbum>(`/album/events/${albumToken}`)
}

export async function downloadPublicAlbum(albumToken: string, filename: string) {
  const blob = await api.getBlob(`/album/events/${albumToken}/archive`)
  triggerDownload(blob, filename)
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
