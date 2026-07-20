import { Readable } from 'node:stream'

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER')

export interface IObjectMetadata {
  size: number
  contentType: string
}

export interface IStorageProvider {
  getUploadUrl(key: string, contentType: string, size: number): Promise<string>
  getDownloadUrl(key: string): Promise<string>
  getAttachmentUrl(key: string, filename: string): Promise<string>
  getObjectStream(key: string): Promise<Readable>
  getObjectMetadata(key: string): Promise<IObjectMetadata | null>
  deleteObjects(keys: string[]): Promise<void>
}
