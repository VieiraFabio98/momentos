import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { IPhoto } from '../../domain/entities/i-photo'
import { IPhotoRepository } from '../../domain/repositories/i-photo-repository'
import { ICreatePhotoData } from '../../domain/repositories/i-photo-write-repository'
import { PhotoEntity } from '../entities/photo.entity'

@Injectable()
export class TypeormPhotoRepository implements IPhotoRepository {
  constructor(
    @InjectRepository(PhotoEntity)
    private readonly repository: Repository<PhotoEntity>,
  ) {}

  findAllByEventId(eventId: string): Promise<IPhoto[]> {
    return this.repository.find({ where: { eventId }, order: { createdAt: 'ASC' } })
  }

  countByEventId(eventId: string): Promise<number> {
    return this.repository.countBy({ eventId })
  }

  create(data: ICreatePhotoData): Promise<IPhoto> {
    const photo = this.repository.create(data)
    return this.repository.save(photo)
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id)
  }
}
