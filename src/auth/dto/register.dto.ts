import { IsEmail, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  pseudo!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsIn(['A', 'B'])
  silhouette?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  skinTone?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  hairStyle?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  hairColor?: number;
}
