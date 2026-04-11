import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { UsersService } from './users.service'

@Module({
    imports:[ TypeOrmModule.forFeature([User])],
    exports:[ TypeOrmModule,
        UsersService
    ],
    providers:[ UsersService ],
})
export class UsersModule{}
