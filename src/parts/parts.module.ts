  import { Module } from '@nestjs/common';
  import { TypeOrmModule } from '@nestjs/typeorm';
  import { Part } from './entities/parts.entity';
  import { PartsService } from './parts.service';
  import { PartsController } from './parts.controller';

  @Module({
    imports:[TypeOrmModule.forFeature([Part])],
    controllers:[PartsController],
    providers:[PartsService],
    exports:[PartsService],
  })
  export class PartsModule{}