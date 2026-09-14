import { IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  readonly name!: string;
}
