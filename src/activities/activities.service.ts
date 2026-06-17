import { Injectable, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Activity } from './entities/activity.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LogActivityDto } from './dto/log-activity.dto';
import { AvatarService } from '../avatar/avatar.service';
import { PartsService } from '../parts/parts.service';
import { StatName } from '../common/enums/stat-name.enum';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    // Services injectés directement (pas de @InjectRepository — ce ne sont pas des repositories)
    private readonly avatarService: AvatarService,
    private readonly partsService: PartsService,
  ) {}

  async findAll(search?: string): Promise<Activity[]> {
    if (search) {
      return this.activityRepository
        .createQueryBuilder('activity')
        .where('activity.name ILIKE :search', { search: `%${search}%` })
        .getMany();
    }
    return this.activityRepository.find();
  }

  async logActivity(userId: string, dto: LogActivityDto, xpOverride?: number, skipParts = false): Promise<ActivityLog> {
    const today = new Date();
    const start = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0,
    );
    const end = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
    );

    //Check les totaux journaliers (pour l'anti-triche)
    const logs = await this.activityLogRepository
      .createQueryBuilder('log')
      .where('log.userId = :userId', { userId })
      .andWhere('log.loggedAt BETWEEN :start AND :end', { start, end })
      .getMany();

    const totalMinutes = logs.reduce((sum, l) => sum + l.duration, 0);
    const totalXp = logs.reduce((sum, l) => sum + l.xpGained, 0);

    if (totalMinutes + dto.duration > 180) {
      throw new BadRequestException(
        "Tu as atteint la limite quotidienne de 180 minutes d'activité.",
      );
    }
    if (totalXp >= 360) {
      throw new BadRequestException(
        'Tu as atteint la limite quotidienne de 360 XP.',
      );
    }
    let xpMultiplier = 1.0;
    let statPrimary: StatName | null = null;
    let statSecondary: StatName | null = null;
    if (dto.activityId) {
      const activity = await this.activityRepository.findOne({
        where: { id: dto.activityId },
      });
      if (activity) {
        xpMultiplier = activity.xpMultiplier;
        statPrimary = activity.statPrimary;
        statSecondary = activity.statSecondary ?? null;
      }
    }

    const INTENSITY_XP_MULTIPLIER: Record<number, number> = { 1: 1.00, 2: 1.15, 3: 1.30 };
    const intensityMultiplier = INTENSITY_XP_MULTIPLIER[dto.intensity] ?? 1.00;
    const rawXp = xpOverride !== undefined
      ? xpOverride
      : Math.round(dto.duration * intensityMultiplier * xpMultiplier);
    //Plafond de 360xp quotidien
    const xpGained = Math.min(rawXp, 360 - totalXp);

    const partsByDuration = dto.duration <= 30 ? 1 : dto.duration <= 60 ? 2 : 3;
    const partsUnlocked = partsByDuration + dto.intensity;

    const log = Object.assign(new ActivityLog(), {
      userId,
      activityId: dto.activityId ?? undefined,
      customName: dto.customName ?? undefined,
      customCategory: dto.customCategory ?? undefined,
      duration: dto.duration,
      intensity: dto.intensity,
      xpGained,
      partsUnlocked,
    });
    const savedLog = await this.activityLogRepository.save(log);

    // Mise à jour avatar (stats 70/30 + niveau + heroClass) et stock de parties
    await this.avatarService.updateAfterActivity(
      userId,
      xpGained,
      statPrimary,
      statSecondary,
    );
    if (!skipParts) await this.partsService.addParts(userId, partsUnlocked);

    return savedLog;
  }

  async findRecentByUserId(userId: string): Promise<ActivityLog[]> {
    return this.activityLogRepository.find({
      where: { userId },
      relations: ['activity'],
      order: { loggedAt: 'DESC' },
      take: 10,
    });
  }
}
