import { describe, expect, it } from 'vitest'
import { makeEvent } from '../../../../../test/support/builders'
import {
  deriveEventWindow,
  EVENT_WINDOW_HOURS,
  getEventWindowState,
  opensAtMatchesEventDate,
} from './event-window'

describe('deriveEventWindow', () => {
  it('deriva expiresAt somando a janela de 16 horas', () => {
    const opensAt = new Date('2026-06-20T18:00:00.000Z')

    const window = deriveEventWindow(opensAt)

    expect(window.opensAt).toBe(opensAt)
    expect(window.expiresAt?.toISOString()).toBe('2026-06-21T10:00:00.000Z')
    expect(EVENT_WINDOW_HOURS).toBe(16)
  })

  it('mantém ambos nulos quando não há abertura definida', () => {
    expect(deriveEventWindow(null)).toEqual({ opensAt: null, expiresAt: null })
  })
})

describe('opensAtMatchesEventDate', () => {
  it('aceita horário que cai no dia da festa', () => {
    // 20/06 às 18h em Brasília (UTC-3)
    expect(opensAtMatchesEventDate(new Date('2026-06-20T21:00:00.000Z'), '2026-06-20')).toBe(true)
  })

  it('aceita horário noturno que já virou outro dia em UTC', () => {
    // 20/06 às 22h em Brasília = 21/06 01h UTC — ainda é o dia da festa aqui
    expect(opensAtMatchesEventDate(new Date('2026-06-21T01:00:00.000Z'), '2026-06-20')).toBe(true)
  })

  it('recusa horário de outro dia', () => {
    expect(opensAtMatchesEventDate(new Date('2026-06-21T15:00:00.000Z'), '2026-06-20')).toBe(false)
  })

  it('recusa a madrugada seguinte, que já é o dia posterior em Brasília', () => {
    // 21/06 às 02h em Brasília
    expect(opensAtMatchesEventDate(new Date('2026-06-21T05:00:00.000Z'), '2026-06-20')).toBe(false)
  })
})

describe('getEventWindowState', () => {
  const opensAt = new Date('2026-06-20T18:00:00.000Z')
  const expiresAt = new Date('2026-06-21T10:00:00.000Z')

  it('é upcoming antes da abertura', () => {
    const event = makeEvent({ opensAt, expiresAt })

    expect(getEventWindowState(event, new Date('2026-06-20T17:59:00.000Z'))).toBe('upcoming')
  })

  it('é open no instante exato da abertura', () => {
    const event = makeEvent({ opensAt, expiresAt })

    expect(getEventWindowState(event, opensAt)).toBe('open')
  })

  it('é closed no instante exato da expiração', () => {
    const event = makeEvent({ opensAt, expiresAt })

    expect(getEventWindowState(event, expiresAt)).toBe('closed')
  })

  it('é closed quando o status é expired, mesmo dentro da janela', () => {
    const event = makeEvent({ opensAt, expiresAt, status: 'expired' })

    expect(getEventWindowState(event, new Date('2026-06-20T20:00:00.000Z'))).toBe('closed')
  })

  it('é open quando o evento não tem janela definida', () => {
    expect(getEventWindowState(makeEvent())).toBe('open')
  })
})
