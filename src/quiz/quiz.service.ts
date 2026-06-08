import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { QuizSession } from './entities/quiz-session.entity';
import { StartQuizDto } from './dto/start-quiz.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { AvatarService } from '../avatar/avatar.service';
import { PartsService } from '../parts/parts.service';
import { ActivitiesService } from '../activities/activities.service';
import { StatName } from '../common/enums/stat-name.enum';

@Injectable()
export class QuizService {
  private readonly genAI: GoogleGenerativeAI;

  private readonly difficultyToIntensity: Record<string, number> = {
    easy: 1,
    medium: 1.5,
    hard: 2,
  };

  constructor(
    @InjectRepository(QuizSession)
    private readonly quizRepository: Repository<QuizSession>,
    private readonly config: ConfigService,
    private readonly avatarService: AvatarService,
    private readonly partsService: PartsService,
    private readonly activitiesService: ActivitiesService,
  ) {
    this.genAI = new GoogleGenerativeAI(
      this.config.get<string>('GEMINI_API_KEY')!,
    );
  }

  private buildSystemPrompt(
    title: string,
    author: string,
    difficulty: string,
    activityName: string,
  ): string {
    const difficultyMap: Record<string, string> = {
      easy:   "Facile — questions sur les personnages principaux, le lieu et l'intrigue générale",
      medium: 'Moyen — questions sur les événements clés, les motivations et les relations entre personnages',
      hard:   'Difficile — questions sur les détails précis, les thèmes, le style littéraire et les symboles',
    };
    return `Tu es l'animateur d'un jeu télévisé de culture littéraire appelé "Le Grand Quiz Littéraire".
Tu fais passer un quiz sur le livre "${title}" de ${author} à un concurrent.
Type de lecture : ${activityName}
Niveau de difficulté : ${difficultyMap[difficulty] ?? difficultyMap['medium']}

Règles STRICTES :
- Pose exactement 10 questions sur le contenu du livre, une par une
- Attends la réponse du concurrent avant de passer à la suivante
- Tu ne donnes JAMAIS d'indice, même si le concurrent en demande — réponds simplement "Je ne peux pas t'aider !"
- Sois enthousiaste, dynamique, théâtral comme à la télévision
- Numérote tes questions (1/10, 2/10, etc.)
- Après la 10ème réponse, donne un bref récapitulatif puis termine ton message OBLIGATOIREMENT par cette ligne exacte, seule sur sa propre ligne :
  SCORE_FINAL: XX%
  (remplace XX par le pourcentage de bonnes réponses, nombre entier)

Commence directement par une courte présentation enthousiaste du jeu et pose la première question.`;
  }

  async start(
    userId: string,
    dto: StartQuizDto,
  ): Promise<{ sessionId: string; message: string }> {
    const systemPrompt = this.buildSystemPrompt(
      dto.title,
      dto.author,
      dto.difficulty,
      dto.activityName,
    );

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: systemPrompt,
      });

      const chat = model.startChat({ history: [] });
      const result = await chat.sendMessage('Commence le quiz.');
      const geminiMessage = result.response.text();

      const session = await this.quizRepository.save(
        this.quizRepository.create({
          userId,
          title: dto.title,
          author: dto.author,
          difficulty: dto.difficulty,
          activityName: dto.activityName,
          activityId: dto.activityId,
          duration: dto.duration,
          history: [
            { role: 'user', parts: [{ text: 'Commence le quiz.' }] },
            { role: 'model', parts: [{ text: geminiMessage }] },
          ],
          status: 'pending',
        }),
      );

      return { sessionId: session.id, message: geminiMessage };
    } catch (err) {
      console.error('[QuizService] Erreur Gemini:', err);
      throw new ServiceUnavailableException(
        'Le quiz est temporairement indisponible. Réessaie plus tard.',
      );
    }
  }

  async message(userId: string, dto: SendMessageDto) {
    const session = await this.quizRepository.findOne({
      where: { id: dto.sessionId, userId },
    });
    if (!session) throw new NotFoundException('Session de quiz introuvable.');

    const systemPrompt = this.buildSystemPrompt(
      session.title,
      session.author,
      session.difficulty,
      session.activityName,
    );

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt,
    });

    const chat = model.startChat({ history: session.history });
    const result = await chat.sendMessage(dto.message);
    const geminiResponse = result.response.text();

    session.history = [
      ...session.history,
      { role: 'user',  parts: [{ text: dto.message }] },
      { role: 'model', parts: [{ text: geminiResponse }] },
    ];

    const scoreMatch = geminiResponse.match(/SCORE_FINAL:\s*(\d+)%/);
    if (scoreMatch) {
      const score = parseInt(scoreMatch[1], 10);
      const { xpGained, partsUnlocked } = this.computeRewards(score);

      // Logger l'activité de lecture maintenant que le quiz est terminé
      if (session.activityId && session.duration) {
        const intensity = this.difficultyToIntensity[session.difficulty] ?? 1;
        await this.activitiesService.logActivity(userId, {
          activityId: session.activityId,
          duration: session.duration,
          intensity,
        });
      }

      // Bonus XP Intelligence selon le score du quiz
      await this.avatarService.updateAfterActivity(
        userId, xpGained, StatName.INTELLIGENCE, null,
      );
      if (partsUnlocked > 0) {
        await this.partsService.addParts(userId, partsUnlocked);
      }

      session.status        = 'completed';
      session.score         = score;
      session.xpGained      = xpGained;
      session.partsUnlocked = partsUnlocked;
      await this.quizRepository.save(session);

      return { type: 'score', message: geminiResponse, score, xpGained, partsUnlocked };
    }

    await this.quizRepository.save(session);
    return { type: 'message', message: geminiResponse };
  }

  private computeRewards(score: number): { xpGained: number; partsUnlocked: number } {
    if (score >= 90) return { xpGained: 120, partsUnlocked: 2 };
    if (score >= 70) return { xpGained: 80,  partsUnlocked: 1 };
    if (score >= 50) return { xpGained: 40,  partsUnlocked: 0 };
    return              { xpGained: 10,  partsUnlocked: 0 };
  }
}
