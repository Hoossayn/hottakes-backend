import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty()
  username: string;

  @ApiProperty()
  recipientUsername: string;

  @ApiProperty()
  content: any;
}
