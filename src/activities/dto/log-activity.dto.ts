import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class LogActivityDto {

  @IsOptional()
  @IsUUID()
  activityId?: string;

  @IsOptional()
  @IsString()
  customName?: string;

  @IsOptional()
  @IsString()
  customCategory?: string;

  @IsInt()
  @Min(1)
  @Max(180)
  duration!: number;

  @IsIn([1,1.5,2])
  intensity!: number;
}
