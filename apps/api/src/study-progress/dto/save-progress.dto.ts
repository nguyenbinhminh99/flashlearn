import { ArrayUnique, IsArray, IsInt, IsString, Min } from 'class-validator';

export class SaveProgressDto {
  @IsInt()
  @Min(0)
  readonly currentIndex!: number;

  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  readonly completedIds!: string[];
}
