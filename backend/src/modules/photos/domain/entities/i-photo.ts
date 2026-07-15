export interface IPhoto {
  id: string
  eventId: string
  storageKey: string
  guestName: string | null
  approved: boolean
  createdAt: Date
}
