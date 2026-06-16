import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminSeeder } from './admin.seeder';
import { PlayersSeeder } from './players.seeder';
import { AvatarModule } from '../avatar/avatar.module';
import { PartsModule } from '../parts/parts.module';
import { RankModule } from '../rank/rank.module';
import { User } from '../users/entities/user.entity';
import { Avatar } from '../avatar/entities/avatar.entity';
import { Part } from '../parts/entities/parts.entity';
import { MonthlyRank } from '../rank/entities/monthly-rank.entity';
import { TournamentWeeklyRank } from '../tournament/entities/tournament-weekly-rank.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Avatar, Part, MonthlyRank, TournamentWeeklyRank]),
    // TournamentModule non importé — on accède aux entités directement via forFeature
    AvatarModule,
    PartsModule,
    RankModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminSeeder, PlayersSeeder],
})
export class AdminModule {}
