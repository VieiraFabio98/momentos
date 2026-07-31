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
import { UserEntity } from '../../../users/infra/entities/user.entity'
import { ISubscription, SubscriptionPlan, SubscriptionStatus } from '../../domain/entities/i-subscription'

@Entity('subscriptions')
export class SubscriptionEntity implements ISubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index()
  @Column()
  userId: string

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity

  @Column({ type: 'varchar' })
  plan: SubscriptionPlan

  @Column({ type: 'varchar', default: 'pending' })
  status: SubscriptionStatus

  @Index({ unique: true })
  @Column()
  providerSubscriptionId: string

  @Column({ type: 'timestamp', nullable: true })
  currentPeriodEnd: Date | null

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
