import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
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
}
