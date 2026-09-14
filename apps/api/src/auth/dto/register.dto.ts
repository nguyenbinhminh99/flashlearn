import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  readonly email!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(72)
  readonly password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  readonly displayName!: string;
}
