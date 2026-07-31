import { IUser, SubscriptionPlan, UserRole } from '../entities/i-user'

export const USER_WRITE_REPOSITORY = Symbol('USER_WRITE_REPOSITORY')

export interface ICreateUserData {
  name: string
  email: string
  passwordHash: string | null
  role?: UserRole
}

export interface IUpdateUserData {
  name?: string
  email?: string
  passwordHash?: string
  subscriptionPlan?: SubscriptionPlan | null
  role?: UserRole
}

export interface IUserWriteRepository {
  create(data: ICreateUserData): Promise<IUser>
  update(id: string, data: IUpdateUserData): Promise<IUser>
  delete(id: string): Promise<void>
}
