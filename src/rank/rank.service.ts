import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { MonthlyRank, RankTier } from './entities/monthly-rank.entity';
import { User } from '../users/entities/user.entity';

const TIER_COINS: Record<RankTier, number> = {
  [RankTier.BRONZE]: 100,
  [RankTier.SILVER]: 250,
  [RankTier.GOLD]:   500,
  [RankTier.LEGEND]: 1000,
};

@Injectable()
export class RankService {
  constructor(
    @InjectRepository(MonthlyRank)
    private readonly rankRepo: Repository<MonthlyRank>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  currentPeriod(): { month: number; year: number } {
    const d = new Date();
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  }

  private assignTiers(ranks: MonthlyRank[]): void {
    const total = ranks.length;
    for (let i = 0; i < total; i++) {
      const percentile = ((i + 1) / total) * 100;
      if (percentile <= 10)      ranks[i].tier = RankTier.LEGEND;
      else if (percentile <= 25) ranks[i].tier = RankTier.GOLD;
      else if (percentile <= 50) ranks[i].tier = RankTier.SILVER;
      else                       ranks[i].tier = RankTier.BRONZE;
    }
  }

  async getMyRank(userId: string) {
    const { month, year } = this.currentPeriod();
    const rank = await this.rankRepo.findOne({ where: { userId, month, year } });
    return {
      tier:        rank?.tier        ?? RankTier.BRONZE,
      totalPoints: rank?.totalPoints ?? 0,
      coinsEarned: rank?.coinsEarned ?? 0,
      month,
      year,
    };
  }

  // Recalcule les paliers percentiles pour le mois en cours (sans reset des stats)
  async recalculateTiers(): Promise<void> {
    const { month, year } = this.currentPeriod();
    const ranks = await this.rankRepo.find({ where: { month, year }, order: { totalPoints: 'DESC' } });
    if (ranks.length === 0) return;
    this.assignTiers(ranks);
    await this.rankRepo.save(ranks);
  }

  async getMonthlyLeaderboard() {
    const { month, year } = this.currentPeriod();
    const ranks = await this.rankRepo.find({
      where: { month, year },
      order: { totalPoints: 'DESC' },
    });
    if (ranks.length === 0) return [];
    const userIds = ranks.map(r => r.userId);
    const users = await this.userRepo.find({ where: { id: In(userIds) } });
    return ranks.map(r => ({
      userId:      r.userId,
      pseudo:      users.find(u => u.id === r.userId)?.pseudo ?? r.userId.slice(0, 8),
      totalPoints: r.totalPoints,
      tier:        r.tier,
    }));
  }

  // Appelé par TournamentService à la fin de chaque combat
  async addPoints(userId: string, points: number): Promise<void> {
    const { month, year } = this.currentPeriod();
    let rank = await this.rankRepo.findOne({ where: { userId, month, year } });
    if (!rank) {
      rank = this.rankRepo.create({ userId, month, year, totalPoints: 0, tier: RankTier.BRONZE, coinsEarned: 0 });
    }
    rank.totalPoints += points;
    await this.rankRepo.save(rank);
  }

  // 1er du mois à 00:00 : calcul percentile → palier → pièces → reset stats mensuelles
  @Cron('0 0 1 * *')
  async closeMonth(): Promise<void> {
    const now   = new Date();
    // Le mois qui vient de se terminer
    const month = now.getMonth() === 0 ? 12 : now.getMonth();
    const year  = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    const ranks = await this.rankRepo.find({ where: { month, year }, order: { totalPoints: 'DESC' } });
    if (ranks.length === 0) return;

    this.assignTiers(ranks);
    for (const rank of ranks) rank.coinsEarned = TIER_COINS[rank.tier];
    await this.rankRepo.save(ranks);
    // Reset des stats avatar géré exclusivement par AvatarScheduler.handleMonthlyReset()
  }
}
