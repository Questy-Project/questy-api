import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Avatar } from '../avatar/entities/avatar.entity';
import { Part } from '../parts/entities/parts.entity';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class AdminSeeder implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Avatar)
    private readonly avatarRepository: Repository<Avatar>,
    @InjectRepository(Part)
    private readonly partRepository: Repository<Part>,
  ) {}

  async onModuleInit() {
    if (process.env.NODE_ENV === 'production') return;
    await this.seedAdmin();
    await this.seedNormalUser();
  }

  private async seedAdmin() {
    const exists = await this.userRepository.findOne({ where: { email: 'admin@test.com' } });
    if (exists) return;

    const hashed = await bcrypt.hash('Password123!', 10);
    const user = await this.userRepository.save(
      this.userRepository.create({
        pseudo: 'Admin',
        email: 'admin@test.com',
        password: hashed,
        role: UserRole.ADMIN,
      }),
    );

    // Berserker — Agilité (72) + Force (68) co-dominantes, niveau 10 (xp=4500)
    // XP calculés depuis la formule inverse : xp = (e^(stat/23) - 1) / 0.015
    await this.avatarRepository.save(
      this.avatarRepository.create({
        userId: user.id,
        level: 10,
        xp: 4500,
        heroClass: 'Berserker',
        agility: 72,       agilityXp: 1458,
        strength: 68,      strengthXp: 1215,
        endurance: 45,     enduranceXp: 405,
        vitality: 30,      vitalityXp: 179,
        intelligence: 20,  intelligenceXp: 92,
        spirit: 15,        spiritXp: 61,
      }),
    );

    await this.partRepository.save(
      this.partRepository.create({ userId: user.id, stock: 10 }),
    );
  }

  private async seedNormalUser() {
    const exists = await this.userRepository.findOne({ where: { email: 'user@test.com' } });
    if (exists) return;

    const hashed = await bcrypt.hash('Password123!', 10);
    const user = await this.userRepository.save(
      this.userRepository.create({
        pseudo: 'Joueur',
        email: 'user@test.com',
        password: hashed,
        role: UserRole.USER,
      }),
    );

    // Tank — Endurance dominante (25), niveau 3 (xp=300)
    await this.avatarRepository.save(
      this.avatarRepository.create({
        userId: user.id,
        level: 3,
        xp: 300,
        heroClass: 'Tank',
        endurance: 25,  enduranceXp: 131,
        strength: 8,    strengthXp: 28,
      }),
    );

    await this.partRepository.save(
      this.partRepository.create({ userId: user.id, stock: 3 }),
    );
  }
}
