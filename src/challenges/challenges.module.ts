import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ChallengeCatalog } from './entities/challenge-catalog.entity';
import { ChallengeLog } from './entities/challenge-log.entity';
import { ChallengeSession } from './entities/challenge-session.entity';
import { ChallengesService } from './challenges.service';
import { ChallengesController } from './challenges.controller';
import { ChallengesSeeder } from './challenges.seeder';
import { AvatarModule } from '../avatar/avatar.module';
import { PartsModule } from '../parts/parts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChallengeCatalog, ChallengeLog, ChallengeSession]),
    HttpModule,
    AvatarModule,
    PartsModule,
  ],
  controllers: [ChallengesController],
  providers: [ChallengesService, ChallengesSeeder],
})
export class ChallengesModule {}
