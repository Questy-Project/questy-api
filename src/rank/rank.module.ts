import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonthlyRank } from './entities/monthly-rank.entity';
import { User } from '../users/entities/user.entity';
import { RankService } from './rank.service';
import { RankController } from './rank.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([MonthlyRank, User]),
  ],
  controllers: [RankController],
  providers: [RankService],
  exports: [RankService],
})
export class RankModule {}
