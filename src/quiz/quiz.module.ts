import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { QuizSession } from './entities/quiz-session.entity';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { AvatarModule } from '../avatar/avatar.module';
import { PartsModule } from '../parts/parts.module';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuizSession]),
    HttpModule,
    AvatarModule,
    PartsModule,
    ActivitiesModule,
  ],
  controllers: [QuizController],
  providers: [QuizService],
})
export class QuizModule {}
