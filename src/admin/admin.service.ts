import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AvatarScheduler } from '../avatar/avatar.scheduler';
import { PartsService } from '../parts/parts.service';
import { User } from '../users/entities/user.entity';
import { Avatar } from '../avatar/entities/avatar.entity';
import { Part } from '../parts/entities/parts.entity';

@Injectable()
export class AdminService {
  constructor(
    private readonly avatarScheduler: AvatarScheduler,
    private readonly partsService: PartsService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Avatar)
    private readonly avatarRepository: Repository<Avatar>,
    @InjectRepository(Part)
    private readonly partRepository: Repository<Part>,
  ) {}

  async triggerMonthlyReset(): Promise<{ message: string }> {
    await this.avatarScheduler.handleMonthlyReset();
    return { message: 'Reset mensuel exécuté' };
  }

  async triggerPartsRecharge(): Promise<{ message: string }> {
    await this.partsService.rechargeNightly();
    return { message: 'Recharge des parties exécutée' };
  }

  async getUsers() {
    const users = await this.userRepository.find();
    const result = [];

    for (const user of users) {
      const avatar = await this.avatarRepository.findOne({ where: { userId: user.id } });
      const parts  = await this.partRepository.findOne({ where: { userId: user.id } });
      result.push({
        id:     user.id,
        pseudo: user.pseudo,
        email:  user.email,
        role:   user.role,
        avatar: avatar ? {
          level:        avatar.level,
          xp:           avatar.xp,
          heroClass:    avatar.heroClass,
          strength:     avatar.strength,
          agility:      avatar.agility,
          endurance:    avatar.endurance,
          intelligence: avatar.intelligence,
          spirit:       avatar.spirit,
          vitality:     avatar.vitality,
        } : null,
        parts: parts ? { stock: parts.stock } : null,
      });
    }

    return result;
  }
}
