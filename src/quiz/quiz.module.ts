import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizSession } from './entities/quiz-session.entity';
import { AvatarModule } from '../avatar/avatar.module';
import { PartsModule } from '../parts/parts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuizSession]),
    AvatarModule,
    PartsModule,
  ],
  controllers: [],
  providers: [],
})
export class QuizModule {}
