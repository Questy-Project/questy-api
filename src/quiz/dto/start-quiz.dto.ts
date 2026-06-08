import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class StartQuizDto {
  @IsString() @IsNotEmpty()
  title!: string;

  @IsString() @IsNotEmpty()
  author!: string;

  @IsIn(['easy', 'medium', 'hard'])
  difficulty!: string;

  @IsString() @IsNotEmpty()
  activityName!: string;

  @IsOptional() @IsUUID()
  activityId?: string;

  @IsInt() @Min(1)
  duration!: number;
}
