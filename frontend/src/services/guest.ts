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

export function requestPhotoUpload(token: string, contentType: string) {
  return api.post<{ uploadUrl: string; storageKey: string }>(
    `/guest/events/${token}/photos/presign`,
    { contentType },
  )
}

export async function uploadToStorage(uploadUrl: string, blob: Blob) {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': blob.type },
    body: blob,
  })
  if (!response.ok) {
    throw new Error(`Falha no upload: ${response.status}`)
  }
}

export function confirmPhotoUpload(token: string, storageKey: string, guestName: string) {
  return api.post<{ id: string }>(`/guest/events/${token}/photos`, {
    storageKey,
    guestName: guestName || undefined,
  })
}

const GUEST_NAME_KEY = 'momentos.guest-name'

export function saveGuestName(name: string) {
  localStorage.setItem(GUEST_NAME_KEY, name)
}

export function getGuestName(): string {
  return localStorage.getItem(GUEST_NAME_KEY) ?? ''
}
