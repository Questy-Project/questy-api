import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ChallengesService } from './challenges.service';
import { StartChallengeDto } from './dto/start-challenge.dto';
import { AnswerChallengeDto } from './dto/answer-challenge.dto';

@UseGuards(JwtAuthGuard)
@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Get('today')
  getToday(@Request() req: any) {
    return this.challengesService.getToday(req.user.userId);
  }

  @Post(':id/start')
  startPhysical(@Param('id') id: string, @Request() req: any) {
    return this.challengesService.startPhysical(req.user.userId, id);
  }

  @Post(':id/complete')
  completePhysical(@Param('id') id: string, @Request() req: any) {
    return this.challengesService.completePhysical(req.user.userId, id);
  }

  @Post('ia/start')
  startIA(@Body() dto: StartChallengeDto, @Request() req: any) {
    return this.challengesService.startIA(req.user.userId, dto);
  }

  @Post('ia/message')
  messageIA(@Body() dto: AnswerChallengeDto, @Request() req: any) {
    return this.challengesService.messageIA(req.user.userId, dto);
  }
}
