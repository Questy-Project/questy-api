import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { AvatarService } from './avatar.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UpdateAvatarCustomizationDto } from './dto/update-avatar-customization.dto';

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

  @Patch('customization')
  async updateCustomization(@Req() req: any, @Body() dto: UpdateAvatarCustomizationDto) {
    return this.avatarService.updateCustomization(req.user.userId, dto);
  }
}
