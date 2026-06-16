import { Body, Controller, DefaultValuePipe, Get, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { PatchStatsDto } from './dto/patch-stats.dto';
import { PatchPartsDto } from './dto/patch-parts.dto';
import { PatchRankDto } from './dto/patch-rank.dto';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('crons/monthly-reset')
  triggerMonthlyReset() {
    return this.adminService.triggerMonthlyReset();
  }

  @Post('crons/parts-recharge')
  triggerPartsRecharge() {
    return this.adminService.triggerPartsRecharge();
  }

  @Get('users')
  getUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers(page, limit, search);
  }

  @Patch('users/:id/stats')
  patchStats(@Param('id', ParseUUIDPipe) id: string, @Body() dto: PatchStatsDto) {
    return this.adminService.patchStats(id, dto);
  }

  @Patch('users/:id/parts')
  patchParts(@Param('id', ParseUUIDPipe) id: string, @Body() dto: PatchPartsDto) {
    return this.adminService.patchParts(id, dto);
  }

  @Patch('users/:id/rank')
  patchRank(@Param('id', ParseUUIDPipe) id: string, @Body() dto: PatchRankDto) {
    return this.adminService.patchRank(id, dto);
  }

  @Post('users/:id/reset')
  resetUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.resetUser(id);
  }
}
