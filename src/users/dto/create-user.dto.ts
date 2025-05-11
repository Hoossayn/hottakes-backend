import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'hotgirl_summer' })
  username?: string;

  @ApiProperty({ example: 'joe@example.com', required: true })
  @IsEmail()
  email: string;
}
export class LoginDto {
  @ApiProperty({ example: 'joe@example.com', required: true })
  @IsEmail()
  email: string;
  @ApiProperty({ example: 'device-id', required: true })
  token: string;
}
export class UpdateUsernameDto {
  @ApiProperty({ example: 'hotgirl_summer', required: true })
  current: string;
  @ApiProperty({ example: 'coldgirl_winter', required: true })
  newUsername: string;
}
