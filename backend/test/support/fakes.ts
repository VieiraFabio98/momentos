import { Readable } from 'node:stream'
import { IEvent } from '../../src/modules/events/domain/entities/i-event'
import { IQrCodeProvider } from '../../src/modules/events/domain/providers/i-qrcode-provider'
import { IEventRepository } from '../../src/modules/events/domain/repositories/i-event-repository'
import {
  ICreateEventData,
  IUpdateEventData,
} from '../../src/modules/events/domain/repositories/i-event-write-repository'
import { IMailMessage, IMailProvider } from '../../src/modules/mail/domain/i-mail-provider'
import { IPhoto } from '../../src/modules/photos/domain/entities/i-photo'
import {
  IObjectMetadata,
  IStorageProvider,
} from '../../src/modules/photos/domain/providers/i-storage-provider'
import { IPhotoRepository } from '../../src/modules/photos/domain/repositories/i-photo-repository'
import { ICreatePhotoData } from '../../src/modules/photos/domain/repositories/i-photo-write-repository'
import { IOAuthProvider, IOAuthUserInfo } from '../../src/modules/auth/domain/providers/i-oauth-provider'
import { ITokenPayload, ITokenProvider } from '../../src/modules/auth/domain/providers/i-token-provider'
import { IPasswordResetToken } from '../../src/modules/auth/domain/entities/i-password-reset-token'
import {
  ICreatePasswordResetTokenData,
  IPasswordResetTokenRepository,
} from '../../src/modules/auth/domain/repositories/i-password-reset-token-repository'
import { IUser } from '../../src/modules/users/domain/entities/i-user'
import { IHashProvider } from '../../src/modules/users/domain/providers/i-hash-provider'
import { IUserRepository } from '../../src/modules/users/domain/repositories/i-user-repository'
import {
  ICreateUserData,
  IUpdateUserData,
} from '../../src/modules/users/domain/repositories/i-user-write-repository'
import { makeEvent, makePhoto, makeUser } from './builders'

export class FakeEventRepository implements IEventRepository {
  constructor(public events: IEvent[] = []) {}

  async findAllByUserId(userId: string): Promise<IEvent[]> {
    return this.events.filter((event) => event.userId === userId)
  }

  async findById(id: string): Promise<IEvent | null> {
    return this.events.find((event) => event.id === id) ?? null
  }

  async findByPublicToken(publicToken: string): Promise<IEvent | null> {
    return this.events.find((event) => event.publicToken === publicToken) ?? null
  }

  async create(data: ICreateEventData): Promise<IEvent> {
    const event = makeEvent({ ...data, id: `event-${this.events.length + 1}` })
    this.events.push(event)
    return event
  }

  async update(id: string, data: IUpdateEventData): Promise<IEvent> {
    const index = this.events.findIndex((event) => event.id === id)
    const updated = { ...this.events[index], ...stripUndefined(data) }
    this.events[index] = updated
    return updated
  }

  async delete(id: string): Promise<void> {
    this.events = this.events.filter((event) => event.id !== id)
  }
}

export class FakePhotoRepository implements IPhotoRepository {
  constructor(public photos: IPhoto[] = []) {}

  async findAllByEventId(eventId: string): Promise<IPhoto[]> {
    return this.photos.filter((photo) => photo.eventId === eventId)
  }

  async countByEventId(eventId: string): Promise<number> {
    return (await this.findAllByEventId(eventId)).length
  }

  async create(data: ICreatePhotoData): Promise<IPhoto> {
    const photo = makePhoto({ ...data, id: `photo-${this.photos.length + 1}` })
    this.photos.push(photo)
    return photo
  }

  async delete(id: string): Promise<void> {
    this.photos = this.photos.filter((photo) => photo.id !== id)
  }
}

export class FakeUserRepository implements IUserRepository {
  constructor(public users: IUser[] = []) {}

  async findAll(): Promise<IUser[]> {
    return this.users
  }

  async findById(id: string): Promise<IUser | null> {
    return this.users.find((user) => user.id === id) ?? null
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.users.find((user) => user.email === email) ?? null
  }

  async create(data: ICreateUserData): Promise<IUser> {
    const user = makeUser({ ...data, id: `user-${this.users.length + 1}` })
    this.users.push(user)
    return user
  }

  async update(id: string, data: IUpdateUserData): Promise<IUser> {
    const index = this.users.findIndex((user) => user.id === id)
    const updated = { ...this.users[index], ...stripUndefined(data) }
    this.users[index] = updated
    return updated
  }

  async delete(id: string): Promise<void> {
    this.users = this.users.filter((user) => user.id !== id)
  }
}

export class FakePasswordResetTokenRepository implements IPasswordResetTokenRepository {
  constructor(public tokens: IPasswordResetToken[] = []) {}

  async create(data: ICreatePasswordResetTokenData): Promise<IPasswordResetToken> {
    const token: IPasswordResetToken = {
      id: `reset-${this.tokens.length + 1}`,
      usedAt: null,
      createdAt: new Date(),
      ...data,
    }
    this.tokens.push(token)
    return token
  }

  // espelha o repositório real: só devolve token não usado e dentro da validade
  async findValidByTokenHash(tokenHash: string): Promise<IPasswordResetToken | null> {
    return (
      this.tokens.find(
        (token) =>
          token.tokenHash === tokenHash && !token.usedAt && token.expiresAt > new Date(),
      ) ?? null
    )
  }

  async markUsed(id: string): Promise<void> {
    const token = this.tokens.find((item) => item.id === id)
    if (token) {
      token.usedAt = new Date()
    }
  }
}

export class FakeStorageProvider implements IStorageProvider {
  public deleted: string[] = []
  public metadata = new Map<string, IObjectMetadata>()

  async getUploadUrl(key: string, contentType: string, size: number): Promise<string> {
    return `https://storage.test/${key}?type=${encodeURIComponent(contentType)}&size=${size}`
  }

  async getDownloadUrl(key: string): Promise<string> {
    return `https://storage.test/${key}`
  }

  async getAttachmentUrl(key: string, filename: string): Promise<string> {
    return `https://storage.test/${key}?filename=${filename}`
  }

  async getObjectStream(key: string): Promise<Readable> {
    return Readable.from([Buffer.from(key)])
  }

  async getObjectMetadata(key: string): Promise<IObjectMetadata | null> {
    return this.metadata.get(key) ?? null
  }

  async deleteObjects(keys: string[]): Promise<void> {
    this.deleted.push(...keys)
  }
}

export class FakeMailProvider implements IMailProvider {
  public sent: IMailMessage[] = []

  async send(message: IMailMessage): Promise<void> {
    this.sent.push(message)
  }
}

export class FakeHashProvider implements IHashProvider {
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return `hashed:${plain}` === hashed
  }
}

export class FakeTokenProvider implements ITokenProvider {
  async sign(payload: ITokenPayload): Promise<string> {
    return `token:${payload.sub}`
  }

  async verify(token: string): Promise<ITokenPayload | null> {
    if (!token.startsWith('token:')) return null
    return { sub: token.slice('token:'.length), email: 'ana@example.com' }
  }
}

export class FakeOAuthProvider implements IOAuthProvider {
  constructor(private readonly user: IOAuthUserInfo | null) {}

  async verifyIdToken(): Promise<IOAuthUserInfo | null> {
    return this.user
  }
}

export class FakeQrCodeProvider implements IQrCodeProvider {
  async toDataUrl(content: string): Promise<string> {
    return `data:image/png;base64,${Buffer.from(content).toString('base64')}`
  }
}

function stripUndefined<T extends object>(data: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  ) as Partial<T>
}
