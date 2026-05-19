import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AvatarService } from './avatar.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('avatar')
export class AvatarController {
  constructor(private readonly avatarService: AvatarService) {}

  @Get('me')
  async getMyAvatar(@Req() req: any) {
    const avatar = await this.avatarService.findByUserId(req.user.userId);
    // xpNextLevel permet au frontend d'afficher la barre XP sans recalculer les seuils
    const xpNextLevel = this.avatarService.xpForLevel(avatar.level + 1);
    return { ...avatar, xpNextLevel };
  }
}
