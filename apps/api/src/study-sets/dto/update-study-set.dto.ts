import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateStudySetDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  readonly title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  readonly description?: string | null;

  @IsOptional()
  @IsBoolean()
  readonly isPublic?: boolean;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  readonly categoryId?: string | null;
}
