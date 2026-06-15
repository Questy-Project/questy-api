import { Column, Entity, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

export enum RankTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD   = 'GOLD',
  LEGEND = 'LEGEND',
}

@Unique(['userId', 'month', 'year'])
@Entity('monthly_ranks')
export class MonthlyRank {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  month!: number;

  @Column()
  year!: number;

  @Column({ default: 0 })
  totalPoints!: number;

  @Column({ type: 'varchar', default: RankTier.BRONZE })
  tier!: RankTier;

  @Column({ default: 0 })
  coinsEarned!: number;

  @UpdateDateColumn()
  updatedAt!: Date;
}
