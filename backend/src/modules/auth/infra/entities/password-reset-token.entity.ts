import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { IPasswordResetToken } from '../../domain/entities/i-password-reset-token'
import { UserEntity } from '../../../users/infra/entities/user.entity'

@Entity('password_reset_tokens')
export class PasswordResetTokenEntity implements IPasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  userId: string

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity

  @Index()
  @Column()
  tokenHash: string

  @Column()
  expiresAt: Date

  @Column({ type: 'timestamp', nullable: true })
  usedAt: Date | null

  @CreateDateColumn()
  createdAt: Date
}
