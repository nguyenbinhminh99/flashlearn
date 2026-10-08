import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  readonly currentPassword!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(72)
  readonly newPassword!: string;
}
