import { Column, Entity, JoinColumn, OneToOne,
PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('avatars')
export class Avatar {

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user!: User;

  @Column()
  userId!: string;

  @Column({ default: 1 })
  level!: number;

  @Column({ default: 0 })
  xp!: number;

  @Column({ default: 'Aventurier' })
  heroClass!: string;

  @Column({ default: 0 })
  strength!: number;

  @Column({ default: 0 })
  agility!: number;

  @Column({ default: 0 })
  endurance!: number;

  @Column({ default: 0 })
  
  intelligence!: number;

  @Column({ default: 0 })
  spirit!: number;

  @Column({ default: 0 })
  vitality!: number;

  // XP cumulés par stat — source de vérité pour la courbe logarithmique
  // Les colonnes strength/agility/etc. sont calculées depuis ces valeurs
  @Column({ type: 'float', default: 0 })
  strengthXp!: number;

  @Column({ type: 'float', default: 0 })
  agilityXp!: number;

  @Column({ type: 'float', default: 0 })
  enduranceXp!: number;

  @Column({ type: 'float', default: 0 })
  intelligenceXp!: number;

  @Column({ type: 'float', default: 0 })
  spiritXp!: number;

  @Column({ type: 'float', default: 0 })
  vitalityXp!: number;

  // Silhouette A (corps masc.) ou B (corps fém.)
  @Column({ default: 'A' })
  silhouette!: string;

  @Column({ default: 1 })
  skinTone!: number;

  @Column({ default: 1 })
  hairStyle!: number;

  @Column({ default: 1 })
  hairColor!: number;

  @Column({ default: false })
  showHood!: boolean;

  @UpdateDateColumn()
  updatedAt!: Date;

}
