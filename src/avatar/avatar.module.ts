import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Avatar } from './entities/avatar.entity';
import { AvatarService } from './avatar.service';
import { AvatarController } from './avatar.controller';
import { AvatarScheduler } from './avatar.scheduler';

@Module({
  imports: [TypeOrmModule.forFeature([Avatar])],
  controllers: [AvatarController],
  providers: [AvatarService, AvatarScheduler],
  exports: [AvatarService, AvatarScheduler],
})
export class AvatarModule {}
