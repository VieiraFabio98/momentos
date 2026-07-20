export interface IPhoto {
  id: string
  eventId: string
  storageKey: string
  guestName: string | null
  approved: boolean
  // prova do aceite de uso de imagem dado pelo convidado (LGPD art. 8º, §1º)
  consentVersion: string
  consentedAt: Date
  createdAt: Date
}
