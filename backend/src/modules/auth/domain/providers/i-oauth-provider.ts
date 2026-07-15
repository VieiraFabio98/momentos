export const OAUTH_PROVIDER = Symbol('OAUTH_PROVIDER')

export interface IOAuthUserInfo {
  email: string
  name: string
}

export interface IOAuthProvider {
  verifyIdToken(idToken: string): Promise<IOAuthUserInfo | null>
}
