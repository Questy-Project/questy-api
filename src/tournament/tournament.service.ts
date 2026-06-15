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
  ) {}

  // Calcul du numéro de semaine ISO (1–52/53)
  private getWeekNumber(): { weekNumber: number; year: number } {
    const d    = new Date();
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day  = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil((((date.valueOf() - yearStart.valueOf()) / 86400000) + 1) / 7);
    return { weekNumber, year: date.getUTCFullYear() };
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

    return {
      canFightToday: foughtToday === 0,
      combatsThisWeek: weekCombats,
      combatsRemainingThisWeek: Math.max(7 - weekCombats, 0),
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

    const weekStart = new Date(); weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6); weekEnd.setHours(23, 59, 59, 999);

    const weekCombats = await this.combatRepo.count({
      where: { userId, foughtAt: Between(weekStart, weekEnd) },
    });
    if (weekCombats >= 7) throw new BadRequestException('Tu as atteint le maximum de 7 combats cette semaine.');

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

  // Chaque lundi à 00:00 UTC — calcule les placements de la semaine écoulée
  @Cron('0 0 * * 1')
  async closeWeek() {
    const now  = new Date();
    const prev = new Date(now);
    prev.setDate(prev.getDate() - 7);

    const d    = new Date(Date.UTC(prev.getFullYear(), prev.getMonth(), prev.getDate()));
    const day  = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil((((d.valueOf() - yearStart.valueOf()) / 86400000) + 1) / 7);
    const year = d.getUTCFullYear();

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
