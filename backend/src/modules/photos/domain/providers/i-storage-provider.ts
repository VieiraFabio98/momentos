export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER')

export interface IStorageProvider {
  getUploadUrl(key: string, contentType: string): Promise<string>
  getDownloadUrl(key: string): Promise<string>
  exists(key: string): Promise<boolean>
}
