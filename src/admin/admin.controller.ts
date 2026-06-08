import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { PatchStatsDto } from './dto/patch-stats.dto';
import { PatchPartsDto } from './dto/patch-parts.dto';
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
  getUsers() {
    return this.adminService.getUsers();
  }

  @Patch('users/:id/stats')
  patchStats(@Param('id', ParseUUIDPipe) id: string, @Body() dto: PatchStatsDto) {
    return this.adminService.patchStats(id, dto);
  }

  @Patch('users/:id/parts')
  patchParts(@Param('id', ParseUUIDPipe) id: string, @Body() dto: PatchPartsDto) {
    return this.adminService.patchParts(id, dto);
  }

  @Post('users/:id/reset')
  resetUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.resetUser(id);
  }
}
