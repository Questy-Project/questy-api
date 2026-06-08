import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AvatarModule } from '../avatar/avatar.module';
import { PartsModule } from '../parts/parts.module';
import { User } from '../users/entities/user.entity';
import { Avatar } from '../avatar/entities/avatar.entity';
import { Part } from '../parts/entities/parts.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Avatar, Part]),
    AvatarModule,
    PartsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
