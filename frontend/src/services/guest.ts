import { api } from './api'

export interface IGuestEvent {
  title: string
  eventDate: string
  status: 'draft' | 'active' | 'expired'
  windowState: 'upcoming' | 'open' | 'closed'
  opensAt: string | null
}

export function getGuestEvent(token: string) {
  return api.get<IGuestEvent>(`/guest/events/${token}`)
}

// espelha as regras do backend (request-photo-upload.dto.ts)
export const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MIN_PHOTO_SIZE_BYTES = 1024
export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024

export function validatePhotoFile(file: Blob): string | null {
  if (!ALLOWED_CONTENT_TYPES.includes(file.type)) {
    return 'Formato não suportado. Envie uma imagem JPG, PNG ou WEBP.'
  }
  if (file.size < MIN_PHOTO_SIZE_BYTES) {
    return 'Imagem muito pequena ou corrompida.'
  }
  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return 'Imagem muito grande. O limite é 5 MB.'
  }
  return null
}

export function requestPhotoUpload(token: string, contentType: string, size: number) {
  return api.post<{ uploadUrl: string; storageKey: string }>(
    `/guest/events/${token}/photos/presign`,
    { contentType, size },
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

// precisa bater com CURRENT_CONSENT_VERSION no backend
export const CONSENT_VERSION = '1'

export function confirmPhotoUpload(token: string, storageKey: string, guestName: string) {
  return api.post<{ id: string }>(`/guest/events/${token}/photos`, {
    storageKey,
    guestName: guestName || undefined,
    consentVersion: CONSENT_VERSION,
  })
}

const GUEST_NAME_KEY = 'momentos.guest-name'
const CONSENT_KEY = 'momentos.consent'

export function saveGuestName(name: string) {
  localStorage.setItem(GUEST_NAME_KEY, name)
}

export function getGuestName(): string {
  return localStorage.getItem(GUEST_NAME_KEY) ?? ''
}

// o aceite fica no navegador só para não repetir a pergunta a cada foto;
// a prova que vale é a gravada no banco junto de cada envio
export function saveConsent() {
  localStorage.setItem(CONSENT_KEY, CONSENT_VERSION)
}

export function hasConsented(): boolean {
  return localStorage.getItem(CONSENT_KEY) === CONSENT_VERSION
}
