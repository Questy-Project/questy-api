import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TournamentService } from './tournament.service';
import { TurnActionDto } from './dto/turn-action.dto';

@UseGuards(JwtAuthGuard)
@Controller('tournament')
export class TournamentController {
  constructor(private readonly tournamentService: TournamentService) {}

  @Get('status')
  getStatus(@Request() req: any) {
    return this.tournamentService.getStatus(req.user.userId);
  }

  @Post('combat/start')
  startCombat(@Request() req: any) {
    return this.tournamentService.startCombat(req.user.userId);
  }

  @Post('combat/:id/turn')
  playTurn(
    @Param('id') id: string,
    @Body() dto: TurnActionDto,
    @Request() req: any,
  ) {
    return this.tournamentService.playTurn(req.user.userId, id, dto.action);
  }

  @Get('ranking')
  getWeeklyRanking() {
    return this.tournamentService.getWeeklyRanking();
  }
}
