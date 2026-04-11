import { TypeOrmModule } from "@nestjs/typeorm";
import { Activity } from "./entities/activity.entity";
import { ActivitiesSeeder } from "./activities.seeder";
import { Module } from "@nestjs/common";

@Module({
    imports: [TypeOrmModule.forFeature([Activity])],
    providers: [ActivitiesSeeder]
})
export class ActivitiesModule {}