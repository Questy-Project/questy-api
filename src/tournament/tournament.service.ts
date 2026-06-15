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
}
