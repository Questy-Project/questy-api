import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TournamentCombat } from './entities/tournament-combat.entity';
import { TournamentWeeklyRank } from './entities/tournament-weekly-rank.entity';
import { TournamentService } from './tournament.service';
import { TournamentController } from './tournament.controller';
import { AvatarModule } from '../avatar/avatar.module';
import { RankModule } from '../rank/rank.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TournamentCombat, TournamentWeeklyRank]),
    AvatarModule,
    RankModule,
  ],
  controllers: [TournamentController],
  providers: [TournamentService],
  exports: [TournamentService],
})
export class TournamentModule {}
