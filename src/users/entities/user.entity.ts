import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';

@Entity('users')
export class User {

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  pseudo!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ nullable: true })
  age!: number;

  @Column({ type: 'varchar', default: UserRole.USER })
  role!: UserRole;

  @Column({ nullable: true })
  familyId!: string;

  @Column({ default: false })
  isFamilyOwner!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
