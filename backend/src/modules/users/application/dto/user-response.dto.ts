import { IUser, SubscriptionPlan } from '../../domain/entities/i-user'

export class UserResponseDto {
  id: string
  name: string
  email: string
  // conta criada só pelo Google não tem senha; é o que diz à tela de perfil se
  // ela deve pedir a senha atual ou oferecer "criar senha". Nunca expõe o hash.
  hasPassword: boolean
  subscriptionPlan: SubscriptionPlan | null
  createdAt: Date
  updatedAt: Date

  static fromDomain(user: IUser): UserResponseDto {
    const dto = new UserResponseDto()
    dto.id = user.id
    dto.name = user.name
    dto.email = user.email
    dto.hasPassword = user.passwordHash !== null
    dto.subscriptionPlan = user.subscriptionPlan
    dto.createdAt = user.createdAt
    dto.updatedAt = user.updatedAt
    return dto
  }
}
