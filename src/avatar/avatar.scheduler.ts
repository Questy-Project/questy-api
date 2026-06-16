import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Avatar } from './entities/avatar.entity';
import { AvatarService } from './avatar.service';

@Injectable()
export class AvatarScheduler {
  private readonly logger = new Logger(AvatarScheduler.name);

  constructor(
    @InjectRepository(Avatar)
    private readonly avatarRepository: Repository<Avatar>,
    private readonly avatarService: AvatarService,
  ) {}

  // Reset mensuel le 1er du mois à 00:00 UTC — cohérent avec tous les autres crons
  @Cron('0 0 1 * *')
  async handleMonthlyReset() {
    this.logger.log('Début du reset mensuel des stats avatar...');
    const avatars = await this.avatarRepository.find();

    for (const avatar of avatars) {
      // Calculer le socle de fidélité pour chaque stat avant reset
      const strengthBase     = this.avatarService.computeStatBase(avatar.strength);
      const agilityBase      = this.avatarService.computeStatBase(avatar.agility);
      const enduranceBase    = this.avatarService.computeStatBase(avatar.endurance);
      const intelligenceBase = this.avatarService.computeStatBase(avatar.intelligence);
      const spiritBase       = this.avatarService.computeStatBase(avatar.spirit);
      const vitalityBase     = this.avatarService.computeStatBase(avatar.vitality);

      // Remettre stats et XP cumulés au socle — le XP équivalent repositionne
      // le joueur au bon endroit de la courbe logarithmique pour le mois suivant
      avatar.strength        = strengthBase;
      avatar.strengthXp      = this.avatarService.statBaseToXp(strengthBase);
      avatar.agility         = agilityBase;
      avatar.agilityXp       = this.avatarService.statBaseToXp(agilityBase);
      avatar.endurance       = enduranceBase;
      avatar.enduranceXp     = this.avatarService.statBaseToXp(enduranceBase);
      avatar.intelligence    = intelligenceBase;
      avatar.intelligenceXp  = this.avatarService.statBaseToXp(intelligenceBase);
      avatar.spirit          = spiritBase;
      avatar.spiritXp        = this.avatarService.statBaseToXp(spiritBase);
      avatar.vitality        = vitalityBase;
      avatar.vitalityXp      = this.avatarService.statBaseToXp(vitalityBase);

      // Recalculer la classe après reset
      avatar.heroClass = this.avatarService.computeHeroClass(avatar);
    }

    await this.avatarRepository.save(avatars);
    this.logger.log(`Reset mensuel terminé — ${avatars.length} avatars traités.`);
  }
}
