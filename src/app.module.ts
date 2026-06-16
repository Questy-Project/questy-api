import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ActivitiesModule } from './activities/activities.module';
import { AvatarModule } from './avatar/avatar.module';
import { PartsModule } from './parts/parts.module';
import { AdminModule } from './admin/admin.module';
import { QuizModule } from './quiz/quiz.module';
import { ChallengesModule } from './challenges/challenges.module';
import { TournamentModule } from './tournament/tournament.module';
import { RankModule } from './rank/rank.module';
import { ScheduleModule } from '@nestjs/schedule';


@Module({
  imports: [
    //On charge les fichier du .env et on les rned accessible dans toute l'app
    ConfigModule.forRoot({ isGlobal: true}),

    //forRootAsyn attend que ConfigModule soit prêt avant de lire DATABASE_URL
    TypeOrmModule.forRootAsync({
      inject:[ConfigService],
      useFactory: (config : ConfigService )=>({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),

        //Chaque module enregistrera ses entités lui même via TypeOrmModule.forFeature()
        autoLoadEntities: true,

        //ATTENTION Ne pas oublier de désactiver pour éviter les modification non controllée en prod
        synchronize: config.get<string>('NODE_ENV') !== 'production',

        //SSL requis uniquemetn sur Railway (production)
        ssl: config.get<string>('NODE_ENV') === 'production' ? {rejectUnauthorized: false} : undefined,
      }),
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    ActivitiesModule,
    AvatarModule,
    PartsModule,
    AdminModule,
    QuizModule,
    ChallengesModule,
    TournamentModule,
    RankModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
