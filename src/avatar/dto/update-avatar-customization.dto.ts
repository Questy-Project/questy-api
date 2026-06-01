import { IsBoolean, IsIn, IsInt, Max, Min } from 'class-validator';

export class UpdateAvatarCustomizationDto {
  @IsIn(['A', 'B'])
  silhouette!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  skinTone!: number;

  @IsInt()
  @Min(1)
  @Max(20)
  hairStyle!: number;

  @IsInt()
  @Min(1)
  @Max(4)
  hairColor!: number;

  @IsBoolean()
  showHood!: boolean;
}
