import { Readable } from 'node:stream'

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER')

export interface IStorageProvider {
  getUploadUrl(key: string, contentType: string): Promise<string>
  getDownloadUrl(key: string): Promise<string>
  getAttachmentUrl(key: string, filename: string): Promise<string>
  getObjectStream(key: string): Promise<Readable>
  exists(key: string): Promise<boolean>
}
