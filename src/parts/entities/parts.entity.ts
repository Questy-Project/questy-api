import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "../../users/entities/user.entity";

@Entity('parts')
export class Part{

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @OneToOne(() => User, {onDelete: 'CASCADE'})
    @JoinColumn()
    user!: User
    @Column()
    userId!: string;

    @Column({default: 0})
    stock!: number

    @Column({nullable: true})
    lastRechargeAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}