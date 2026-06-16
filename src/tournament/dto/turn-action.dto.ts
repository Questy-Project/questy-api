import { IsIn, IsString } from 'class-validator';

export class TurnActionDto {
  @IsString()
  @IsIn(['PHYSICAL_ATTACK', 'PHYSICAL_BLOCK', 'MAGIC_ATTACK', 'MAGIC_BLOCK'])
  action!: string;
}
