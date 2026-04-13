import { Injectable,BadRequestException } from "@nestjs/common";
import { Repository } from "typeorm";
import { Activity } from "./entities/activity.entity";
import { ActivityLog } from "./entities/activity-log.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { LogActivityDto } from './dto/log-activity.dto';

@Injectable()
export class ActivitiesService{
    constructor(
        @InjectRepository(Activity)
        private readonly activityRepository: Repository<Activity>,
        @InjectRepository(ActivityLog)
        private readonly activityLogRepository: Repository<ActivityLog>
    ){}

    async findAll(search?:string): Promise<Activity[]> {
        if(search){
            return this.activityRepository
            .createQueryBuilder('activity')
            .where('activity.name ILIKE :search', { search: `%${search}%` })
            .getMany()
        }
        return this.activityRepository.find()
    }

    async logActivity( userId: string, dto: LogActivityDto): Promise<ActivityLog>{
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
        const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

        //Check les totaux journaliers (pour l'anti-triche)
        const logs = await this. activityLogRepository
        .createQueryBuilder('log')
        .where('log.userId = :userId', { userId })
        .andWhere('log.loggedAt BETWEEN :start AND :end', { start, end })
        .getMany();

        const totalMinutes = logs.reduce((sum, l) => sum + l.duration, 0);
        const totalXp = logs.reduce((sum, l) => sum + l.xpGained, 0);

        if(totalMinutes>= 180){
            throw new BadRequestException("Tu as atteint la limite quotidienne de 180 minutes d'activité.")
        }
        if(totalXp>=360){
            throw new BadRequestException("Tu as atteint la limite quotidienne de 360 XP.")
        }
        let xpMultiplier = 1.0;
        if(dto.activityId){
            const activity = await this.activityRepository.findOne({where: {id: dto.activityId}})
            if (activity) xpMultiplier = activity.xpMultiplier;
        }

        const rawXp= Math.round(dto.duration*dto.intensity*xpMultiplier);
        //Plafond de 360xp quotidien
        const xpGained= Math.min(rawXp, 360 - totalXp);

        const partsUnlocked = dto.duration <= 30 ? 2 : dto.duration <= 60? 4 : 6;

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
        return this.activityLogRepository.save(log);
    }
}