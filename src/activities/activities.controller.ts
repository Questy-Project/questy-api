import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ActivitiesService } from './activities.service';
import { LogActivityDto } from './dto/log-activity.dto';

@UseGuards(JwtAuthGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.activitiesService.findAll(search);
  }

  @Get('log')
  getMyLog(@Req() req: any){
    return this.activitiesService.findRecentByUserId(req.user.userId);
  }

  @Post('log')
  logActivity(@Req() req: any, @Body() dto: LogActivityDto) {
    return this.activitiesService.logActivity(req.user.userId, dto);
  }
}
