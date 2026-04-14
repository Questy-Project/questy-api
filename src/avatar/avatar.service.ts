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

  computeHeroClass(avatar: Avatar): string {
    const stats: Record<StatName, number> = {
      [StatName.STRENGTH]: avatar.strength,
      [StatName.AGILITY]: avatar.agility,
      [StatName.ENDURANCE]: avatar.endurance,
      [StatName.INTELLIGENCE]: avatar.intelligence,
      [StatName.SPIRIT]: avatar.spirit,
      [StatName.VITALITY]: avatar.vitality,
    };

    const max = Math.max(...Object.values(stats));
    if (max === 0) return 'Aventurier';

    const dominant = (Object.keys(stats) as StatName[]).filter(
      (k) => stats[k] === max,
    );

    if (dominant.length === 1) {
      const classMap: Record<StatName, string> = {
        [StatName.STRENGTH]: 'Guerrier',
        [StatName.AGILITY]: 'Voleur',
        [StatName.ENDURANCE]: 'Tank',
        [StatName.INTELLIGENCE]: 'Mage',
        [StatName.SPIRIT]: 'Prêtre',
        [StatName.VITALITY]: 'Paladin',
      };
      return classMap[dominant[0]];
    }

    if (dominant.length === 2) {
      const pair = [...dominant].sort().join('+');
      const comboMap: Record<string, string> = {
        [`${StatName.AGILITY}+${StatName.STRENGTH}`]: 'Berserker',
        [`${StatName.INTELLIGENCE}+${StatName.STRENGTH}`]: 'Mage de guerre',
        [`${StatName.ENDURANCE}+${StatName.SPIRIT}`]: 'Druide',
        [`${StatName.INTELLIGENCE}+${StatName.SPIRIT}`]: 'Sage lettré',
      };
      return comboMap[pair] ?? 'Aventurier';
    }
    return 'Aventurier';
  }

}
