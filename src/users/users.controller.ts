import { Body, Controller, Get, Patch, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UpdateUserDto } from "./dto/update-user.dto"
import { UsersService } from "./users.service";

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor (private readonly usersService: UsersService){}

    @Get('me')
    async getMe(@Req() req: any){
        const user= await this.usersService.findById(req.user.userId);
        const { password, ...result }= user! ;
        return result;
    }

    @Patch('me')
    async updateMe(@Req() req: any, @Body() dto: UpdateUserDto){
        const user = await this.usersService.update(req.user.userId, dto);
        const { password, ...result } = user;
        return result;
    }
}