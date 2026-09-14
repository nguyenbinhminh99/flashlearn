import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  readonly displayName?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  readonly avatarUrl?: string | null;
}
