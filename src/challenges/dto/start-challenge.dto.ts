import { IsEnum } from 'class-validator';
import { StatName } from '../../common/enums/stat-name.enum';

export class StartChallengeDto {
  @IsEnum(StatName)
  stat!: StatName;
}
