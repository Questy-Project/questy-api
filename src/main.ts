import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Préfix pour toutes les routes /api 
  app.setGlobalPrefix('api');

  //Permet d'activer la validation auto sur tout les DTOs
  //whitelist: true => supprime les champs (supplémentaire venant du front) non déclarer dans le DTO (sécurité)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true}));

  //Autorise uniquement le frontend à appeler l'API
  app.enableCors({ origin: process.env.FRONTEND_URL})

  await app.listen(process.env.PORT ?? 3000)
}
bootstrap();