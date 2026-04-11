  import { Column, Entity, JoinColumn, OneToOne,
  PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
  import { User } from '../../users/entities/user.entity';

  @Entity('avatars')
  export class Avatar{

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @OneToOne(() => User, {onDelete: 'CASCADE'})
    @JoinColumn()
    user!: User;
    @Column()
    userId!: string;

    @Column({default: 1})
    level!: number;

    @Column({default: 0})
    xp!: number;

    @Column({default: 'Aventurier'})
    heroClass!: string;

    @Column({default: 0})
    strength!: number;

    @Column({default: 0})
    agility!: number;

    @Column({default: 0})
    endurance!: number;

    @Column({default: 0})
    intelligence!: number;

    @Column({default: 0})
    spirit!: number;

    @Column({default: 0})
    vitality!: number;

    @UpdateDateColumn()
    updatedAt!: Date;

  }