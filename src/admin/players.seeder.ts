import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Avatar } from '../avatar/entities/avatar.entity';
import { Part } from '../parts/entities/parts.entity';
import { MonthlyRank, RankTier } from '../rank/entities/monthly-rank.entity';
import { TournamentWeeklyRank } from '../tournament/entities/tournament-weekly-rank.entity';

// xp cumulé correspondant à `stat` points sur la courbe logarithmique (A=23, B=0.015)
function statToXp(stat: number): number {
  if (stat === 0) return 0;
  return (Math.exp(stat / 23) - 1) / 0.015;
}

// Niveau correspondant à un XP total
function computeLevel(xp: number): number {
  let level = 1;
  while (xp >= ((level * (level + 1)) / 2) * 100) level++;
  return level;
}

interface PlayerTemplate {
  heroClass: string;
  silhouette: 'A' | 'B';
  strength: number; agility: number; endurance: number;
  intelligence: number; spirit: number; vitality: number;
  totalXp: number;
}

// 10 archétypes couvrant toutes les classes — stats adaptées à chaque rôle
const ARCHETYPES: PlayerTemplate[] = [
  { heroClass: 'Guerrier',     silhouette: 'A', strength: 75, agility: 30, endurance: 50, intelligence: 10, spirit: 8,  vitality: 40, totalXp: 3500 },
  { heroClass: 'Voleur',       silhouette: 'A', strength: 25, agility: 78, endurance: 30, intelligence: 20, spirit: 12, vitality: 22, totalXp: 2800 },
  { heroClass: 'Tank',         silhouette: 'A', strength: 35, agility: 15, endurance: 80, intelligence: 8,  spirit: 10, vitality: 65, totalXp: 3200 },
  { heroClass: 'Mage',         silhouette: 'B', strength: 8,  agility: 20, endurance: 15, intelligence: 82, spirit: 45, vitality: 10, totalXp: 3800 },
  { heroClass: 'Prêtre',       silhouette: 'B', strength: 10, agility: 18, endurance: 25, intelligence: 40, spirit: 79, vitality: 28, totalXp: 2900 },
  { heroClass: 'Paladin',      silhouette: 'A', strength: 40, agility: 20, endurance: 55, intelligence: 15, spirit: 30, vitality: 72, totalXp: 3100 },
  { heroClass: 'Berserker',    silhouette: 'A', strength: 68, agility: 72, endurance: 35, intelligence: 5,  spirit: 5,  vitality: 28, totalXp: 4000 },
  { heroClass: 'Mage de guerre', silhouette: 'B', strength: 60, agility: 22, endurance: 28, intelligence: 65, spirit: 20, vitality: 18, totalXp: 3600 },
  { heroClass: 'Druide',       silhouette: 'B', strength: 20, agility: 25, endurance: 62, intelligence: 30, spirit: 68, vitality: 35, totalXp: 3300 },
  { heroClass: 'Sage lettré',  silhouette: 'B', strength: 5,  agility: 12, endurance: 18, intelligence: 70, spirit: 72, vitality: 15, totalXp: 3700 },
];

const PSEUDOS = [
  'Aldric','Béatrix','Cormac','Delphine','Edric','Fayne','Gorin','Hélia',
  'Isvan','Joëlle','Karan','Liora','Malgorn','Nessa','Oswin','Perrine',
  'Quentin','Rowena','Soran','Tilda','Ulric','Valdis','Wynn','Xael','Ysolde',
  'Zoran','Bréhanne','Caelion','Dawnyr','Elara','Fenrick','Gwynna','Halvard',
  'Isolde','Jareth','Keira','Loric','Mirwen','Nailor','Orwen','Pyrrha',
  'Quenthal','Rindel','Sienna','Theron','Umbre','Varlyn','Westan','Xira',
  'Yriel','Zelindra','Aelion','Brunhild','Celdwyn','Daeva','Eskar','Fyona',
  'Grindal','Helvor','Inara','Jorath','Kelwyn','Lira','Mordecai','Nimue',
  'Orath','Phaedra','Quinlan','Rythe','Seldak','Thessa','Urwen','Vael',
  'Wulfric','Xandrel','Yona','Zephyrine','Arnulf','Bríana','Corvin','Dyriel',
  'Elwyn','Fenella','Gorvald','Haida','Imrath','Jorwen','Kelvyn','Lysara',
  'Morryn','Nireth','Oskar','Pellen','Quorra','Rael','Sydra','Telwyn',
  'Undriel','Vrynn','Weslan','Xyra','Yswyn','Zeldris',
];

@Injectable()
export class PlayersSeeder implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Avatar)
    private readonly avatarRepo: Repository<Avatar>,
    @InjectRepository(Part)
    private readonly partRepo: Repository<Part>,
    @InjectRepository(MonthlyRank)
    private readonly rankRepo: Repository<MonthlyRank>,
    @InjectRepository(TournamentWeeklyRank)
    private readonly weeklyRankRepo: Repository<TournamentWeeklyRank>,
  ) {}

  async onModuleInit() {
    if (process.env.NODE_ENV === 'production') return;
    const exists = await this.userRepo.findOne({ where: { email: 'player001@questy.seed' } });
    if (exists) return;
    await this.seedPlayers();
  }

  private getWeekNumber(): { weekNumber: number; year: number } {
    const d    = new Date();
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day  = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - day);
    const yearStart  = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil((((date.valueOf() - yearStart.valueOf()) / 86400000) + 1) / 7);
    return { weekNumber, year: date.getUTCFullYear() };
  }

  private async seedPlayers() {
    const hashed = await bcrypt.hash('Password123!', 10);
    const now    = new Date();
    const month  = now.getMonth() + 1;
    const year   = now.getFullYear();
    const { weekNumber, year: weekYear } = this.getWeekNumber();

    // Distribution des points : 10 LEGEND / 15 GOLD / 25 SILVER / 50 BRONZE
    const pointsForIndex = (i: number): number => {
      if (i < 10)  return 150 + (i * 6);       // 150–204 — LEGEND (top 10%)
      if (i < 25)  return 100 + ((i - 10) * 3); // 100–142 — GOLD (11-25%)
      if (i < 50)  return 50  + ((i - 25) * 2); // 50–98   — SILVER (26-50%)
      return Math.max(5, 49 - (i - 50));         // 5–49    — BRONZE (51-100%)
    };

    const tierForPoints = (pts: number): RankTier => {
      if (pts >= 150) return RankTier.LEGEND;
      if (pts >= 100) return RankTier.GOLD;
      if (pts >= 50)  return RankTier.SILVER;
      return RankTier.BRONZE;
    };

    for (let i = 0; i < 100; i++) {
      const num      = String(i + 1).padStart(3, '0');
      const pseudo   = PSEUDOS[i] ?? `Joueur${num}`;
      const email    = `player${num}@questy.seed`;
      const archetype = ARCHETYPES[i % ARCHETYPES.length];

      // Variation légère des stats (+/-15 pts selon position dans la liste)
      const vary = (base: number, delta: number): number =>
        Math.min(100, Math.max(0, base + Math.round((((i * 37 + delta) % 31) - 15))));

      const str  = vary(archetype.strength,     1);
      const agi  = vary(archetype.agility,       7);
      const end  = vary(archetype.endurance,    13);
      const inte = vary(archetype.intelligence, 19);
      const spi  = vary(archetype.spirit,       23);
      const vit  = vary(archetype.vitality,     29);
      const xp   = archetype.totalXp + (i * 43 % 800);

      const user = await this.userRepo.save(
        this.userRepo.create({ pseudo, email, password: hashed }),
      );

      await this.avatarRepo.save(
        this.avatarRepo.create({
          userId:         user.id,
          level:          computeLevel(xp),
          xp,
          heroClass:      archetype.heroClass,
          silhouette:     archetype.silhouette,
          skinTone:       (i % 4) + 1,
          hairStyle:      (i % 5) + 1,
          hairColor:      (i % 4) + 1,
          showHood:       i % 7 === 0,
          strength:     str,  strengthXp:     statToXp(str),
          agility:      agi,  agilityXp:      statToXp(agi),
          endurance:    end,  enduranceXp:    statToXp(end),
          intelligence: inte, intelligenceXp: statToXp(inte),
          spirit:       spi,  spiritXp:       statToXp(spi),
          vitality:     vit,  vitalityXp:     statToXp(vit),
        }),
      );

      await this.partRepo.save(
        this.partRepo.create({ userId: user.id, stock: i % 12 }),
      );

      const pts = pointsForIndex(i);
      await this.rankRepo.save(
        this.rankRepo.create({
          userId:      user.id,
          month,
          year,
          totalPoints: pts,
          tier:        tierForPoints(pts),
          coinsEarned: 0,
        }),
      );

      // Classement hebdomadaire : wins + losses cohérents avec les points mensuels
      const wins   = Math.min(7, Math.floor(pts / 30));
      const losses = Math.min(7 - wins, Math.floor((pts - wins * 30) / 10));
      const weekPts = wins * 30 + losses * 10;
      await this.weeklyRankRepo.save(
        this.weeklyRankRepo.create({
          userId:      user.id,
          weekNumber,
          year:        weekYear,
          wins,
          losses,
          totalPoints: weekPts,
          claimedSlots: wins + losses,
          lastClaimDate: null,
        }),
      );
    }
  }
}
