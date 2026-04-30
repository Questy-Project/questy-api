import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Activity } from "./activity.entity";

@Entity('activity_logs')
export class ActivityLog{

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(()=> User)
    @JoinColumn()
    user!: User
    @Column()
    userId!: string;

    @ManyToOne(()=> Activity,{nullable: true})
    @JoinColumn()
    activity!: Activity
    @Column({nullable: true})
    activityId!: string;

    @Column({ nullable: true})
    customName!: string;

    @Column({ nullable:true})
    customCategory!: string;

    @Column()
    duration!: number;

    @Column({type:'float'})
    intensity!: number;

    @Column()
    xpGained!: number;

    @Column()
    partsUnlocked!: number;

    @CreateDateColumn()
    loggedAt!: Date;
}