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
import { HottakesService } from './hottakes.service';
import { CreateHottakeDto, PostHottakeDto } from './dto/create-hottake.dto';
import { BaseResponseTypeDTO, PaginationFilterDTO } from 'src/utils';
import {
  ApiExtraModels,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FILTERS, REACTIONS } from './entities/hottake.entity';

@ApiTags('Hottakes')
@Controller('hottakes')
export class HottakesController {
  constructor(private readonly hottakesService: HottakesService) {}

  @Post()
  @ApiOperation({ summary: 'Send Hot Take - (both guest & existing users)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Hot Take Added' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async createHotTakes(
    @Body() payload: CreateHottakeDto,
  ): Promise<BaseResponseTypeDTO> {
    const result = await this.hottakesService.createHottakes(payload);
    return result;
  }

  @Post('user/post')
  @ApiOperation({
    summary:
      'Existing/in-app User Post a Hot Take to get reactions - (existing user)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User Posted a Hot Take',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async PostHotTakes(
    @Body() payload: PostHottakeDto,
  ): Promise<BaseResponseTypeDTO> {
    const result = await this.hottakesService.postHottakes(payload);
    return result;
  }

  @Get('user/:username')
  @ApiOperation({
    summary:
      'Fetch all Hot Takes by username - (Existing/in-app user fetch all hottakes sent to them - username is required)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Hot Takes fetched ',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    enum: FILTERS,
    description: 'Filters (optional)',
  })
  async findAllByUser(
    @Param('username') username: string,
    @Query() pagination?: PaginationFilterDTO,
    @Query('filter') filter?: FILTERS,
  ) {
    const result = await this.hottakesService.getTakesForUser(
      username,
      pagination,
      filter,
    );
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a hot take by hottake Id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'hot take fetched' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async findOne(@Param('id') id: string) {
    const result = await this.hottakesService.getSingleTake(id);
    return result;
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      'React to a take by the hottake Id - (Only in-app user can react. Username is required)',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'React to takes' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiQuery({
    name: 'reactions',
    required: false,
    enum: REACTIONS,
    description: 'Query by reactions (optional)',
  })
  async reactToHotTake(
    @Param('id') id: string,
    @Query('username') username: string,
    @Query('reactions') reactions?: REACTIONS,
  ): Promise<BaseResponseTypeDTO> {
    const result = await this.hottakesService.reactToHotTake(
      id,
      reactions,
      username,
    );
    return result;
  }

  @Get()
  @ApiOperation({
    summary:
      'Fetch all Hot Takes (only in-app users can do this - username is required)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Hot Takes fetched ',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiQuery({
    name: 'filter',
    required: false,
    enum: FILTERS,
    description: 'Filters (optional)',
  })
  async getAllTakes(
    @Query('username') username: string,
    @Query() pagination?: PaginationFilterDTO,
    @Query('filter') filter?: FILTERS,
  ): Promise<BaseResponseTypeDTO> {
    const result = await this.hottakesService.getAllTakes(
      username,
      pagination,
      filter,
    );
    return result;
  }

  @Get('get/previous-takes')
  @ApiOperation({
    summary:
      'Existing/in-app users get their Previous HotTakes(i.e only the ones they reacted to)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Previous Hot Takes fetched ',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiQuery({
    name: 'filter',
    required: false,
    enum: FILTERS,
    description: 'Filters (optional)',
  })
  async getPreviousTakes(
    @Query('username') username: string,
    @Query('filter') filter?: FILTERS,
    @Query() pagination?: PaginationFilterDTO,
  ): Promise<BaseResponseTypeDTO> {
    const result = await this.hottakesService.getPreviousTakes(
      username,
      filter,
      pagination,
    );
    return result;
  }

  @Get('sent/to/user/count')
  @ApiOperation({
    summary:
      'Count Of Takes Sent to a user(Number of hottakes in-app users recieved)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Total count of takes to user fetched ',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  async getTakesForUserCount(
    @Query('username') username: string,
  ): Promise<BaseResponseTypeDTO> {
    const result = await this.hottakesService.getTakesForUserCount(username);
    return result;
  }

  @Delete(':id')
  @ApiOperation({ summary: ' Delete a hottake by hottake Id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'hot take Deleted' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async deleteTake(@Param('id') id: string) {
    const result = await this.hottakesService.deleteTake(id);
    return result;
  }

  @Get('my-posted/takes')
  @ApiOperation({
    summary: 'User fetch all their posted takes',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User fetch all their posted takes ',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  async getMyTakes(
    @Query('username') username: string,
    @Query() pagination?: PaginationFilterDTO,
  ): Promise<BaseResponseTypeDTO> {
    const result = await this.hottakesService.getMyTakes(username, pagination);
    return result;
  }

  @Get('stats/by/username')
  @ApiOperation({
    summary: 'User see their hottakes statistics',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User see their hottakes statistics',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  async getTakesStats(
    @Query('username') username: string,
  ): Promise<BaseResponseTypeDTO> {
    const result = await this.hottakesService.getTakesStats(username);
    return result;
  }
}
