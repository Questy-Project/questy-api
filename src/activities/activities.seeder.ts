import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './entities/activity.entity';
import { StatName } from '../common/enums/stat-name.enum';

@Injectable()
export class ActivitiesSeeder implements OnModuleInit {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  async onModuleInit() {
    const count = await this.activityRepository.count();
    if (count > 0) return;

    const activities = [
      // Course et marche
      { name: 'Course à pied', category: 'Course', statPrimary: StatName.ENDURANCE, statSecondary: StatName.VITALITY, xpMultiplier: 1.2 },
      { name: 'Jogging', category: 'Course', statPrimary: StatName.ENDURANCE, statSecondary: StatName.VITALITY, xpMultiplier: 1.0 },
      { name: 'Sprint', category: 'Course', statPrimary: StatName.AGILITY, statSecondary: StatName.STRENGTH, xpMultiplier: 1.3 },
      { name: 'Marathon', category: 'Course', statPrimary: StatName.ENDURANCE, statSecondary: StatName.SPIRIT, xpMultiplier: 1.5 },
      { name: 'Trail running', category: 'Course', statPrimary: StatName.ENDURANCE, statSecondary: StatName.AGILITY, xpMultiplier: 1.3 },
      { name: 'Marche rapide', category: 'Course', statPrimary: StatName.ENDURANCE, statSecondary: StatName.VITALITY, xpMultiplier: 0.8 },
      { name: 'Randonnée', category: 'Course', statPrimary: StatName.ENDURANCE, statSecondary: StatName.VITALITY, xpMultiplier: 1.0 },
      { name: 'Marche nordique', category: 'Course', statPrimary: StatName.ENDURANCE, statSecondary: StatName.STRENGTH, xpMultiplier: 0.9 },
      { name: 'Course sur tapis', category: 'Course', statPrimary: StatName.ENDURANCE, xpMultiplier: 0.9 },
      { name: 'Ultra-trail', category: 'Course', statPrimary: StatName.ENDURANCE, statSecondary: StatName.SPIRIT, xpMultiplier: 1.8 },

      // Cyclisme
      { name: 'Vélo de route', category: 'Cyclisme', statPrimary: StatName.ENDURANCE, statSecondary: StatName.AGILITY, xpMultiplier: 1.1 },
      { name: 'VTT', category: 'Cyclisme', statPrimary: StatName.ENDURANCE, statSecondary: StatName.AGILITY, xpMultiplier: 1.2 },
      { name: 'Cyclisme sur piste', category: 'Cyclisme', statPrimary: StatName.ENDURANCE, statSecondary: StatName.AGILITY, xpMultiplier: 1.2 },
      { name: 'Vélo en salle', category: 'Cyclisme', statPrimary: StatName.ENDURANCE, xpMultiplier: 0.9 },
      { name: 'BMX', category: 'Cyclisme', statPrimary: StatName.AGILITY, statSecondary: StatName.STRENGTH, xpMultiplier: 1.3 },
      { name: 'Vélo de ville', category: 'Cyclisme', statPrimary: StatName.ENDURANCE, xpMultiplier: 0.7 },

      // Natation et sports nautiques
      { name: 'Natation', category: 'Natation', statPrimary: StatName.ENDURANCE, statSecondary: StatName.VITALITY, xpMultiplier: 1.2 },
      { name: 'Natation synchronisée', category: 'Natation', statPrimary: StatName.AGILITY, statSecondary: StatName.SPIRIT, xpMultiplier: 1.1 },
      { name: 'Water polo', category: 'Natation', statPrimary: StatName.ENDURANCE, statSecondary: StatName.STRENGTH, xpMultiplier: 1.2 },
      { name: 'Plongée sous-marine', category: 'Natation', statPrimary: StatName.VITALITY, statSecondary: StatName.SPIRIT, xpMultiplier: 1.0 },
      { name: 'Surf', category: 'Sports nautiques', statPrimary: StatName.AGILITY, statSecondary: StatName.ENDURANCE, xpMultiplier: 1.3 },
      { name: 'Kayak', category: 'Sports nautiques', statPrimary: StatName.ENDURANCE, statSecondary: StatName.STRENGTH, xpMultiplier: 1.1 },
      { name: 'Aviron', category: 'Sports nautiques', statPrimary: StatName.ENDURANCE, statSecondary: StatName.STRENGTH, xpMultiplier: 1.3 },
      { name: 'Voile', category: 'Sports nautiques', statPrimary: StatName.AGILITY, statSecondary: StatName.INTELLIGENCE, xpMultiplier: 1.0 },
      { name: 'Kitesurf', category: 'Sports nautiques', statPrimary: StatName.AGILITY, statSecondary: StatName.ENDURANCE, xpMultiplier: 1.4 },
      { name: 'Canoë', category: 'Sports nautiques', statPrimary: StatName.ENDURANCE, statSecondary: StatName.STRENGTH, xpMultiplier: 1.1 },

      // Musculation et fitness
      { name: 'Musculation', category: 'Fitness', statPrimary: StatName.STRENGTH, statSecondary: StatName.VITALITY, xpMultiplier: 1.3 },
      { name: 'Crossfit', category: 'Fitness', statPrimary: StatName.STRENGTH, statSecondary: StatName.ENDURANCE, xpMultiplier: 1.4 },
      { name: 'Powerlifting', category: 'Fitness', statPrimary: StatName.STRENGTH, xpMultiplier: 1.4 },
      { name: 'Haltérophilie', category: 'Fitness', statPrimary: StatName.STRENGTH, statSecondary: StatName.AGILITY, xpMultiplier: 1.4 },
      { name: 'Calisthenics', category: 'Fitness', statPrimary: StatName.STRENGTH, statSecondary: StatName.AGILITY, xpMultiplier: 1.2 },
      { name: 'HIIT', category: 'Fitness', statPrimary: StatName.ENDURANCE, statSecondary: StatName.VITALITY, xpMultiplier: 1.3 },
      { name: 'Aérobic', category: 'Fitness', statPrimary: StatName.ENDURANCE, statSecondary: StatName.VITALITY, xpMultiplier: 1.0 },
      { name: 'Zumba', category: 'Fitness', statPrimary: StatName.AGILITY, statSecondary: StatName.VITALITY, xpMultiplier: 1.0 },
      { name: 'Circuit training', category: 'Fitness', statPrimary: StatName.STRENGTH, statSecondary: StatName.ENDURANCE, xpMultiplier: 1.2 },
      { name: 'TRX', category: 'Fitness', statPrimary: StatName.STRENGTH, statSecondary: StatName.AGILITY, xpMultiplier: 1.1 },

      // Yoga et bien-être
      { name: 'Yoga', category: 'Bien-être', statPrimary: StatName.SPIRIT, statSecondary: StatName.AGILITY, xpMultiplier: 1.0 },
      { name: 'Pilates', category: 'Bien-être', statPrimary: StatName.AGILITY, statSecondary: StatName.VITALITY, xpMultiplier: 1.0 },
      { name: 'Méditation', category: 'Bien-être', statPrimary: StatName.SPIRIT, statSecondary: StatName.INTELLIGENCE, xpMultiplier: 0.8 },
      { name: 'Tai-chi', category: 'Bien-être', statPrimary: StatName.SPIRIT, statSecondary: StatName.AGILITY, xpMultiplier: 0.9 },
      { name: 'Stretching', category: 'Bien-être', statPrimary: StatName.AGILITY, statSecondary: StatName.VITALITY, xpMultiplier: 0.7 },
      { name: 'Qi gong', category: 'Bien-être', statPrimary: StatName.SPIRIT, statSecondary: StatName.VITALITY, xpMultiplier: 0.8 },

      // Sports collectifs
      { name: 'Football', category: 'Sports collectifs', statPrimary: StatName.ENDURANCE, statSecondary: StatName.AGILITY, xpMultiplier: 1.2 },
      { name: 'Basketball', category: 'Sports collectifs', statPrimary: StatName.AGILITY, statSecondary: StatName.ENDURANCE, xpMultiplier: 1.2 },
      { name: 'Volleyball', category: 'Sports collectifs', statPrimary: StatName.AGILITY, statSecondary: StatName.ENDURANCE, xpMultiplier: 1.1 },
      { name: 'Rugby', category: 'Sports collectifs', statPrimary: StatName.STRENGTH, statSecondary: StatName.ENDURANCE, xpMultiplier: 1.3 },
      { name: 'Handball', category: 'Sports collectifs', statPrimary: StatName.ENDURANCE, statSecondary: StatName.AGILITY, xpMultiplier: 1.2 },
      { name: 'Hockey sur gazon', category: 'Sports collectifs', statPrimary: StatName.ENDURANCE, statSecondary: StatName.AGILITY, xpMultiplier: 1.2 },
      { name: 'Baseball', category: 'Sports collectifs', statPrimary: StatName.AGILITY, statSecondary: StatName.STRENGTH, xpMultiplier: 1.0 },
      { name: 'Cricket', category: 'Sports collectifs', statPrimary: StatName.AGILITY, statSecondary: StatName.ENDURANCE, xpMultiplier: 1.0 },
      { name: 'Football américain', category: 'Sports collectifs', statPrimary: StatName.STRENGTH, statSecondary: StatName.AGILITY, xpMultiplier: 1.3 },
      { name: 'Lacrosse', category: 'Sports collectifs', statPrimary: StatName.ENDURANCE, statSecondary: StatName.AGILITY, xpMultiplier: 1.2 },
      { name: 'Ultimate frisbee', category: 'Sports collectifs', statPrimary: StatName.ENDURANCE, statSecondary: StatName.AGILITY, xpMultiplier: 1.1 },
      { name: 'Netball', category: 'Sports collectifs', statPrimary: StatName.AGILITY, statSecondary: StatName.ENDURANCE, xpMultiplier: 1.0 },

      // Sports de raquette
      { name: 'Tennis', category: 'Sports de raquette', statPrimary: StatName.AGILITY, statSecondary: StatName.ENDURANCE, xpMultiplier: 1.2 },
      { name: 'Badminton', category: 'Sports de raquette', statPrimary: StatName.AGILITY, statSecondary: StatName.ENDURANCE, xpMultiplier: 1.1 },
      { name: 'Squash', category: 'Sports de raquette', statPrimary: StatName.AGILITY, statSecondary: StatName.ENDURANCE, xpMultiplier: 1.3 },
      { name: 'Ping-pong', category: 'Sports de raquette', statPrimary: StatName.AGILITY, statSecondary: StatName.INTELLIGENCE, xpMultiplier: 1.0 },
      { name: 'Padel', category: 'Sports de raquette', statPrimary: StatName.AGILITY, statSecondary: StatName.ENDURANCE, xpMultiplier: 1.1 },
      { name: 'Racquetball', category: 'Sports de raquette', statPrimary: StatName.AGILITY, statSecondary: StatName.ENDURANCE, xpMultiplier: 1.2 },

      // Arts martiaux et sports de combat
      { name: 'Judo', category: 'Arts martiaux', statPrimary: StatName.STRENGTH, statSecondary: StatName.AGILITY, xpMultiplier: 1.3 },
      { name: 'Karaté', category: 'Arts martiaux', statPrimary: StatName.AGILITY, statSecondary: StatName.STRENGTH, xpMultiplier: 1.2 },
      { name: 'Taekwondo', category: 'Arts martiaux', statPrimary: StatName.AGILITY, statSecondary: StatName.STRENGTH, xpMultiplier: 1.3 },
      { name: 'Boxe anglaise', category: 'Arts martiaux', statPrimary: StatName.STRENGTH, statSecondary: StatName.ENDURANCE, xpMultiplier: 1.4 },
      { name: 'MMA', category: 'Arts martiaux', statPrimary: StatName.STRENGTH, statSecondary: StatName.ENDURANCE, xpMultiplier: 1.5 },
      { name: 'Lutte', category: 'Arts martiaux', statPrimary: StatName.STRENGTH, statSecondary: StatName.ENDURANCE, xpMultiplier: 1.3 },
      { name: 'Jiu-jitsu brésilien', category: 'Arts martiaux', statPrimary: StatName.STRENGTH, statSecondary: StatName.AGILITY, xpMultiplier: 1.3 },
      { name: 'Krav-maga', category: 'Arts martiaux', statPrimary: StatName.STRENGTH, statSecondary: StatName.AGILITY, xpMultiplier: 1.3 },
      { name: 'Aïkido', category: 'Arts martiaux', statPrimary: StatName.AGILITY, statSecondary: StatName.SPIRIT, xpMultiplier: 1.1 },
      { name: 'Escrime', category: 'Arts martiaux', statPrimary: StatName.AGILITY, statSecondary: StatName.INTELLIGENCE, xpMultiplier: 1.2 },

      // Danse
      { name: 'Danse classique', category: 'Danse', statPrimary: StatName.AGILITY, statSecondary: StatName.SPIRIT, xpMultiplier: 1.1 },
      { name: 'Hip-hop', category: 'Danse', statPrimary: StatName.AGILITY, statSecondary: StatName.VITALITY, xpMultiplier: 1.1 },
      { name: 'Salsa', category: 'Danse', statPrimary: StatName.AGILITY, statSecondary: StatName.SPIRIT, xpMultiplier: 1.0 },
      { name: 'Valse', category: 'Danse', statPrimary: StatName.AGILITY, statSecondary: StatName.SPIRIT, xpMultiplier: 0.9 },
      { name: 'Danse contemporaine', category: 'Danse', statPrimary: StatName.AGILITY, statSecondary: StatName.SPIRIT, xpMultiplier: 1.1 },
      { name: 'Breakdance', category: 'Danse', statPrimary: StatName.AGILITY, statSecondary: StatName.STRENGTH, xpMultiplier: 1.2 },
      { name: 'Tango', category: 'Danse', statPrimary: StatName.AGILITY, statSecondary: StatName.SPIRIT, xpMultiplier: 1.0 },
      { name: 'Flamenco', category: 'Danse', statPrimary: StatName.AGILITY, statSecondary: StatName.VITALITY, xpMultiplier: 1.1 },

      // Gymnastique et acrobatie
      { name: 'Gymnastique artistique', category: 'Gymnastique', statPrimary: StatName.AGILITY, statSecondary: StatName.STRENGTH, xpMultiplier: 1.3 },
      { name: 'Gymnastique rythmique', category: 'Gymnastique', statPrimary: StatName.AGILITY, statSecondary: StatName.SPIRIT, xpMultiplier: 1.1 },
      { name: 'Trampoline', category: 'Gymnastique', statPrimary: StatName.AGILITY, statSecondary: StatName.VITALITY, xpMultiplier: 1.2 },
      { name: 'Parkour', category: 'Gymnastique', statPrimary: StatName.AGILITY, statSecondary: StatName.STRENGTH, xpMultiplier: 1.4 },
      { name: 'Cheerleading', category: 'Gymnastique', statPrimary: StatName.AGILITY, statSecondary: StatName.STRENGTH, xpMultiplier: 1.2 },
      { name: 'Acrobatie', category: 'Gymnastique', statPrimary: StatName.AGILITY, statSecondary: StatName.STRENGTH, xpMultiplier: 1.3 },

      // Sports de montagne et outdoor
      { name: 'Escalade', category: 'Outdoor', statPrimary: StatName.STRENGTH, statSecondary: StatName.AGILITY, xpMultiplier: 1.3 },
      { name: 'Alpinisme', category: 'Outdoor', statPrimary: StatName.ENDURANCE, statSecondary: StatName.STRENGTH, xpMultiplier: 1.5 },
      { name: 'Ski alpin', category: 'Sports d\'hiver', statPrimary: StatName.AGILITY, statSecondary: StatName.ENDURANCE, xpMultiplier: 1.2 },
      { name: 'Snowboard', category: 'Sports d\'hiver', statPrimary: StatName.AGILITY, statSecondary: StatName.ENDURANCE, xpMultiplier: 1.2 },
      { name: 'Ski de fond', category: 'Sports d\'hiver', statPrimary: StatName.ENDURANCE, statSecondary: StatName.STRENGTH, xpMultiplier: 1.4 },
      { name: 'Raquettes à neige', category: 'Sports d\'hiver', statPrimary: StatName.ENDURANCE, statSecondary: StatName.VITALITY, xpMultiplier: 1.0 },
      { name: 'Via ferrata', category: 'Outdoor', statPrimary: StatName.STRENGTH, statSecondary: StatName.ENDURANCE, xpMultiplier: 1.2 },
      { name: 'Spéléologie', category: 'Outdoor', statPrimary: StatName.ENDURANCE, statSecondary: StatName.STRENGTH, xpMultiplier: 1.1 },

      // Sports aériens
      { name: 'Parapente', category: 'Sports aériens', statPrimary: StatName.SPIRIT, statSecondary: StatName.AGILITY, xpMultiplier: 1.2 },
      { name: 'Parachutisme', category: 'Sports aériens', statPrimary: StatName.SPIRIT, statSecondary: StatName.AGILITY, xpMultiplier: 1.3 },
      { name: 'Vol libre', category: 'Sports aériens', statPrimary: StatName.SPIRIT, statSecondary: StatName.AGILITY, xpMultiplier: 1.1 },
      { name: 'Deltaplane', category: 'Sports aériens', statPrimary: StatName.SPIRIT, statSecondary: StatName.AGILITY, xpMultiplier: 1.1 },

      // Athlétisme
      { name: 'Saut en hauteur', category: 'Athlétisme', statPrimary: StatName.AGILITY, statSecondary: StatName.STRENGTH, xpMultiplier: 1.2 },
      { name: 'Saut en longueur', category: 'Athlétisme', statPrimary: StatName.AGILITY, statSecondary: StatName.STRENGTH, xpMultiplier: 1.2 },
      { name: 'Saut à la perche', category: 'Athlétisme', statPrimary: StatName.AGILITY, statSecondary: StatName.STRENGTH, xpMultiplier: 1.3 },
      { name: 'Lancer de poids', category: 'Athlétisme', statPrimary: StatName.STRENGTH, xpMultiplier: 1.2 },
      { name: 'Lancer de javelot', category: 'Athlétisme', statPrimary: StatName.STRENGTH, statSecondary: StatName.AGILITY, xpMultiplier: 1.2 },
      { name: 'Lancer de disque', category: 'Athlétisme', statPrimary: StatName.STRENGTH, statSecondary: StatName.AGILITY, xpMultiplier: 1.2 },
      { name: 'Décathlon', category: 'Athlétisme', statPrimary: StatName.ENDURANCE, statSecondary: StatName.STRENGTH, xpMultiplier: 1.5 },
      { name: 'Marche athlétique', category: 'Athlétisme', statPrimary: StatName.ENDURANCE, statSecondary: StatName.VITALITY, xpMultiplier: 1.0 },

      // Sports d'hiver additionnels
      { name: 'Patinage artistique', category: 'Sports d\'hiver', statPrimary: StatName.AGILITY, statSecondary: StatName.SPIRIT, xpMultiplier: 1.1 },
      { name: 'Hockey sur glace', category: 'Sports d\'hiver', statPrimary: StatName.STRENGTH, statSecondary: StatName.AGILITY, xpMultiplier: 1.3 },
      { name: 'Biathlon', category: 'Sports d\'hiver', statPrimary: StatName.ENDURANCE, statSecondary: StatName.INTELLIGENCE, xpMultiplier: 1.4 },
      { name: 'Curling', category: 'Sports d\'hiver', statPrimary: StatName.AGILITY, statSecondary: StatName.INTELLIGENCE, xpMultiplier: 0.9 },
      { name: 'Luge', category: 'Sports d\'hiver', statPrimary: StatName.AGILITY, statSecondary: StatName.VITALITY, xpMultiplier: 1.1 },

      // Sports divers
      { name: 'Équitation', category: 'Sports divers', statPrimary: StatName.AGILITY, statSecondary: StatName.SPIRIT, xpMultiplier: 1.1 },
      { name: 'Tir à l\'arc', category: 'Sports divers', statPrimary: StatName.INTELLIGENCE, statSecondary: StatName.SPIRIT, xpMultiplier: 1.0 },
      { name: 'Golf', category: 'Sports divers', statPrimary: StatName.AGILITY, statSecondary: StatName.INTELLIGENCE, xpMultiplier: 0.9 },
      { name: 'Pétanque', category: 'Sports divers', statPrimary: StatName.AGILITY, statSecondary: StatName.INTELLIGENCE, xpMultiplier: 0.7 },
      { name: 'Bowling', category: 'Sports divers', statPrimary: StatName.AGILITY, statSecondary: StatName.INTELLIGENCE, xpMultiplier: 0.8 },

      // Lecture
      { name: 'Lecture roman', category: 'Lecture', statPrimary: StatName.INTELLIGENCE, statSecondary: StatName.SPIRIT, xpMultiplier: 1.0 },
      { name: 'Lecture essai', category: 'Lecture', statPrimary: StatName.INTELLIGENCE, xpMultiplier: 1.1 },
      { name: 'Lecture BD', category: 'Lecture', statPrimary: StatName.INTELLIGENCE, statSecondary: StatName.SPIRIT, xpMultiplier: 0.8 },
      { name: 'Lecture manga', category: 'Lecture', statPrimary: StatName.INTELLIGENCE, statSecondary: StatName.SPIRIT, xpMultiplier: 0.8 },
      { name: 'Lecture poésie', category: 'Lecture', statPrimary: StatName.INTELLIGENCE, statSecondary: StatName.SPIRIT, xpMultiplier: 0.9 },
      { name: 'Lecture scientifique', category: 'Lecture', statPrimary: StatName.INTELLIGENCE, xpMultiplier: 1.2 },
      { name: 'Lecture historique', category: 'Lecture', statPrimary: StatName.INTELLIGENCE, statSecondary: StatName.SPIRIT, xpMultiplier: 1.0 },
      { name: 'Lecture philosophique', category: 'Lecture', statPrimary: StatName.INTELLIGENCE, statSecondary: StatName.SPIRIT, xpMultiplier: 1.1 },

      // Jeux de réflexion
      { name: 'Échecs', category: 'Jeux de réflexion', statPrimary: StatName.INTELLIGENCE, statSecondary: StatName.SPIRIT, xpMultiplier: 1.2 },
      { name: 'Dames', category: 'Jeux de réflexion', statPrimary: StatName.INTELLIGENCE, xpMultiplier: 0.9 },
      { name: 'Go', category: 'Jeux de réflexion', statPrimary: StatName.INTELLIGENCE, statSecondary: StatName.SPIRIT, xpMultiplier: 1.2 },
      { name: 'Backgammon', category: 'Jeux de réflexion', statPrimary: StatName.INTELLIGENCE, statSecondary: StatName.AGILITY, xpMultiplier: 0.9 },
      { name: 'Scrabble', category: 'Jeux de réflexion', statPrimary: StatName.INTELLIGENCE, xpMultiplier: 1.0 },
      { name: 'Sudoku', category: 'Jeux de réflexion', statPrimary: StatName.INTELLIGENCE, xpMultiplier: 1.0 },
      { name: 'Mots croisés', category: 'Jeux de réflexion', statPrimary: StatName.INTELLIGENCE, xpMultiplier: 0.9 },
      { name: 'Puzzle', category: 'Jeux de réflexion', statPrimary: StatName.INTELLIGENCE, statSecondary: StatName.SPIRIT, xpMultiplier: 0.9 },

      // Programmation et tech
      { name: 'Programmation', category: 'Informatique', statPrimary: StatName.INTELLIGENCE, xpMultiplier: 1.3 },
      { name: 'Développement web', category: 'Informatique', statPrimary: StatName.INTELLIGENCE, xpMultiplier: 1.2 },
      { name: 'Développement mobile', category: 'Informatique', statPrimary: StatName.INTELLIGENCE, xpMultiplier: 1.2 },
      { name: 'Intelligence artificielle', category: 'Informatique', statPrimary: StatName.INTELLIGENCE, xpMultiplier: 1.3 },
      { name: 'Cybersécurité', category: 'Informatique', statPrimary: StatName.INTELLIGENCE, xpMultiplier: 1.2 },
      { name: 'Algorithmique', category: 'Informatique', statPrimary: StatName.INTELLIGENCE, xpMultiplier: 1.3 },

      // Apprentissage des langues
      { name: 'Anglais', category: 'Langues', statPrimary: StatName.INTELLIGENCE, statSecondary: StatName.SPIRIT, xpMultiplier: 1.0 },
      { name: 'Espagnol', category: 'Langues', statPrimary: StatName.INTELLIGENCE, statSecondary: StatName.SPIRIT, xpMultiplier: 1.0 },
      { name: 'Allemand', category: 'Langues', statPrimary: StatName.INTELLIGENCE, xpMultiplier: 1.0 },
      { name: 'Japonais', category: 'Langues', statPrimary: StatName.INTELLIGENCE, statSecondary: StatName.SPIRIT, xpMultiplier: 1.1 },
      { name: 'Mandarin', category: 'Langues', statPrimary: StatName.INTELLIGENCE, xpMultiplier: 1.1 },
      { name: 'Arabe', category: 'Langues', statPrimary: StatName.INTELLIGENCE, xpMultiplier: 1.1 },

      // Musique
      { name: 'Piano', category: 'Musique', statPrimary: StatName.INTELLIGENCE, statSecondary: StatName.SPIRIT, xpMultiplier: 1.1 },
      { name: 'Guitare', category: 'Musique', statPrimary: StatName.INTELLIGENCE, statSecondary: StatName.SPIRIT, xpMultiplier: 1.0 },
      { name: 'Violon', category: 'Musique', statPrimary: StatName.INTELLIGENCE, statSecondary: StatName.SPIRIT, xpMultiplier: 1.1 },
      { name: 'Batterie', category: 'Musique', statPrimary: StatName.AGILITY, statSecondary: StatName.SPIRIT, xpMultiplier: 1.0 },
      { name: 'Chant', category: 'Musique', statPrimary: StatName.SPIRIT, statSecondary: StatName.INTELLIGENCE, xpMultiplier: 1.0 },
      { name: 'Flûte', category: 'Musique', statPrimary: StatName.INTELLIGENCE, statSecondary: StatName.SPIRIT, xpMultiplier: 1.0 },
      { name: 'Saxophone', category: 'Musique', statPrimary: StatName.SPIRIT, statSecondary: StatName.INTELLIGENCE, xpMultiplier: 1.0 },
      { name: 'Ukulélé', category: 'Musique', statPrimary: StatName.INTELLIGENCE, statSecondary: StatName.SPIRIT, xpMultiplier: 0.9 },

      // Arts créatifs
      { name: 'Dessin', category: 'Arts créatifs', statPrimary: StatName.INTELLIGENCE, statSecondary: StatName.SPIRIT, xpMultiplier: 0.9 },
      { name: 'Peinture', category: 'Arts créatifs', statPrimary: StatName.SPIRIT, statSecondary: StatName.INTELLIGENCE, xpMultiplier: 0.9 },
      { name: 'Sculpture', category: 'Arts créatifs', statPrimary: StatName.STRENGTH, statSecondary: StatName.INTELLIGENCE, xpMultiplier: 1.0 },
      { name: 'Poterie', category: 'Arts créatifs', statPrimary: StatName.SPIRIT, statSecondary: StatName.INTELLIGENCE, xpMultiplier: 0.9 },
      { name: 'Photographie', category: 'Arts créatifs', statPrimary: StatName.INTELLIGENCE, statSecondary: StatName.SPIRIT, xpMultiplier: 0.9 },
      { name: 'Illustration numérique', category: 'Arts créatifs', statPrimary: StatName.INTELLIGENCE, statSecondary: StatName.SPIRIT, xpMultiplier: 1.0 },
      { name: 'Calligraphie', category: 'Arts créatifs', statPrimary: StatName.INTELLIGENCE, statSecondary: StatName.SPIRIT, xpMultiplier: 0.9 },
      { name: 'Origami', category: 'Arts créatifs', statPrimary: StatName.INTELLIGENCE, statSecondary: StatName.AGILITY, xpMultiplier: 0.8 },

      // Écriture
      { name: 'Écriture créative', category: 'Écriture', statPrimary: StatName.INTELLIGENCE, statSecondary: StatName.SPIRIT, xpMultiplier: 1.0 },
      { name: 'Journal intime', category: 'Écriture', statPrimary: StatName.SPIRIT, statSecondary: StatName.INTELLIGENCE, xpMultiplier: 0.8 },
      { name: 'Poésie', category: 'Écriture', statPrimary: StatName.INTELLIGENCE, statSecondary: StatName.SPIRIT, xpMultiplier: 0.9 },
      { name: 'Rédaction d\'articles', category: 'Écriture', statPrimary: StatName.INTELLIGENCE, xpMultiplier: 1.0 },
      { name: 'Scénario', category: 'Écriture', statPrimary: StatName.INTELLIGENCE, statSecondary: StatName.SPIRIT, xpMultiplier: 1.1 },
    ];

    await this.activityRepository.save(this.activityRepository.create(activities));
  }
}
