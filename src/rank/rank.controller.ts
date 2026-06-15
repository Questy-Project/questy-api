import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RankService } from './rank.service';

@Controller('rank')
export class RankController {
  constructor(private readonly rankService: RankService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyRank(@Request() req: any) {
    return this.rankService.getMyRank(req.user.userId);
  }
}
