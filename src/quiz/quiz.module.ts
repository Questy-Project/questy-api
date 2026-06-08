import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizSession } from './entities/quiz-session.entity';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { AvatarModule } from '../avatar/avatar.module';
import { PartsModule } from '../parts/parts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuizSession]),
    AvatarModule,
    PartsModule,
  ],
  controllers: [QuizController],
  providers: [QuizService],
})
export class QuizModule {}
