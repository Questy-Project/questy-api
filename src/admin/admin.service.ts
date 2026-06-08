import { Injectable } from '@nestjs/common';
import { AvatarScheduler } from '../avatar/avatar.scheduler';
import { PartsService } from '../parts/parts.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly avatarScheduler: AvatarScheduler,
    private readonly partsService: PartsService,
  ) {}

  async triggerMonthlyReset(): Promise<{ message: string }> {
    await this.avatarScheduler.handleMonthlyReset();
    return { message: 'Reset mensuel exécuté' };
  }

  async triggerPartsRecharge(): Promise<{ message: string }> {
    await this.partsService.rechargeNightly();
    return { message: 'Recharge des parties exécutée' };
  }
}
