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
  status: EventStatus
  opensAt: Date | null
  expiresAt: Date | null
  // quando as fotos deste evento foram apagadas pela retenção de 7 dias; null
  // enquanto o álbum ainda existe. É o que torna a varredura idempotente.
  photosPurgedAt: Date | null
  // álbum curado entregue ao casal: token do link público read-only e o momento
  // em que a cerimonialista liberou. Ambos null enquanto não liberado — o casal
  // não vê nada até a curadoria terminar. Revogar zera os dois (o link morre).
  albumToken: string | null
  albumReleasedAt: Date | null
  createdAt: Date
  updatedAt: Date
}
