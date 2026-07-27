export type EventPlan = 'degustacao' | 'momento' | 'memoria'
export type EventStatus = 'draft' | 'active' | 'expired'

export interface IEvent {
  id: string
  userId: string
  title: string
  eventDate: string
  publicToken: string
  // token do telão: separado do publicToken de propósito, para o link da
  // projeção poder ser trocado sem invalidar o QR já impresso nas mesas
  displayToken: string
  plan: EventPlan
  status: EventStatus
  opensAt: Date | null
  expiresAt: Date | null
  // quando as fotos deste evento foram apagadas pela retenção de 7 dias; null
  // enquanto o álbum ainda existe. É o que torna a varredura idempotente.
  photosPurgedAt: Date | null
  createdAt: Date
  updatedAt: Date
}
