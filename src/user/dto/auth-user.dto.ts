import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AuthUserDto {
  @IsEmail()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(20)
  readonly email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(16)
  readonly password: string;
}
