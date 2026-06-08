import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class StartQuizDto {
  @IsString() @IsNotEmpty()
  title!: string;

  @IsString() @IsNotEmpty()
  author!: string;

  @IsIn(['easy', 'medium', 'hard'])
  difficulty!: string;

  @IsString() @IsNotEmpty()
  activityName!: string;
}
