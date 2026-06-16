import { IsNumber, IsOptional, Min } from 'class-validator';

export class PatchStatsDto {
  @IsOptional() @IsNumber() @Min(0)
  strengthXp?: number;

  @IsOptional() @IsNumber() @Min(0)
  agilityXp?: number;

  @IsOptional() @IsNumber() @Min(0)
  enduranceXp?: number;

  @IsOptional() @IsNumber() @Min(0)
  intelligenceXp?: number;

  @IsOptional() @IsNumber() @Min(0)
  spiritXp?: number;

  @IsOptional() @IsNumber() @Min(0)
  vitalityXp?: number;
}
