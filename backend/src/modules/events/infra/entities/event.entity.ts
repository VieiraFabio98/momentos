import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { EventPlan, EventStatus, IEvent } from '../../domain/entities/i-event'
import { UserEntity } from '../../../users/infra/entities/user.entity'

@Entity('events')
export class EventEntity implements IEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  userId: string

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity

  @Column()
  title: string

  @Column({ type: 'date' })
  eventDate: string

  @Index({ unique: true })
  @Column()
  publicToken: string

  @Column({ type: 'varchar' })
  plan: EventPlan

  @Column({ type: 'varchar', default: 'draft' })
  status: EventStatus

  @Column({ type: 'timestamp', nullable: true })
  opensAt: Date | null

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
