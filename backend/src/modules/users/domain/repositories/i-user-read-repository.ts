import { IUser } from '../entities/i-user'

export const USER_READ_REPOSITORY = Symbol('USER_READ_REPOSITORY')

export interface IUserReadRepository {
  findAll(): Promise<IUser[]>
  findById(id: string): Promise<IUser | null>
  findByEmail(email: string): Promise<IUser | null>
}
