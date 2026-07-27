// Prazo prometido na Política de Privacidade: as fotos ficam disponíveis por 7
// dias após o encerramento do evento e depois são excluídas, em qualquer plano.
// Mudar este número exige mudar o texto da política junto (PrivacyView.vue).
export const RETENTION_DAYS = 7

// eventos encerrados antes deste instante já passaram do prazo de retenção
export function retentionCutoff(now: Date, days: number = RETENTION_DAYS): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
}

// todas as fotos de um evento vivem sob este prefixo: é o que permite apagar o
// álbum inteiro sem depender das chaves guardadas no banco
export function eventStoragePrefix(eventId: string): string {
  return `events/${eventId}/`
}

export function eventPhotosPrefix(eventId: string): string {
  return `${eventStoragePrefix(eventId)}photos/`
}

export function photoStorageKey(eventId: string, photoId: string, extension: string): string {
  return `${eventPhotosPrefix(eventId)}${photoId}.${extension}`
}
