  import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

  export class UpdateUserDto {
    @IsOptional()
    @IsString()
    pseudo?: string;

    @IsOptional()
    @IsInt()
    @Min(5)
    @Max(120)
    age?: number;
  }