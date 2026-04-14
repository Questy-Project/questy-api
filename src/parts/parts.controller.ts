  import { Controller, Get, Req, UseGuards } from '@nestjs/common';
  import { PartsService } from './parts.service';
  import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

  @UseGuards(JwtAuthGuard)
  @Controller('parts')
  export class PartsController{
    constructor( private readonly partsService: PartsService){}

    @Get('me')
    async getMyPart(@Req() req: any){
        const part= await this.partsService.findByUserId(req.user.userId)
        return part;
    }
  }