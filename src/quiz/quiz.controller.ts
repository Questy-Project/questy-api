import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { QuizService } from './quiz.service';
import { StartQuizDto } from './dto/start-quiz.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('quiz')
@UseGuards(JwtAuthGuard)
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post('start')
  start(@Req() req: { user: { userId: string } }, @Body() dto: StartQuizDto) {
    return this.quizService.start(req.user.userId, dto);
  }

  @Post('message')
  message(@Req() req: { user: { userId: string } }, @Body() dto: SendMessageDto) {
    return this.quizService.message(req.user.userId, dto);
  }
}
