import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { StatName } from '../../common/enums/stat-name.enum';

export enum ChallengeType {
  OBJECTIVE = 'OBJECTIVE',
  TIMED     = 'TIMED',
  QUIZ_IA   = 'QUIZ_IA',
  ENIGMA_IA = 'ENIGMA_IA',
}

@Entity('challenge_catalog')
export class ChallengeCatalog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: StatName })
  stat!: StatName;

  @Column({ type: 'enum', enum: ChallengeType })
  type!: ChallengeType;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ nullable: true, type: 'int' })
  targetSeconds!: number | null;

  @Column({ type: 'int' })
  weekSlot!: number;
}
