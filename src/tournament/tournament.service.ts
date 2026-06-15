import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { TournamentCombat, TurnLog } from './entities/tournament-combat.entity';
import { TournamentWeeklyRank } from './entities/tournament-weekly-rank.entity';
import { AvatarService } from '../avatar/avatar.service';
import { RankService } from '../rank/rank.service';
import { getIsoWeek } from '../common/utils/week.util';

type AvatarStats = {
  strength: number;
  agility: number;
  endurance: number;
  intelligence: number;
  spirit: number;
  vitality: number;
  level: number;
};

const ACTION_STAT: Record<string, keyof AvatarStats> = {
  PHYSICAL_ATTACK: 'strength',
  PHYSICAL_BLOCK:  'endurance',
  MAGIC_ATTACK:    'intelligence',
  MAGIC_BLOCK:     'spirit',
};

const ATTACK_BLOCK_PAIRS: Record<string, string> = {
  PHYSICAL_ATTACK: 'PHYSICAL_BLOCK',
  MAGIC_ATTACK:    'MAGIC_BLOCK',
};

@Injectable()
export class TournamentService {
  constructor(
    @InjectRepository(TournamentCombat)
    private readonly combatRepo: Repository<TournamentCombat>,
    @InjectRepository(TournamentWeeklyRank)
    private readonly rankRepo: Repository<TournamentWeeklyRank>,
    private readonly avatarService: AvatarService,
    private readonly rankService: RankService,
  ) {}

  private getWeekNumber(date?: Date): { weekNumber: number; year: number } {
    return getIsoWeek(date);
  }

  private todayBounds(): { start: Date; end: Date } {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end   = new Date(); end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  // HP = 100 + VITALITÉ × 2 + niveau
  private computeHp(stats: AvatarStats): number {
    return 100 + stats.vitality * 2 + stats.level;
  }

  // Chance de critique en % : (AGI/100)^0.75 × 75, plafonnée à 75%
  private critChance(agility: number): number {
    return Math.min(Math.pow(agility / 100, 0.75) * 75, 75);
  }

  private isCrit(agility: number): boolean {
    return Math.random() * 100 < this.critChance(agility);
  }

  // Résolution d'un échange attaque/défense entre deux actions
  private resolveExchange(
    playerAction: string,
    opponentAction: string,
    playerStats: AvatarStats,
    opponentStats: AvatarStats,
    playerCrit: boolean,
    opponentCrit: boolean,
  ): { playerDmg: number; opponentDmg: number } {
    let playerDmg   = 0;
    let opponentDmg = 0;

    const playerStatVal   = playerStats[ACTION_STAT[playerAction]] as number;
    const opponentStatVal = opponentStats[ACTION_STAT[opponentAction]] as number;

    const playerEffective   = playerCrit   ? Math.round(playerStatVal   * 1.5) : playerStatVal;
    const opponentEffective = opponentCrit ? Math.round(opponentStatVal * 1.5) : opponentStatVal;

    // Résolution côté joueur (joueur attaque)
    if (playerAction === 'PHYSICAL_ATTACK' || playerAction === 'MAGIC_ATTACK') {
      const counterBlock = ATTACK_BLOCK_PAIRS[playerAction];
      if (opponentAction === counterBlock) {
        if (playerEffective > opponentEffective) {
          opponentDmg = Math.max(Math.round(playerEffective * 0.2), 1);
        } else if (playerEffective === opponentEffective) {
          opponentDmg = 0;
        } else {
          playerDmg = Math.max(opponentEffective - playerEffective, 1);
        }
      } else {
        opponentDmg = Math.max(playerEffective, 1);
      }
    }

    // Résolution côté adversaire (adversaire attaque)
    if (opponentAction === 'PHYSICAL_ATTACK' || opponentAction === 'MAGIC_ATTACK') {
      const counterBlock = ATTACK_BLOCK_PAIRS[opponentAction];
      if (playerAction === counterBlock) {
        if (opponentEffective > playerEffective) {
          playerDmg = Math.max(Math.round(opponentEffective * 0.2), 1);
        } else if (opponentEffective === playerEffective) {
          playerDmg = 0;
        } else {
          opponentDmg += Math.max(playerEffective - opponentEffective, 1);
        }
      } else {
        playerDmg = Math.max(opponentEffective, 1);
      }
    }

    return { playerDmg, opponentDmg };
  }

  // Sélection pondérée de l'action de l'adversaire IA
  private pickOpponentAction(stats: AvatarStats): string {
    const weights: Record<string, number> = {
      PHYSICAL_ATTACK: stats.strength,
      PHYSICAL_BLOCK:  stats.endurance,
      MAGIC_ATTACK:    stats.intelligence,
      MAGIC_BLOCK:     stats.spirit,
    };
    const total = Object.values(weights).reduce((a, b) => a + b, 0) || 4;
    let rand = Math.random() * total;
    for (const [action, weight] of Object.entries(weights)) {
      rand -= weight;
      if (rand <= 0) return action;
    }
    return 'PHYSICAL_ATTACK';
  }

  // Réclame un slot de combat pour aujourd'hui (1 par jour, max 7/semaine)
  async claimDailySlot(userId: string): Promise<void> {
    const { weekNumber, year } = this.getWeekNumber();
    const today = new Date().toISOString().split('T')[0];

    let rank = await this.rankRepo.findOne({ where: { userId, weekNumber, year } });
    if (!rank) {
      rank = this.rankRepo.create({ userId, weekNumber, year, wins: 0, losses: 0, totalPoints: 0, claimedSlots: 0, lastClaimDate: null });
    }
    if (rank.lastClaimDate === today) return;
    if (rank.claimedSlots >= 7) return;

    rank.claimedSlots++;
    rank.lastClaimDate = today;
    await this.rankRepo.save(rank);
  }

  async getStatus(userId: string) {
    const { weekNumber, year } = this.getWeekNumber();
    const { start, end }       = this.todayBounds();

    const foughtToday = await this.combatRepo.count({
      where: { userId, foughtAt: Between(start, end) },
    });

    const weekStart = new Date(); weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6); weekEnd.setHours(23, 59, 59, 999);

    const weekCombats = await this.combatRepo.count({
      where: { userId, foughtAt: Between(weekStart, weekEnd) },
    });

    const rank = await this.rankRepo.findOne({ where: { userId, weekNumber, year } });
    const claimedSlots = rank?.claimedSlots ?? 0;

    return {
      canFightToday: foughtToday === 0 && claimedSlots > weekCombats,
      combatsThisWeek: weekCombats,
      claimedSlots,
      wins:   rank?.wins   ?? 0,
      losses: rank?.losses ?? 0,
      totalPoints: rank?.totalPoints ?? 0,
    };
  }

  async startCombat(userId: string) {
    const { start, end } = this.todayBounds();
    const foughtToday = await this.combatRepo.count({
      where: { userId, foughtAt: Between(start, end) },
    });
    if (foughtToday > 0) throw new BadRequestException('Tu as déjà combattu aujourd\'hui.');

    const { weekNumber: wn, year: wy } = this.getWeekNumber();
    const rank = await this.rankRepo.findOne({ where: { userId, weekNumber: wn, year: wy } });

    const weekStart = new Date(); weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6); weekEnd.setHours(23, 59, 59, 999);

    const weekCombats = await this.combatRepo.count({
      where: { userId, foughtAt: Between(weekStart, weekEnd) },
    });
    if (!rank || rank.claimedSlots <= weekCombats) {
      throw new BadRequestException('Aucune unité de combat disponible. Reviens demain pour en gagner une nouvelle.');
    }

    const userAvatar = await this.avatarService.findByUserId(userId);

    // Sélection d'un adversaire aléatoire différent du joueur
    const opponents = await this.avatarService.findAll();
    const pool = opponents.filter(a => a.userId !== userId);
    if (pool.length === 0) throw new BadRequestException('Aucun adversaire disponible pour le moment.');
    const opponent = pool[Math.floor(Math.random() * pool.length)];

    const userHp     = this.computeHp(userAvatar);
    const opponentHp = this.computeHp(opponent);
    const { weekNumber, year } = this.getWeekNumber();

    const combat = await this.combatRepo.save(
      this.combatRepo.create({
        userId,
        opponentId:        opponent.userId,
        userHpStart:       userHp,
        opponentHpStart:   opponentHp,
        userHpCurrent:     userHp,
        opponentHpCurrent: opponentHp,
        turns:   [],
        status:  'in_progress',
        weekNumber,
        year,
      }),
    );

    return {
      combatId:     combat.id,
      userHp,
      opponentHp,
      opponentPseudo: opponent.user?.pseudo ?? 'Inconnu',
      opponentStats: {
        strength:     opponent.strength,
        agility:      opponent.agility,
        endurance:    opponent.endurance,
        intelligence: opponent.intelligence,
        spirit:       opponent.spirit,
        vitality:     opponent.vitality,
        level:        opponent.level,
      },
      opponentAvatar: {
        silhouette: opponent.silhouette,
        skinTone:   opponent.skinTone,
        hairStyle:  opponent.hairStyle,
        hairColor:  opponent.hairColor,
        heroClass:  opponent.heroClass,
        showHood:   opponent.showHood,
      },
    };
  }

  async getCurrentCombat(userId: string) {
    const { start, end } = this.todayBounds();
    const combat = await this.combatRepo.findOne({
      where: { userId, status: 'in_progress', foughtAt: Between(start, end) },
    });
    if (!combat) return null;

    const opponents = await this.avatarService.findAll();
    const opponent  = opponents.find(a => a.userId === combat.opponentId);

    return {
      combatId:          combat.id,
      userHp:            combat.userHpStart,
      opponentHp:        combat.opponentHpStart,
      userHpCurrent:     combat.userHpCurrent,
      opponentHpCurrent: combat.opponentHpCurrent,
      turnsPlayed:       combat.turns.length,
      opponentPseudo:    opponent?.user?.pseudo ?? 'Inconnu',
      opponentStats: opponent ? {
        strength:     opponent.strength,
        agility:      opponent.agility,
        endurance:    opponent.endurance,
        intelligence: opponent.intelligence,
        spirit:       opponent.spirit,
        vitality:     opponent.vitality,
        level:        opponent.level,
      } : null,
      opponentAvatar: opponent ? {
        silhouette: opponent.silhouette,
        skinTone:   opponent.skinTone,
        hairStyle:  opponent.hairStyle,
        hairColor:  opponent.hairColor,
        heroClass:  opponent.heroClass,
        showHood:   opponent.showHood,
      } : null,
    };
  }

  async playTurn(userId: string, combatId: string, playerAction: string) {
    const combat = await this.combatRepo.findOne({ where: { id: combatId, userId } });
    if (!combat) throw new NotFoundException('Combat introuvable.');
    if (combat.status !== 'in_progress') throw new BadRequestException('Ce combat est déjà terminé.');
    if (combat.turns.length >= 10) throw new BadRequestException('Le combat a atteint la limite de 10 tours.');

    const userAvatar     = await this.avatarService.findByUserId(userId);
    const opponentAvatar = await this.avatarService.findByUserId(combat.opponentId);

    const opponentAction = this.pickOpponentAction(opponentAvatar);
    const playerCrit     = this.isCrit(userAvatar.agility);
    const opponentCrit   = this.isCrit(opponentAvatar.agility);

    const { playerDmg, opponentDmg } = this.resolveExchange(
      playerAction, opponentAction,
      userAvatar, opponentAvatar,
      playerCrit, opponentCrit,
    );

    combat.userHpCurrent     = Math.max(combat.userHpCurrent     - playerDmg,   0);
    combat.opponentHpCurrent = Math.max(combat.opponentHpCurrent - opponentDmg, 0);

    const turnLog: TurnLog = {
      turn:               combat.turns.length + 1,
      playerAction,
      opponentAction,
      playerCrit,
      opponentCrit,
      playerDamageDealt:   opponentDmg,
      opponentDamageDealt: playerDmg,
      playerHpAfter:       combat.userHpCurrent,
      opponentHpAfter:     combat.opponentHpCurrent,
    };
    combat.turns = [...combat.turns, turnLog];

    const finished = combat.userHpCurrent <= 0 || combat.opponentHpCurrent <= 0 || combat.turns.length >= 10;

    if (finished) {
      const playerWon = combat.userHpCurrent >= combat.opponentHpCurrent;
      combat.status       = 'finished';
      combat.winnerId     = playerWon ? userId : combat.opponentId;
      combat.userHpEnd    = combat.userHpCurrent;
      combat.opponentHpEnd = combat.opponentHpCurrent;
      combat.pointsGained = playerWon ? 30 : 10;
      await this.combatRepo.save(combat);
      await this.updateWeeklyRank(userId, playerWon, combat.pointsGained, combat.weekNumber, combat.year);
      await this.rankService.addPoints(userId, combat.pointsGained);
    } else {
      await this.combatRepo.save(combat);
    }

    return {
      turn:           turnLog,
      playerHp:       combat.userHpCurrent,
      opponentHp:     combat.opponentHpCurrent,
      finished,
      won:            finished ? combat.winnerId === userId : null,
      pointsGained:   finished ? combat.pointsGained : null,
    };
  }

  private async updateWeeklyRank(userId: string, won: boolean, points: number, weekNumber: number, year: number) {
    let rank = await this.rankRepo.findOne({ where: { userId, weekNumber, year } });
    if (!rank) {
      rank = this.rankRepo.create({ userId, weekNumber, year, wins: 0, losses: 0, totalPoints: 0 });
    }
    if (won) rank.wins++; else rank.losses++;
    rank.totalPoints += points;
    await this.rankRepo.save(rank);
  }

  async getWeeklyRanking() {
    const { weekNumber, year } = this.getWeekNumber();
    const ranks = await this.rankRepo.find({
      where: { weekNumber, year },
      order: { totalPoints: 'DESC' },
    });
    // Charge tous les avatars en une seule requête pour éviter le N+1
    const avatars = await this.avatarService.findAll();
    return ranks.map((r) => {
      const avatar = avatars.find(a => a.userId === r.userId);
      return { ...r, pseudo: avatar?.user?.pseudo ?? r.userId.slice(0, 8) };
    });
  }

  // Chaque lundi à 00:00 UTC — annule les combats in_progress non terminés puis calcule les placements
  @Cron('0 0 * * 1')
  async closeWeek() {
    const now  = new Date();
    const prev = new Date(now);
    prev.setDate(prev.getDate() - 7);

    // Annulation des combats in_progress de la semaine écoulée (forfait sans points)
    const prevStart = new Date(prev); prevStart.setHours(0, 0, 0, 0);
    prevStart.setDate(prevStart.getDate() - ((prevStart.getDay() + 6) % 7));
    const prevEnd = new Date(prevStart); prevEnd.setDate(prevEnd.getDate() + 6); prevEnd.setHours(23, 59, 59, 999);

    const stale = await this.combatRepo.find({
      where: { status: 'in_progress', foughtAt: Between(prevStart, prevEnd) },
    });
    for (const c of stale) {
      c.status      = 'finished';
      c.winnerId    = c.opponentId;
      c.userHpEnd   = 0;
      c.opponentHpEnd = c.opponentHpCurrent;
    }
    if (stale.length) await this.combatRepo.save(stale);

    const { weekNumber, year } = this.getWeekNumber(prev);

    const ranks = await this.rankRepo.find({
      where: { weekNumber, year },
      order: { totalPoints: 'DESC' },
    });

    for (let i = 0; i < ranks.length; i++) {
      ranks[i].placement = i + 1;
    }
    await this.rankRepo.save(ranks);
  }
}
