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
  // apaga tudo sob o prefixo e devolve quantos objetos foram removidos. Pega
  // também o que não tem linha no banco: upload que o cliente concluiu no S3 e
  // não chegou a confirmar ficaria lá para sempre se fôssemos pelas chaves.
  deleteByPrefix(prefix: string): Promise<number>
}
