import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class AdminUsersQueryDto {
  @IsOptional()
  @IsString()
  readonly q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  readonly limit?: number = 20;
}

export class BlockUserDto {
  @IsBoolean()
  readonly isBlocked!: boolean;
}

export class AdminStudySetsQueryDto {
  @IsOptional()
  @IsString()
  readonly q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  readonly limit?: number = 20;
}
