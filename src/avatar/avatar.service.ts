import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Avatar } from './entities/avatar.entity';
import { StatName } from '../common/enums/stat-name.enum';

@Injectable()
export class AvatarService {
  constructor(
    @InjectRepository(Avatar)
    private readonly avatarRepository: Repository<Avatar>,
  ) {}

  async findByUserId(userId: string): Promise<Avatar> {
    const avatar = await this.avatarRepository.findOne({ where: { userId } });
    if (!avatar) throw new NotFoundException('Avatar introuvable');
    return avatar;
  }

  // Seuils XP cumulatifs : niveau N nécessite (N-1)*N/2 * 100 XP total
  // L1=0, L2=100, L3=300, L4=600, L5=1000, L10=4500...
  computeLevel(xp: number): number {
    let level = 1;
    while (xp >= ((level * (level + 1)) / 2) * 100) {
      level++;
    }
    return level;
  }

  // XP total requis pour atteindre un niveau donné (utilisé dans le controller)
  xpForLevel(level: number): number {
    return ((level * (level + 1)) / 2) * 100;
  }
}
