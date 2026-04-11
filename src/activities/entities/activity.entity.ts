import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { StatName } from "../../common/enums/stat-name.enum";

@Entity('activities')
export class Activity{

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;

    @Column()
    category!: string;

    @Column( {type: 'enum', enum:StatName})
    statPrimary!: StatName

    @Column({ type: 'enum', enum: StatName, nullable: true})
    statSecondary!: StatName;

    @Column({ type: 'float', default:1.0})
    xpMultiplier!: number;
}
