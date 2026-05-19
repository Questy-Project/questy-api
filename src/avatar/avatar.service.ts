import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Avatar } from './entities/avatar.entity';
import { StatName } from '../common/enums/stat-name.enum';
import { UpdateAvatarCustomizationDto } from './dto/update-avatar-customization.dto';

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
    return (((level - 1) * level) / 2) * 100;
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
        [`${StatName.AGILITY}+${StatName.STRENGTH}`]:      'Berserker',
        [`${StatName.INTELLIGENCE}+${StatName.STRENGTH}`]: 'Mage de guerre',
        [`${StatName.ENDURANCE}+${StatName.SPIRIT}`]:      'Druide',
        [`${StatName.INTELLIGENCE}+${StatName.SPIRIT}`]:   'Sage lettré',
        [`${StatName.ENDURANCE}+${StatName.STRENGTH}`]:    'Chevalier',
        [`${StatName.SPIRIT}+${StatName.STRENGTH}`]:       'Templier',
        [`${StatName.STRENGTH}+${StatName.VITALITY}`]:     'Champion',
        [`${StatName.AGILITY}+${StatName.ENDURANCE}`]:     'Rôdeur',
        [`${StatName.AGILITY}+${StatName.INTELLIGENCE}`]:  'Illusionniste',
        [`${StatName.AGILITY}+${StatName.SPIRIT}`]:        'Moine',
        [`${StatName.AGILITY}+${StatName.VITALITY}`]:      'Danseur de lame',
        [`${StatName.ENDURANCE}+${StatName.INTELLIGENCE}`]:'Alchimiste',
        [`${StatName.ENDURANCE}+${StatName.VITALITY}`]:    'Colosse',
        [`${StatName.INTELLIGENCE}+${StatName.VITALITY}`]: 'Nécromant',
        [`${StatName.SPIRIT}+${StatName.VITALITY}`]:       'Chaman',
      };
      return comboMap[pair] ?? 'Aventurier';
    }
    return 'Aventurier';
  }

  // Appelé par ActivitiesService après chaque déclaration d'activité
  async updateAfterActivity(
    userId: string,
    xpGained: number,
    statPrimary: StatName | null,
    statSecondary: StatName | null,
  ): Promise<Avatar> {
    const avatar = await this.findByUserId(userId);

    // Répartition XP : 70% statPrimary, 30% statSecondary
    if (statPrimary) {
      const primary = Math.round(xpGained * 0.7);
      const secondary = statSecondary ? xpGained - primary : 0;
      avatar[this.statToField(statPrimary)] += primary;
      if (statSecondary) {
        avatar[this.statToField(statSecondary)] += secondary;
      }
    }

    avatar.xp += xpGained;
    avatar.level = this.computeLevel(avatar.xp);
    avatar.heroClass = this.computeHeroClass(avatar);

    return this.avatarRepository.save(avatar);
  }

  // Convertit un StatName en nom de propriété ('strength', 'agility', etc.)
  private statToField(
    stat: StatName,
  ):
    | 'strength'
    | 'agility'
    | 'endurance'
    | 'intelligence'
    | 'spirit'
    | 'vitality' {
    const map: Record<
      StatName,
      | 'strength'
      | 'agility'
      | 'endurance'
      | 'intelligence'
      | 'spirit'
      | 'vitality'
    > = {
      [StatName.STRENGTH]: 'strength',
      [StatName.AGILITY]: 'agility',
      [StatName.ENDURANCE]: 'endurance',
      [StatName.INTELLIGENCE]: 'intelligence',
      [StatName.SPIRIT]: 'spirit',
      [StatName.VITALITY]: 'vitality',
    };
    return map[stat];
  }

  async updateCustomization(
    userId: string,
    dto: UpdateAvatarCustomizationDto,
  ): Promise<Avatar> {
    const avatar = await this.findByUserId(userId);
    avatar.silhouette = dto.silhouette;
    avatar.skinTone = dto.skinTone;
    avatar.hairStyle = dto.hairStyle;
    avatar.hairColor = dto.hairColor;
    return this.avatarRepository.save(avatar);
  }
}
