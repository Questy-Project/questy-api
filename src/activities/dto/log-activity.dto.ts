import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class LogActivityDto {

  @IsOptional()
  @IsUUID()
  activityId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  customName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  customCategory?: string;

  @IsInt()
  @Min(1)
  @Max(180)
  duration!: number;

  @IsIn([1,1.5,2])
  intensity!: number;
}
