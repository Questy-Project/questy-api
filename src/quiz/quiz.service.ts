import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout } from 'rxjs';
import { QuizSession } from './entities/quiz-session.entity';
import { StartQuizDto } from './dto/start-quiz.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { AvatarService } from '../avatar/avatar.service';
import { PartsService } from '../parts/parts.service';
import { ActivitiesService } from '../activities/activities.service';
import { StatName } from '../common/enums/stat-name.enum';

type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

@Injectable()
export class QuizService {
  private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly model  = 'openai/gpt-oss-120b:free';

  private readonly difficultyToIntensity: Record<string, number> = {
    easy: 1, medium: 1.5, hard: 2,
  };

  constructor(
    @InjectRepository(QuizSession)
    private readonly quizRepository: Repository<QuizSession>,
    private readonly config: ConfigService,
    private readonly httpService: HttpService,
    private readonly avatarService: AvatarService,
    private readonly partsService: PartsService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  private buildSystemPrompt(title: string, author: string, difficulty: string, activityName: string, volume?: string): string {
    const difficultyMap: Record<string, { description: string; format: string }> = {
      easy: {
        description: "Facile — personnages principaux, lieu et intrigue générale",
        format: "Chaque question est un énoncé VRAI ou FAUX. Tu indiques clairement « VRAI ou FAUX ? » à la fin de chaque question. La seule réponse valide est « Vrai » ou « Faux ». Si le concurrent répond autre chose, tu ne corriges pas et tu lui demandes : « Réponds uniquement par Vrai ou Faux. » et tu repose la même question. Tu ne passes à la question suivante que lorsqu'une réponse valide est donnée. Après une réponse valide, tu dis si c'est correct et tu expliques brièvement.",
      },
      medium: {
        description: 'Moyen — événements clés, motivations et relations entre personnages',
        format: "Chaque question propose exactement 4 choix de réponse numérotés A, B, C, D. Tu affiches les 4 options sur des lignes séparées. La seule réponse valide est une des lettres A, B, C ou D. Si le concurrent répond autre chose, tu ne corriges pas et tu lui demandes : « Réponds uniquement par A, B, C ou D. » et tu repose les 4 choix. Tu ne passes à la question suivante que lorsqu'une réponse valide est donnée. Après une réponse valide, tu confirmes et expliques brièvement.",
      },
      hard: {
        description: 'Difficile — détails précis, thèmes, style littéraire et symboles',
        format: "Chaque question est ouverte, sans choix proposés. Tu attends une réponse libre. La correction est indulgente sur la formulation exacte mais exige que l'idée principale soit juste. Tu expliques brièvement après chaque réponse.",
      },
    };
    const bookRef = volume ? `"${title}" — ${volume} de ${author}` : `"${title}" de ${author}`;
    const diff = difficultyMap[difficulty] ?? difficultyMap['medium'];
    return `Tu es l'animateur d'un jeu télévisé de culture littéraire appelé "Le Grand Quiz Littéraire".
Tu fais passer un quiz sur ${bookRef} à un concurrent.
Type de lecture : ${activityName}
Niveau de difficulté : ${diff.description}

FORMAT DES QUESTIONS (obligatoire) :
${diff.format}

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

  private async callApi(messages: ChatMessage[]): Promise<string> {
    const response = await firstValueFrom(
      this.httpService.post(
        this.apiUrl,
        { model: this.model, messages, temperature: 0.7, max_tokens: 1024 },
        {
          headers: {
            Authorization: `Bearer ${this.config.get<string>('OPENROUTER_API_KEY')}`,
            'Content-Type': 'application/json',
          },
        },
      ).pipe(timeout(30000)),
    );
    const content = response.data.choices[0]?.message?.content;
    if (!content) console.warn('[QuizService] Contenu vide, réponse brute:', JSON.stringify(response.data));
    return (content ?? '') as string;
  }

  private computeRewards(score: number): { xpGained: number; partsUnlocked: number } {
    if (score >= 90) return { xpGained: 120, partsUnlocked: 2 };
    if (score >= 70) return { xpGained: 80,  partsUnlocked: 1 };
    if (score >= 50) return { xpGained: 40,  partsUnlocked: 0 };
    return              { xpGained: 10,  partsUnlocked: 0 };
  }

  async start(userId: string, dto: StartQuizDto): Promise<{ sessionId: string; message: string }> {
    const systemPrompt = this.buildSystemPrompt(dto.title, dto.author, dto.difficulty, dto.activityName, dto.volume);
    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: 'Commence le quiz.' },
      ];

      const apiMessage = await this.callApi(messages);

      const session = await this.quizRepository.save(
        this.quizRepository.create({
          userId,
          title:        dto.title,
          author:       dto.author,
          difficulty:   dto.difficulty,
          activityName: dto.activityName,
          activityId:   dto.activityId,
          duration:     dto.duration,
          history:      [...messages, { role: 'assistant', content: apiMessage }],
          status:       'pending',
        }),
      );

      return { sessionId: session.id, message: apiMessage };
    } catch (err) {
      console.error('[QuizService] Erreur OpenRouter:', err?.response?.data ?? err);
      throw new ServiceUnavailableException('Le quiz est temporairement indisponible. Réessaie plus tard.');
    }
  }

  async message(userId: string, dto: SendMessageDto) {
    const session = await this.quizRepository.findOne({ where: { id: dto.sessionId, userId } });
    if (!session) throw new NotFoundException('Session de quiz introuvable.');

    const messages: ChatMessage[] = [
      ...session.history,
      { role: 'user', content: dto.message },
    ];

    const apiResponse = await this.callApi(messages);

    session.history = [...messages, { role: 'assistant', content: apiResponse }];

    const scoreMatch = apiResponse.match(/SCORE_FINAL:\s*(\d+)%/);
    if (scoreMatch) {
      const score = parseInt(scoreMatch[1], 10);
      const { xpGained, partsUnlocked } = this.computeRewards(score);

      if (session.activityId && session.duration) {
        const intensity = this.difficultyToIntensity[session.difficulty] ?? 1;
        await this.activitiesService.logActivity(userId, {
          activityId: session.activityId,
          duration:   session.duration,
          intensity,
        });
      }

      await this.avatarService.updateAfterActivity(userId, xpGained, StatName.INTELLIGENCE, null);
      if (partsUnlocked > 0) await this.partsService.addParts(userId, partsUnlocked);

      session.status        = 'completed';
      session.score         = score;
      session.xpGained      = xpGained;
      session.partsUnlocked = partsUnlocked;
      await this.quizRepository.save(session);

      return { type: 'score', message: apiResponse, score, xpGained, partsUnlocked };
    }

    await this.quizRepository.save(session);
    return { type: 'message', message: apiResponse };
  }
}
