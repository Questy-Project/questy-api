import { IsString, IsUUID } from 'class-validator';

export class AnswerChallengeDto {
  @IsUUID()
  sessionId!: string;

  @IsString()
  message!: string;
}
