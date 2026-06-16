import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { StatName } from '../../common/enums/stat-name.enum';

type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

@Entity('challenge_sessions')
export class ChallengeSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column({ nullable: true })
  challengeId!: string;

  @Column({ type: 'enum', enum: StatName })
  stat!: StatName;

  @Column({ type: 'jsonb' })
  history!: ChatMessage[];

  @Column({ default: 'pending' })
  status!: string;

  @Column({ type: 'varchar', nullable: true })
  result!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
