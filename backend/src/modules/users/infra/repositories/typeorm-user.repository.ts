import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { IUser } from '../../domain/entities/i-user'
import { IUserRepository } from '../../domain/repositories/i-user-repository'
import {
  ICreateUserData,
  IUpdateUserData,
} from '../../domain/repositories/i-user-write-repository'
import { UserEntity } from '../entities/user.entity'

@Injectable()
export class TypeormUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  findAll(): Promise<IUser[]> {
    return this.repository.find()
  }

  findById(id: string): Promise<IUser | null> {
    return this.repository.findOneBy({ id })
  }

  findByEmail(email: string): Promise<IUser | null> {
    return this.repository.findOneBy({ email })
  }

  create(data: ICreateUserData): Promise<IUser> {
    const user = this.repository.create(data)
    return this.repository.save(user)
  }

  async update(id: string, data: IUpdateUserData): Promise<IUser> {
    await this.repository.update(id, data)
    return this.repository.findOneByOrFail({ id })
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id)
  }
}
