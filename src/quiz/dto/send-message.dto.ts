import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  sessionId!: string;

  @IsString() @IsNotEmpty()
  message!: string;
}
