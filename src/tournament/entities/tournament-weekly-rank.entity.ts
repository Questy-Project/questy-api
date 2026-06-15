import { Column, Entity, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

@Unique(['userId', 'weekNumber', 'year'])
@Entity('tournament_weekly_ranks')
export class TournamentWeeklyRank {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  weekNumber!: number;

  @Column()
  year!: number;

  @Column({ default: 0 })
  wins!: number;

  @Column({ default: 0 })
  losses!: number;

  @Column({ default: 0 })
  totalPoints!: number;

  @Column({ type: 'int', nullable: true })
  placement!: number | null;

  @UpdateDateColumn()
  updatedAt!: Date;
}
