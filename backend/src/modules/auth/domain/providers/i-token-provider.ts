export const TOKEN_PROVIDER = Symbol('TOKEN_PROVIDER')

export interface ITokenPayload {
  sub: string
  email: string
}

export interface ITokenProvider {
  sign(payload: ITokenPayload): Promise<string>
  verify(token: string): Promise<ITokenPayload | null>
}
