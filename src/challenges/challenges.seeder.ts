import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChallengeCatalog, ChallengeType } from './entities/challenge-catalog.entity';
import { StatName } from '../common/enums/stat-name.enum';

@Injectable()
export class ChallengesSeeder implements OnModuleInit {
  constructor(
    @InjectRepository(ChallengeCatalog)
    private readonly repo: Repository<ChallengeCatalog>,
  ) {}

  async onModuleInit() {
    const count = await this.repo.count();
    if (count > 0) return;

    const challenges: Partial<ChallengeCatalog>[] = [
      // FORCE — objectif (10)
      { stat: StatName.STRENGTH, type: ChallengeType.OBJECTIVE, title: '20 pompes consécutives',    description: 'Réalise 20 pompes sans pause, bras tendus à chaque répétition.',                    weekSlot: 0 },
      { stat: StatName.STRENGTH, type: ChallengeType.OBJECTIVE, title: '30 squats',                 description: 'Réalise 30 squats, cuisses parallèles au sol à chaque descente.',                   weekSlot: 1 },
      { stat: StatName.STRENGTH, type: ChallengeType.OBJECTIVE, title: '15 dips sur chaise',        description: 'Pose les mains sur le bord d\'une chaise derrière toi et réalise 15 dips.',         weekSlot: 2 },
      { stat: StatName.STRENGTH, type: ChallengeType.OBJECTIVE, title: '40 montées de genoux',      description: 'Lève les genoux alternativement jusqu\'à la hauteur des hanches, 40 fois.',         weekSlot: 3 },
      { stat: StatName.STRENGTH, type: ChallengeType.OBJECTIVE, title: '25 fentes alternées',       description: 'Réalise 25 fentes en alternant jambe gauche et droite.',                            weekSlot: 4 },
      { stat: StatName.STRENGTH, type: ChallengeType.OBJECTIVE, title: '10 burpees',                description: 'Réalise 10 burpees complets : squat → planche → pompe → saut.',                    weekSlot: 5 },
      { stat: StatName.STRENGTH, type: ChallengeType.OBJECTIVE, title: '20 extensions de triceps',  description: 'Mains sur le bord d\'une chaise, réalise 20 extensions de triceps.',                weekSlot: 6 },
      { stat: StatName.STRENGTH, type: ChallengeType.OBJECTIVE, title: '50 sauts en étoile',        description: 'Réalise 50 jumping jacks (sauts avec écart des bras et des jambes).',              weekSlot: 7 },
      { stat: StatName.STRENGTH, type: ChallengeType.OBJECTIVE, title: '30 relevés de buste',       description: 'Allongé sur le dos, réalise 30 crunchs abdominaux.',                               weekSlot: 8 },
      { stat: StatName.STRENGTH, type: ChallengeType.OBJECTIVE, title: '20 pompes diamant',         description: 'Pompes avec les mains formant un triangle sous la poitrine, 20 répétitions.',      weekSlot: 9 },

      // AGILITÉ — minuté (10)
      { stat: StatName.AGILITY, type: ChallengeType.TIMED, title: 'Équilibre un pied (60s)',        description: 'Tiens en équilibre sur un seul pied, yeux fermés.',                                 targetSeconds: 60,  weekSlot: 0 },
      { stat: StatName.AGILITY, type: ChallengeType.TIMED, title: 'Squat statique (45s)',           description: 'Descends en position de squat et maintiens sans bouger.',                           targetSeconds: 45,  weekSlot: 1 },
      { stat: StatName.AGILITY, type: ChallengeType.TIMED, title: 'Équilibre sur pointes (30s)',    description: 'Monte sur la pointe des pieds et maintiens l\'équilibre.',                          targetSeconds: 30,  weekSlot: 2 },
      { stat: StatName.AGILITY, type: ChallengeType.TIMED, title: 'Position de l\'arbre (60s)',     description: 'Pose le pied à l\'intérieur de la cuisse et lève les bras.',                        targetSeconds: 60,  weekSlot: 3 },
      { stat: StatName.AGILITY, type: ChallengeType.TIMED, title: 'Pieds joints yeux fermés (30s)', description: 'Debout, pieds joints, ferme les yeux et garde l\'équilibre.',                      targetSeconds: 30,  weekSlot: 4 },
      { stat: StatName.AGILITY, type: ChallengeType.TIMED, title: 'Gainage latéral (30s)',          description: 'Position de gainage sur le côté, bras tendu, maintiens.',                          targetSeconds: 30,  weekSlot: 5 },
      { stat: StatName.AGILITY, type: ChallengeType.TIMED, title: 'Flexion genou avant (45s)',      description: 'Plie un genou vers l\'avant et maintiens sans poser le pied.',                      targetSeconds: 45,  weekSlot: 6 },
      { stat: StatName.AGILITY, type: ChallengeType.TIMED, title: 'Équilibre sur talon (30s)',      description: 'Soulève les orteils, reste sur les talons, maintiens.',                            targetSeconds: 30,  weekSlot: 7 },
      { stat: StatName.AGILITY, type: ChallengeType.TIMED, title: 'Position basse stable (60s)',    description: 'Pieds écartés, descends en position basse et maintiens.',                          targetSeconds: 60,  weekSlot: 8 },
      { stat: StatName.AGILITY, type: ChallengeType.TIMED, title: 'Genou levé à 90° (45s)',         description: 'Un pied au sol, l\'autre genou levé à 90°, bras tendus.',                          targetSeconds: 45,  weekSlot: 9 },

      // ENDURANCE — minuté (10)
      { stat: StatName.ENDURANCE, type: ChallengeType.TIMED, title: 'Planche (90s)',                description: 'Position de gainage face au sol, sur les coudes ou bras tendus.',                   targetSeconds: 90,  weekSlot: 0 },
      { stat: StatName.ENDURANCE, type: ChallengeType.TIMED, title: 'Chaise murale (60s)',          description: 'Dos contre le mur, cuisses parallèles au sol, maintiens.',                         targetSeconds: 60,  weekSlot: 1 },
      { stat: StatName.ENDURANCE, type: ChallengeType.TIMED, title: 'Marche sur place (3min)',      description: 'Marche sur place à rythme modéré pendant 3 minutes.',                             targetSeconds: 180, weekSlot: 2 },
      { stat: StatName.ENDURANCE, type: ChallengeType.TIMED, title: 'Gainage frontal (2min)',       description: 'Tiens la position de planche frontale 2 minutes sans pause.',                       targetSeconds: 120, weekSlot: 3 },
      { stat: StatName.ENDURANCE, type: ChallengeType.TIMED, title: 'Squat pulsé (60s)',            description: 'En position squat bas, effectue de petits mouvements de haut en bas.',             targetSeconds: 60,  weekSlot: 4 },
      { stat: StatName.ENDURANCE, type: ChallengeType.TIMED, title: 'Stepping (2min)',              description: 'Monte et descends d\'une marche ou d\'un livre épais pendant 2 minutes.',          targetSeconds: 120, weekSlot: 5 },
      { stat: StatName.ENDURANCE, type: ChallengeType.TIMED, title: 'Gainage oblique (45s)',        description: 'Gainage latéral sur l\'avant-bras, corps droit, maintiens.',                       targetSeconds: 45,  weekSlot: 6 },
      { stat: StatName.ENDURANCE, type: ChallengeType.TIMED, title: 'Course sur place (2min)',      description: 'Court sur place en levant les genoux à rythme rapide.',                            targetSeconds: 120, weekSlot: 7 },
      { stat: StatName.ENDURANCE, type: ChallengeType.TIMED, title: 'Superman (60s)',               description: 'Allongé sur le ventre, lève bras et jambes simultanément et maintiens.',          targetSeconds: 60,  weekSlot: 8 },
      { stat: StatName.ENDURANCE, type: ChallengeType.TIMED, title: 'Squat isométrique (90s)',      description: 'Cuisses à 90° sans appui mural, maintiens pendant 90 secondes.',                  targetSeconds: 90,  weekSlot: 9 },

      // INTELLIGENCE — quiz IA (5)
      { stat: StatName.INTELLIGENCE, type: ChallengeType.QUIZ_IA, title: 'Quiz Géographie',        description: '5 questions sur la géographie mondiale.',                                          weekSlot: 0 },
      { stat: StatName.INTELLIGENCE, type: ChallengeType.QUIZ_IA, title: 'Quiz Histoire',          description: '5 questions sur les grands événements historiques.',                             weekSlot: 1 },
      { stat: StatName.INTELLIGENCE, type: ChallengeType.QUIZ_IA, title: 'Quiz Sciences',          description: '5 questions sur les sciences naturelles et physiques.',                          weekSlot: 2 },
      { stat: StatName.INTELLIGENCE, type: ChallengeType.QUIZ_IA, title: 'Quiz Art & Culture',     description: '5 questions sur l\'art, la musique et la culture mondiale.',                     weekSlot: 3 },
      { stat: StatName.INTELLIGENCE, type: ChallengeType.QUIZ_IA, title: 'Quiz Sport',             description: '5 questions sur le sport et les jeux olympiques.',                              weekSlot: 4 },
      { stat: StatName.INTELLIGENCE, type: ChallengeType.QUIZ_IA, title: 'Quiz Cinéma',            description: '5 questions sur le cinéma et les réalisateurs célèbres.',                       weekSlot: 5 },
      { stat: StatName.INTELLIGENCE, type: ChallengeType.QUIZ_IA, title: 'Quiz Littérature',       description: '5 questions sur les auteurs et œuvres littéraires.',                            weekSlot: 6 },
      { stat: StatName.INTELLIGENCE, type: ChallengeType.QUIZ_IA, title: 'Quiz Technologie',       description: '5 questions sur les inventions et la technologie moderne.',                     weekSlot: 7 },
      { stat: StatName.INTELLIGENCE, type: ChallengeType.QUIZ_IA, title: 'Quiz Nature',            description: '5 questions sur les animaux, plantes et écosystèmes.',                         weekSlot: 8 },
      { stat: StatName.INTELLIGENCE, type: ChallengeType.QUIZ_IA, title: 'Quiz Gastronomie',       description: '5 questions sur la cuisine du monde et la gastronomie.',                        weekSlot: 9 },

      // ESPRIT — énigmes IA (10)
      { stat: StatName.SPIRIT, type: ChallengeType.ENIGMA_IA, title: 'Énigmes classiques',         description: '2 énigmes de logique et de réflexion.',                                           weekSlot: 0 },
      { stat: StatName.SPIRIT, type: ChallengeType.ENIGMA_IA, title: 'Énigmes d\'objets',          description: '2 devinettes sur des objets du quotidien.',                                       weekSlot: 1 },
      { stat: StatName.SPIRIT, type: ChallengeType.ENIGMA_IA, title: 'Énigmes de nature',          description: '2 énigmes sur les phénomènes naturels.',                                         weekSlot: 2 },
      { stat: StatName.SPIRIT, type: ChallengeType.ENIGMA_IA, title: 'Énigmes mathématiques',      description: '2 devinettes à résoudre par le raisonnement logique.',                            weekSlot: 3 },
      { stat: StatName.SPIRIT, type: ChallengeType.ENIGMA_IA, title: 'Énigmes de temps',           description: '2 énigmes sur le temps, les saisons et les cycles.',                             weekSlot: 4 },
      { stat: StatName.SPIRIT, type: ChallengeType.ENIGMA_IA, title: 'Énigmes de langage',         description: '2 devinettes jouant sur les mots et le sens.',                                   weekSlot: 5 },
      { stat: StatName.SPIRIT, type: ChallengeType.ENIGMA_IA, title: 'Énigmes de lumière',         description: '2 énigmes sur la lumière, les ombres et la vision.',                            weekSlot: 6 },
      { stat: StatName.SPIRIT, type: ChallengeType.ENIGMA_IA, title: 'Énigmes d\'eau',             description: '2 devinettes sur l\'eau, les océans et la pluie.',                              weekSlot: 7 },
      { stat: StatName.SPIRIT, type: ChallengeType.ENIGMA_IA, title: 'Énigmes de feu',             description: '2 énigmes sur le feu, la chaleur et la lumière.',                               weekSlot: 8 },
      { stat: StatName.SPIRIT, type: ChallengeType.ENIGMA_IA, title: 'Énigmes de vent',            description: '2 devinettes sur le vent, l\'air et le souffle.',                               weekSlot: 9 },

      // VITALITÉ — objectif (10)
      { stat: StatName.VITALITY, type: ChallengeType.OBJECTIVE, title: '5 minutes de méditation',  description: 'Assieds-toi confortablement, ferme les yeux, concentre-toi sur ta respiration.',  weekSlot: 0 },
      { stat: StatName.VITALITY, type: ChallengeType.OBJECTIVE, title: '10 respirations profondes', description: 'Inspire 4s, retiens 4s, expire 8s. Répète 10 fois.',                             weekSlot: 1 },
      { stat: StatName.VITALITY, type: ChallengeType.OBJECTIVE, title: 'Étirements (5min)',         description: 'Étire le cou, les épaules, le dos et les jambes — 5 minutes.',                   weekSlot: 2 },
      { stat: StatName.VITALITY, type: ChallengeType.OBJECTIVE, title: 'Marche de 10 minutes',     description: 'Fais une marche à l\'extérieur ou en intérieur d\'au moins 10 minutes.',         weekSlot: 3 },
      { stat: StatName.VITALITY, type: ChallengeType.OBJECTIVE, title: 'Boire 2 grands verres d\'eau', description: 'Bois 2 grands verres d\'eau de suite, lentement et consciemment.',           weekSlot: 4 },
      { stat: StatName.VITALITY, type: ChallengeType.OBJECTIVE, title: 'Posture parfaite (5min)',   description: 'Tiens-toi droit, épaules en arrière, pendant 5 minutes de suite.',               weekSlot: 5 },
      { stat: StatName.VITALITY, type: ChallengeType.OBJECTIVE, title: 'Sourire 1 minute',         description: 'Souris de manière consciente pendant 1 minute complète.',                        weekSlot: 6 },
      { stat: StatName.VITALITY, type: ChallengeType.OBJECTIVE, title: '5 poses de yoga',          description: 'Chien tête en bas, cobra, arbre, guerrier I, enfant — enchaîne les 5 poses.',    weekSlot: 7 },
      { stat: StatName.VITALITY, type: ChallengeType.OBJECTIVE, title: 'Cohérence cardiaque',      description: 'Respire à 6 cycles/minute (5s inspiration, 5s expiration) pendant 5 minutes.',   weekSlot: 8 },
      { stat: StatName.VITALITY, type: ChallengeType.OBJECTIVE, title: 'Massage des mains (2min)', description: 'Masse chaque main et chaque doigt — 1 minute par main.',                         weekSlot: 9 },
    ];

    await this.repo.save(challenges.map(c => this.repo.create(c)));
  }
}
