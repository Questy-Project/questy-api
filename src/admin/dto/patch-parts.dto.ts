import { IsInt, Max, Min } from 'class-validator';

export class PatchPartsDto {
  @IsInt() @Min(0) @Max(12) // MAX_PARTS_STOCK
  stock!: number;
}
