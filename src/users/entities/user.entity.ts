import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class User{

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true})
    pseudo!: string;

    @Column({unique: true})
    email!: string;

    @Column()
    password!: string;

    @Column({nullable: true})
    age!: number;
    
    @Column({nullable: true})
    familyId!: string;

    @Column({default: false})
    isFamilyOwner!: boolean;

    @CreateDateColumn()
    createdAt!: Date;
}