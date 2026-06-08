import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AvatarScheduler } from '../avatar/avatar.scheduler';
import { PartsService } from '../parts/parts.service';
import { AvatarService } from '../avatar/avatar.service';
import { User } from '../users/entities/user.entity';
import { Avatar } from '../avatar/entities/avatar.entity';
import { Part } from '../parts/entities/parts.entity';
import { PatchStatsDto } from './dto/patch-stats.dto';
import { PatchPartsDto } from './dto/patch-parts.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly avatarScheduler: AvatarScheduler,
    private readonly partsService: PartsService,
    private readonly avatarService: AvatarService,
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
    const result: Array<Record<string, unknown>> = [];

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

  async patchStats(userId: string, dto: PatchStatsDto): Promise<Avatar> {
    const avatar = await this.avatarRepository.findOne({ where: { userId } });
    if (!avatar) throw new NotFoundException('Avatar introuvable');

    if (dto.strengthXp     !== undefined) { avatar.strengthXp     = dto.strengthXp;     avatar.strength     = this.avatarService.xpToStat(dto.strengthXp);     }
    if (dto.agilityXp      !== undefined) { avatar.agilityXp      = dto.agilityXp;      avatar.agility      = this.avatarService.xpToStat(dto.agilityXp);      }
    if (dto.enduranceXp    !== undefined) { avatar.enduranceXp    = dto.enduranceXp;    avatar.endurance    = this.avatarService.xpToStat(dto.enduranceXp);    }
    if (dto.intelligenceXp !== undefined) { avatar.intelligenceXp = dto.intelligenceXp; avatar.intelligence = this.avatarService.xpToStat(dto.intelligenceXp); }
    if (dto.spiritXp       !== undefined) { avatar.spiritXp       = dto.spiritXp;       avatar.spirit       = this.avatarService.xpToStat(dto.spiritXp);       }
    if (dto.vitalityXp     !== undefined) { avatar.vitalityXp     = dto.vitalityXp;     avatar.vitality     = this.avatarService.xpToStat(dto.vitalityXp);     }

    avatar.heroClass = this.avatarService.computeHeroClass(avatar);

    avatar.xp = Math.round(
      avatar.strengthXp + avatar.agilityXp + avatar.enduranceXp +
      avatar.intelligenceXp + avatar.spiritXp + avatar.vitalityXp
    );
    avatar.level = this.avatarService.computeLevel(avatar.xp);

    return this.avatarRepository.save(avatar);
  }

  async patchParts(userId: string, dto: PatchPartsDto): Promise<Part> {
    const parts = await this.partRepository.findOne({ where: { userId } });
    if (!parts) throw new NotFoundException('Stock de parties introuvable');

    parts.stock = dto.stock;
    return this.partRepository.save(parts);
  }

  async resetUser(userId: string): Promise<{ message: string }> {
    const avatar = await this.avatarRepository.findOne({ where: { userId } });
    const parts  = await this.partRepository.findOne({ where: { userId } });

    if (!avatar) throw new NotFoundException('Avatar introuvable');
    if (!parts)  throw new NotFoundException('Stock de parties introuvable');

    avatar.level        = 1;
    avatar.xp           = 0;
    avatar.heroClass    = 'Aventurier';
    avatar.strength     = 0;  avatar.strengthXp     = 0;
    avatar.agility      = 0;  avatar.agilityXp      = 0;
    avatar.endurance    = 0;  avatar.enduranceXp    = 0;
    avatar.intelligence = 0;  avatar.intelligenceXp = 0;
    avatar.spirit       = 0;  avatar.spiritXp       = 0;
    avatar.vitality     = 0;  avatar.vitalityXp     = 0;

    parts.stock = 0;

    await this.avatarRepository.save(avatar);
    await this.partRepository.save(parts);

    return { message: 'Utilisateur réinitialisé' };
  }
}
