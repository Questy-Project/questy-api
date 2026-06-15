import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonthlyRank } from './entities/monthly-rank.entity';
import { RankService } from './rank.service';
import { RankController } from './rank.controller';
import { AvatarModule } from '../avatar/avatar.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MonthlyRank]),
    AvatarModule,
  ],
  controllers: [RankController],
  providers: [RankService],
  exports: [RankService],
})
export class RankModule {}
