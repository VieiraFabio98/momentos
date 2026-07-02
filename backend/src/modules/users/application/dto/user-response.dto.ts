import { IUser } from '../../domain/entities/i-user'

export class UserResponseDto {
  id: string
  name: string
  email: string
  createdAt: Date
  updatedAt: Date

  static fromDomain(user: IUser): UserResponseDto {
    const dto = new UserResponseDto()
    dto.id = user.id
    dto.name = user.name
    dto.email = user.email
    dto.createdAt = user.createdAt
    dto.updatedAt = user.updatedAt
    return dto
  }
}
