import { describe, expect, it } from 'vitest'
import { makeEvent } from '../../../../../test/support/builders'
import { deriveEventWindow, EVENT_WINDOW_HOURS, getEventWindowState } from './event-window'

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
