import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { Category } from '../entities/hottake.entity';

export class CreateHottakeDto {
  @ApiProperty({ example: 'Your takes here' })
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: Category.ENTERTAINMENT })
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'app_user' })
  @IsNotEmpty()
  sender?: string;

  @ApiProperty({ example: 'hotgirl_summer' })
  @IsNotEmpty()
  to: string;

  @ApiProperty({ example: true })
  @IsNotEmpty()
  isPublic?: boolean;
}

export class PostHottakeDto {
  @ApiProperty({ example: 'Your takes here' })
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: Category.ENTERTAINMENT })
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'app_user' })
  @IsNotEmpty()
  sender: string;
}
  