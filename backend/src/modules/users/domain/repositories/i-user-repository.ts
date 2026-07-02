import { IUserReadRepository } from './i-user-read-repository'
import { IUserWriteRepository } from './i-user-write-repository'

export const USER_REPOSITORY = Symbol('USER_REPOSITORY')

export interface IUserRepository extends IUserReadRepository, IUserWriteRepository {}
