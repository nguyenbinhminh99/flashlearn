import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateFlashcardDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  readonly front!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  readonly back!: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsUrl({ require_tld: false })
  readonly imageUrl?: string | null;
}
