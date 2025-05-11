import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginationFilterDTO } from 'src/utils';

@ApiTags('Notification')
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get(':username')
  @ApiOperation({
    summary:
      'Fetch all notifications by username - (Existing/in-app user fetch all notifications sent to them - username is required)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notifications fetched ',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async findAll(
    @Param('username') username: string,
    @Query() pagination?: PaginationFilterDTO,
  ) {
    const result = await this.notificationService.findAll(username, pagination);
    return result;
  }

  @Get(':id/read')
  @ApiOperation({ summary: 'Read a notification' })
  @ApiResponse({ status: HttpStatus.OK, description: 'notification fetched' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async findOne(@Param('id') id: string) {
    const result = await this.notificationService.findOne(id);
    return result;
  }

  @Delete(':id')
  @ApiOperation({ summary: ' Delete a notfication by notfication Id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notification Deleted' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async deleteTake(@Param('id') id: string) {
    const result = await this.notificationService.remove(id);
    return result;
  }
}
