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

  // Constantes de calibration — stat = A × ln(B × xpCumulé + 1)
  // Calibration : 2h intense/jour × 30 jours → 100 pts | 30 min légère × 24 jours actifs → ~50 pts
  private readonly STAT_CURVE_A = 23;
  private readonly STAT_CURVE_B = 0.015;

  // Convertit un XP cumulé en points de stat affichés (plafond 100)
  public xpToStat(xpCumule: number): number {
    return Math.min(
      Math.round(this.STAT_CURVE_A * Math.log(this.STAT_CURVE_B * xpCumule + 1)),
      100,
    );
  }

  // Formule inverse : convertit des points de stat en XP cumulé équivalent
  // Utilisé par le reset mensuel pour repositionner le joueur sur la courbe
  public statBaseToXp(statBase: number): number {
    if (statBase === 0) return 0;
    return (Math.exp(statBase / this.STAT_CURVE_A) - 1) / this.STAT_CURVE_B;
  }

  // Calcule le socle de fidélité à appliquer au début du mois suivant
  // Récompense les joueurs assidus : <50→0, ≥50→5, ≥75→12, =100→20
  public computeStatBase(stat: number): number {
    if (stat >= 100) return 20;
    if (stat >= 75)  return 12;
    if (stat >= 50)  return 5;
    return 0;
  }

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
      [StatName.STRENGTH]:     avatar.strength,
      [StatName.AGILITY]:      avatar.agility,
      [StatName.ENDURANCE]:    avatar.endurance,
      [StatName.INTELLIGENCE]: avatar.intelligence,
      [StatName.SPIRIT]:       avatar.spirit,
      [StatName.VITALITY]:     avatar.vitality,
    };

    const max = Math.max(...Object.values(stats));
    if (max === 0) return 'Aventurier';

    const classMap: Record<StatName, string> = {
      [StatName.STRENGTH]:     'Guerrier',
      [StatName.AGILITY]:      'Voleur',
      [StatName.ENDURANCE]:    'Tank',
      [StatName.INTELLIGENCE]: 'Mage',
      [StatName.SPIRIT]:       'Prêtre',
      [StatName.VITALITY]:     'Paladin',
    };

    const comboMap: Record<string, string> = {
      [`${StatName.AGILITY}+${StatName.STRENGTH}`]:       'Berserker',
      [`${StatName.INTELLIGENCE}+${StatName.STRENGTH}`]:  'Mage de guerre',
      [`${StatName.ENDURANCE}+${StatName.SPIRIT}`]:       'Druide',
      [`${StatName.INTELLIGENCE}+${StatName.SPIRIT}`]:    'Sage lettré',
      [`${StatName.ENDURANCE}+${StatName.STRENGTH}`]:     'Chevalier',
      [`${StatName.SPIRIT}+${StatName.STRENGTH}`]:        'Templier',
      [`${StatName.STRENGTH}+${StatName.VITALITY}`]:      'Champion',
      [`${StatName.AGILITY}+${StatName.ENDURANCE}`]:      'Rôdeur',
      [`${StatName.AGILITY}+${StatName.INTELLIGENCE}`]:   'Illusionniste',
      [`${StatName.AGILITY}+${StatName.SPIRIT}`]:         'Moine',
      [`${StatName.AGILITY}+${StatName.VITALITY}`]:       'Danseur de lame',
      [`${StatName.ENDURANCE}+${StatName.INTELLIGENCE}`]: 'Alchimiste',
      [`${StatName.ENDURANCE}+${StatName.VITALITY}`]:     'Colosse',
      [`${StatName.INTELLIGENCE}+${StatName.VITALITY}`]:  'Nécromant',
      [`${StatName.SPIRIT}+${StatName.VITALITY}`]:        'Chaman',
    };

    // Classe hybride : deux stats à moins de 15 pts l'une de l'autre → combo possible
    const THRESHOLD = 15;
    const nearMax = (Object.keys(stats) as StatName[])
      .filter(k => stats[k] >= max - THRESHOLD)
      .sort((a, b) => stats[b] - stats[a]);

    if (nearMax.length >= 2) {
      const pair = [nearMax[0], nearMax[1]].sort().join('+');
      if (comboMap[pair]) return comboMap[pair];
    }

    // Classe simple : stat dominante
    return classMap[nearMax[0]] ?? 'Aventurier';
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
    // Le gain est ajouté au XP cumulé de la stat, puis reconverti en points via la courbe logarithmique
    if (statPrimary) {
      const primaryXp   = Math.round(xpGained * 0.7);
      const secondaryXp = statSecondary ? xpGained - primaryXp : 0;

      const primaryField   = this.statToField(statPrimary);
      const primaryXpField = this.statToXpField(statPrimary);
      avatar[primaryXpField] += primaryXp;
      avatar[primaryField]    = this.xpToStat(avatar[primaryXpField]);

      if (statSecondary) {
        const secondaryField   = this.statToField(statSecondary);
        const secondaryXpField = this.statToXpField(statSecondary);
        avatar[secondaryXpField] += secondaryXp;
        avatar[secondaryField]    = this.xpToStat(avatar[secondaryXpField]);
      }
    }

    avatar.xp    += xpGained;
    avatar.level  = this.computeLevel(avatar.xp);
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

  // Convertit un StatName en nom de colonne XP correspondante
  private statToXpField(
    stat: StatName,
  ): 'strengthXp' | 'agilityXp' | 'enduranceXp' | 'intelligenceXp' | 'spiritXp' | 'vitalityXp' {
    const map: Record<StatName, 'strengthXp' | 'agilityXp' | 'enduranceXp' | 'intelligenceXp' | 'spiritXp' | 'vitalityXp'> = {
      [StatName.STRENGTH]:     'strengthXp',
      [StatName.AGILITY]:      'agilityXp',
      [StatName.ENDURANCE]:    'enduranceXp',
      [StatName.INTELLIGENCE]: 'intelligenceXp',
      [StatName.SPIRIT]:       'spiritXp',
      [StatName.VITALITY]:     'vitalityXp',
    };
    return map[stat];
  }

  // Ajoute +amount directement sur une stat via la courbe XP inverse
  // Utilisé par le système de défis pour appliquer un bonus mensuel
  async addStatBonus(userId: string, stat: StatName, amount: number): Promise<void> {
    const avatar = await this.findByUserId(userId);
    const xpField  = this.statToXpField(stat);
    const statField = this.statToField(stat);
    const currentStat = avatar[statField] as number;
    if (currentStat >= 100) return;
    const targetXp = this.statBaseToXp(currentStat + amount);
    const currentXp = avatar[xpField] as number;
    const delta = Math.max(targetXp - currentXp, 0);
    (avatar as any)[xpField]  = currentXp + delta;
    (avatar as any)[statField] = this.xpToStat((avatar as any)[xpField]);
    avatar.heroClass = this.computeHeroClass(avatar);
    await this.avatarRepository.save(avatar);
  }

  async updateCustomization(
    userId: string,
    dto: UpdateAvatarCustomizationDto,
  ): Promise<Avatar> {
    const avatar = await this.findByUserId(userId);
    avatar.silhouette = dto.silhouette;
    avatar.skinTone   = dto.skinTone;
    avatar.hairStyle  = dto.hairStyle;
    avatar.hairColor  = dto.hairColor;
    avatar.showHood   = dto.showHood;
    return this.avatarRepository.save(avatar);
  }
}
