import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, ILike, Repository } from 'typeorm';
import { AvatarScheduler } from '../avatar/avatar.scheduler';
import { PartsService } from '../parts/parts.service';
import { AvatarService } from '../avatar/avatar.service';
import { User } from '../users/entities/user.entity';
import { Avatar } from '../avatar/entities/avatar.entity';
import { Part } from '../parts/entities/parts.entity';
import { MonthlyRank, RankTier } from '../rank/entities/monthly-rank.entity';
import { TournamentWeeklyRank } from '../tournament/entities/tournament-weekly-rank.entity';
import { RankService } from '../rank/rank.service';
import { getIsoWeek } from '../common/utils/week.util';
import { PatchStatsDto } from './dto/patch-stats.dto';
import { PatchPartsDto } from './dto/patch-parts.dto';
import { PatchRankDto } from './dto/patch-rank.dto';

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
    @InjectRepository(MonthlyRank)
    private readonly monthlyRankRepository: Repository<MonthlyRank>,
    @InjectRepository(TournamentWeeklyRank)
    private readonly weeklyRankRepository: Repository<TournamentWeeklyRank>,
    private readonly rankService: RankService,
  ) {}

  async triggerMonthlyReset(): Promise<{ message: string }> {
    await this.avatarScheduler.handleMonthlyReset();
    return { message: 'Reset mensuel exécuté' };
  }

  async triggerPartsRecharge(): Promise<{ message: string }> {
    await this.partsService.rechargeNightly();
    return { message: 'Recharge des parties exécutée' };
  }

  async getUsers(page = 1, limit = 10, search?: string) {
    const { month, year } = this.rankService.currentPeriod();

    const findOptions: FindManyOptions<User> = {
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    };
    if (search?.trim()) {
      findOptions.where = [
        { pseudo: ILike(`%${search.trim()}%`) },
        { email:  ILike(`%${search.trim()}%`) },
      ];
    }

    const [users, total] = await this.userRepository.findAndCount(findOptions);

    const data = await Promise.all(users.map(async (user) => {
      const [avatar, parts, monthlyRank] = await Promise.all([
        this.avatarRepository.findOne({ where: { userId: user.id } }),
        this.partRepository.findOne({ where: { userId: user.id } }),
        this.monthlyRankRepository.findOne({ where: { userId: user.id, month, year } }),
      ]);

      return {
        id:    user.id,
        pseudo: user.pseudo,
        email:  user.email,
        role:   user.role,
        rank: monthlyRank
          ? { tier: monthlyRank.tier, totalPoints: monthlyRank.totalPoints }
          : { tier: 'BRONZE', totalPoints: 0 },
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
      };
    }));

    return { data, total, page, limit };
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

  async patchRank(userId: string, dto: PatchRankDto): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const { month, year } = this.rankService.currentPeriod();

    if (dto.monthlyPoints !== undefined) {
      let rank = await this.monthlyRankRepository.findOne({ where: { userId, month, year } });
      if (!rank) {
        rank = this.monthlyRankRepository.create({ userId, month, year, totalPoints: 0, tier: RankTier.BRONZE, coinsEarned: 0 });
      }
      rank.totalPoints = dto.monthlyPoints;
      await this.monthlyRankRepository.save(rank);
    }

    if (dto.weeklyPoints !== undefined) {
      const { weekNumber, year: weekYear } = getIsoWeek();

      let rank = await this.weeklyRankRepository.findOne({ where: { userId, weekNumber, year: weekYear } });
      if (!rank) {
        rank = this.weeklyRankRepository.create({ userId, weekNumber, year: weekYear, wins: 0, losses: 0, totalPoints: 0, claimedSlots: 0 });
      }
      rank.totalPoints = dto.weeklyPoints;
      await this.weeklyRankRepository.save(rank);
    }

    if (dto.monthlyPoints !== undefined) {
      await this.rankService.recalculateTiers();
    }

    return { message: 'Points mis à jour' };
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
