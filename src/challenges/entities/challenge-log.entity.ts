import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ChallengeCatalog } from './challenge-catalog.entity';
import { StatName } from '../../common/enums/stat-name.enum';

@Entity('challenge_logs')
export class ChallengeLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => ChallengeCatalog, { eager: false })
  challenge!: ChallengeCatalog;

  @Column()
  challengeId!: string;

  @Column({ type: 'enum', enum: StatName })
  stat!: StatName;

  @Column()
  success!: boolean;

  @CreateDateColumn()
  loggedAt!: Date;
}
