import { ISubscription } from '../../src/modules/billing/domain/entities/i-subscription'
import { IEvent } from '../../src/modules/events/domain/entities/i-event'
import { IPhoto } from '../../src/modules/photos/domain/entities/i-photo'
import { IUser } from '../../src/modules/users/domain/entities/i-user'

const NOW = new Date('2026-06-01T12:00:00.000Z')

export function makeUser(overrides: Partial<IUser> = {}): IUser {
  return {
    id: 'user-1',
    name: 'Ana',
    email: 'ana@example.com',
    passwordHash: 'hashed-password',
    subscriptionPlan: null,
    subscriptionStatus: null,
    role: 'user',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

export function makeEvent(overrides: Partial<IEvent> = {}): IEvent {
  return {
    id: 'event-1',
    userId: 'user-1',
    title: 'Ana & João',
    eventDate: '2026-06-20',
    publicToken: 'public-token-1',
    displayToken: 'display-token-1',
    status: 'active',
    opensAt: null,
    expiresAt: null,
    photosPurgedAt: null,
    albumToken: null,
    albumReleasedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

export function makePhoto(overrides: Partial<IPhoto> = {}): IPhoto {
  return {
    id: 'photo-1',
    eventId: 'event-1',
    storageKey: 'events/event-1/photos/abc.jpg',
    guestName: 'Convidado',
    approved: true,
    consentVersion: '1',
    consentedAt: NOW,
    createdAt: NOW,
    ...overrides,
  }
}

export function makeSubscription(overrides: Partial<ISubscription> = {}): ISubscription {
  return {
    id: 'sub-1',
    userId: 'user-1',
    plan: 'mensal',
    status: 'pending',
    providerSubscriptionId: 'mp-preapproval-1',
    currentPeriodEnd: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}
