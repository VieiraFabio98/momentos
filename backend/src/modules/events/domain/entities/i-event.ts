export type EventPlan = 'degustacao' | 'momento' | 'memoria'
export type EventStatus = 'draft' | 'active' | 'expired'

export interface IEvent {
  id: string
  userId: string
  title: string
  eventDate: string
  location: string
  publicToken: string
  plan: EventPlan
  status: EventStatus
  expiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}
