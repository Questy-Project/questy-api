import { IsInt, IsOptional, Min } from 'class-validator';

export class PatchRankDto {
  @IsOptional() @IsInt() @Min(0)
  monthlyPoints?: number;

  @IsOptional() @IsInt() @Min(0)
  weeklyPoints?: number;
}
