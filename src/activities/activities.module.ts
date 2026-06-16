import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './entities/activity.entity';
import { ActivitiesSeeder } from './activities.seeder';
import { Module } from '@nestjs/common';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { ActivityLog } from './entities/activity-log.entity';
import { AvatarModule } from '../avatar/avatar.module';
import { PartsModule } from '../parts/parts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity, ActivityLog]),
    AvatarModule,  // expose AvatarService pour ActivitiesService
    PartsModule,   // expose PartsService pour ActivitiesService
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesSeeder, ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
