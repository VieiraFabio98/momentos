export const HASH_PROVIDER = Symbol('HASH_PROVIDER')

export interface IHashProvider {
  hash(plain: string): Promise<string>
  compare(plain: string, hashed: string): Promise<boolean>
}
