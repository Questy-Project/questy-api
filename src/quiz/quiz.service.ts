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
import { StatName } from '../common/enums/stat-name.enum';

@Injectable()
export class QuizService {
  private readonly genAI: GoogleGenerativeAI;

  constructor(
    @InjectRepository(QuizSession)
    private readonly quizRepository: Repository<QuizSession>,
    private readonly config: ConfigService,
    private readonly avatarService: AvatarService,
    private readonly partsService: PartsService,
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
          history: [
            { role: 'user', parts: [{ text: 'Commence le quiz.' }] },
            { role: 'model', parts: [{ text: geminiMessage }] },
          ],
          status: 'pending',
        }),
      );

      return { sessionId: session.id, message: geminiMessage };
    } catch {
      throw new ServiceUnavailableException(
        'Le quiz est temporairement indisponible. Réessaie plus tard.',
      );
    }
  }

  async message(userId: string, dto: SendMessageDto): Promise<unknown> {
    throw new Error('Not yet implemented');
  }

  private computeRewards(score: number): { xpGained: number; partsUnlocked: number } {
    if (score >= 90) return { xpGained: 120, partsUnlocked: 2 };
    if (score >= 70) return { xpGained: 80,  partsUnlocked: 1 };
    if (score >= 50) return { xpGained: 40,  partsUnlocked: 0 };
    return              { xpGained: 10,  partsUnlocked: 0 };
  }
}
