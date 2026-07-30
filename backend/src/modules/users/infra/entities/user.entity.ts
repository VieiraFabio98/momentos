import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { IUser, SubscriptionPlan } from '../../domain/entities/i-user'

@Entity('users')
export class UserEntity implements IUser {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ unique: true })
  email: string

  @Column({ type: 'varchar', nullable: true })
  passwordHash: string | null

  @Column({ type: 'varchar', nullable: true })
  subscriptionPlan: SubscriptionPlan | null

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
