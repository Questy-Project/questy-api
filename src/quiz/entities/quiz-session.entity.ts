import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

type GeminiMessage = { role: 'user' | 'model'; parts: { text: string }[] };

@Entity('quiz_sessions')
export class QuizSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  title!: string;

  @Column()
  author!: string;

  @Column()
  difficulty!: string;

  @Column()
  activityName!: string;

  @Column({ nullable: true })
  activityId!: string;

  @Column({ nullable: true })
  duration!: number;

  @Column({ type: 'jsonb', default: '[]' })
  history!: GeminiMessage[];

  @Column({ default: 'pending' })
  status!: string;

  @Column({ nullable: true })
  score!: number;

  @Column({ nullable: true })
  xpGained!: number;

  @Column({ nullable: true })
  partsUnlocked!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
