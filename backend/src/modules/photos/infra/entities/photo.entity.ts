import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { EventEntity } from '../../../events/infra/entities/event.entity'
import { IPhoto } from '../../domain/entities/i-photo'

@Entity('photos')
export class PhotoEntity implements IPhoto {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index()
  @Column()
  eventId: string

  @ManyToOne(() => EventEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: EventEntity

  @Column({ unique: true })
  storageKey: string

  @Column({ type: 'varchar', nullable: true })
  guestName: string | null

  @Column({ default: true })
  approved: boolean

  @CreateDateColumn()
  createdAt: Date
}
