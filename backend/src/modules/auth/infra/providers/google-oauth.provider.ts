import { Injectable } from '@nestjs/common'
import { OAuth2Client } from 'google-auth-library'
import { IOAuthProvider, IOAuthUserInfo } from '../../domain/providers/i-oauth-provider'

@Injectable()
export class GoogleOAuthProvider implements IOAuthProvider {
  private readonly client = new OAuth2Client()

  async verifyIdToken(idToken: string): Promise<IOAuthUserInfo | null> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      })

      const payload = ticket.getPayload()
      if (!payload?.email || !payload.email_verified) {
        return null
      }

      return {
        email: payload.email,
        name: payload.name ?? payload.email.split('@')[0],
      }
    } catch {
      return null
    }
  }
}
