import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type TurnLog = {
  turn: number;
  playerAction: string;
  opponentAction: string;
  playerCrit: boolean;
  opponentCrit: boolean;
  playerDamageDealt: number;
  opponentDamageDealt: number;
  playerHpAfter: number;
  opponentHpAfter: number;
};

@Entity('tournament_combats')
export class TournamentCombat {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  opponentId!: string;

  @Column()
  userHpStart!: number;

  @Column()
  opponentHpStart!: number;

  @Column({ default: 0 })
  userHpCurrent!: number;

  @Column({ default: 0 })
  opponentHpCurrent!: number;

  @Column({ type: 'int', nullable: true })
  userHpEnd!: number | null;

  @Column({ type: 'int', nullable: true })
  opponentHpEnd!: number | null;

  @Column({ type: 'varchar', nullable: true })
  winnerId!: string | null;

  @Column({ type: 'jsonb', default: [] })
  turns!: TurnLog[];

  @Column({ default: 0 })
  pointsGained!: number;

  @Column({ type: 'varchar', default: 'in_progress' })
  status!: 'in_progress' | 'finished';

  @Column()
  weekNumber!: number;

  @Column()
  year!: number;

  @CreateDateColumn()
  foughtAt!: Date;
}
