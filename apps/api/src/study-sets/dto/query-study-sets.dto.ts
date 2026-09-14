import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

function toOptionalBoolean({ value }: { value: unknown }): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (value === true || value === 'true' || value === '1') {
    return true;
  }
  if (value === false || value === 'false' || value === '0') {
    return false;
  }
  return Boolean(value);
}

export class QueryStudySetsDto {
  @IsOptional()
  @IsBoolean()
  @Transform(toOptionalBoolean)
  readonly mine?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(toOptionalBoolean)
  readonly public?: boolean;

  @IsOptional()
  @IsUUID()
  readonly categoryId?: string;

  @IsOptional()
  @IsString()
  readonly q?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  readonly page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  readonly limit?: number = 12;
}
