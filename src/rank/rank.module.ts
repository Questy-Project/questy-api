import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonthlyRank } from './entities/monthly-rank.entity';
import { RankService } from './rank.service';
import { RankController } from './rank.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([MonthlyRank]),
  ],
  controllers: [RankController],
  providers: [RankService],
  exports: [RankService],
})
export class RankModule {}
