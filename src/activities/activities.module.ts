import { TypeOrmModule } from "@nestjs/typeorm";
import { Activity } from "./entities/activity.entity";
import { ActivitiesSeeder } from "./activities.seeder";
import { Module } from "@nestjs/common";
import { ActivitiesController } from "./activities.controller";
import { ActivitiesService } from "./activities.service";
import { ActivityLog } from "./entities/activity-log.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Activity, ActivityLog])],
    controllers:[ActivitiesController],
    providers: [ActivitiesSeeder, ActivitiesService]
})
export class ActivitiesModule {}