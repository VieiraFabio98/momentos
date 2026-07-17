export type EventPlan = 'degustacao' | 'momento' | 'memoria'
export type EventStatus = 'draft' | 'active' | 'expired'

export interface IEvent {
  id: string
  userId: string
  title: string
  eventDate: string
  publicToken: string
  plan: EventPlan
  status: EventStatus
  opensAt: Date | null
  expiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}
