import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateHottakeDto, PostHottakeDto } from './dto/create-hottake.dto';
import {
  BaseResponseTypeDTO,
  IPaginationFilter,
  PaginationFilterDTO,
} from 'src/utils';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/users/entities/user.entity';
import { Model } from 'mongoose';
import { FILTERS, HotTake } from './entities/hottake.entity';
import * as cron from 'node-cron'; // Ensure this import is present
import { faker } from '@faker-js/faker';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class HottakesService {
  constructor(
    @InjectModel(HotTake.name) private readonly hotTakeModel: Model<HotTake>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly notiSrv: NotificationService
  ) {}

  async createHottakes(dto: CreateHottakeDto): Promise<BaseResponseTypeDTO> {
    const recipientUsername = dto.to.toLowerCase();
    let sender = dto.sender?.toLowerCase();

    const recipient = await this.userModel.findOne({
      username: recipientUsername,
    });
    if (!recipient) {
      throw new NotFoundException(`Recipient user not found.`);
    }

    const senderr = await this.userModel.findOne({
      username: sender,
    });
    if (!senderr) {
      sender = 'anonymous';
    }

    const hottake = new this.hotTakeModel({
      ...dto,
      recipientUsername: recipient.username,
      sender,
    });
    await hottake.save();

    const payload = {
      recipientUsername: recipient.username,
      username: senderr?.username ?? 'anonymous',
      content: {hottakeId: hottake._id},
      title: `Received a hot take for ${recipient.username}`,
      contentType: 'Post'

    }
    await this.notiSrv.createNotifiction(payload)

    // const takeUrl = await this.generateTakeUrl(hottake._id.toString());
    // hottake.takeUrl = takeUrl;
    // await hottake.save();
    const data = await hottake.save();

    return {
      data,
      success: true,
      code: HttpStatus.CREATED,
      message: 'HotTake Created',
    };
  }

  async postHottakes(dto: PostHottakeDto): Promise<BaseResponseTypeDTO> {
    const username = dto.sender.toLowerCase();
    const user = await this.userModel.findOne({ username });
    if (!user) throw new NotFoundException(`User not found.`);

    const hottake = new this.hotTakeModel({
      ...dto,
      sender: user.username,
    });
    await hottake.save();

    // const takeUrl = await this.generateTakeUrl(hottake._id.toString());
    // hottake.takeUrl = takeUrl;
    // await hottake.save();
    const data = await hottake.save();

    return {
      data,
      success: true,
      code: HttpStatus.CREATED,
      message: 'HotTake Created',
    };
  }

  async getTakesForUser(
    username: string,
    pagination?: PaginationFilterDTO,
    filter?: FILTERS,
  ): Promise<BaseResponseTypeDTO> {
    username = username.toLocaleLowerCase();
    const user = await this.userModel.findOne({ username });
    if (!user) throw new NotFoundException(`User not found.`);

    const page = Number(pagination?.page) || 1;
    const limit = Number(pagination?.limit) || 50;
    const skip = (page - 1) * limit;

    let hottakes: any[];
    const matchUserTakes = {
      recipientUsername: username,
    };

    switch (filter) {
      case 'trending':
        hottakes = await this.hotTakeModel.aggregate([
          { $match: matchUserTakes },
          {
            $addFields: {
              totalReactions: {
                $add: [
                  { $ifNull: ['$valid', 0] },
                  { $ifNull: ['$spicy', 0] },
                  { $ifNull: ['$trash', 0] },
                  { $ifNull: ['$mid', 0] },
                ],
              },
            },
          },
          { $sort: { totalReactions: -1 } },
          { $skip: skip },
          { $limit: limit },
        ]);
        break;

      case 'controversial':
        hottakes = await this.hotTakeModel.aggregate([
          { $match: matchUserTakes },
          {
            $addFields: {
              valid: { $ifNull: ['$valid', 0] },
              spicy: { $ifNull: ['$spicy', 0] },
              trash: { $ifNull: ['$trash', 0] },
              mid: { $ifNull: ['$mid', 0] },
            },
          },
          {
            $addFields: {
              positive: { $add: ['$valid', '$spicy'] },
              negative: { $add: ['$trash'] },
              totalReactions: {
                $add: ['$valid', '$spicy', '$trash', '$mid'],
              },
            },
          },
          { $match: { totalReactions: { $gte: 10 } } },
          {
            $addFields: {
              polarityScore: {
                $abs: {
                  $divide: [
                    { $subtract: ['$positive', '$negative'] },
                    '$totalReactions',
                  ],
                },
              },
            },
          },
          { $sort: { polarityScore: 1, createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
        ]);
        break;

      case 'newest':
      default:
        hottakes = await this.hotTakeModel
          .find(matchUserTakes)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec();
        break;
    }

    // Remove takes where the user has already reacted
    hottakes = hottakes.filter((hotTake) => {
      const reactedUser = hotTake.reactedUsers.find(
        (userReaction) => userReaction.username === username,
      );
      return !reactedUser;
    });

    return {
      totalCount: hottakes.length,
      data: hottakes,
      success: true,
      code: HttpStatus.OK,
      message: hottakes.length ? 'Hot Takes Fetched' : 'No Hot Takes',
    };
  }

  async getAllTakes(
    username: string,
    pagination?: IPaginationFilter,
    filter?: FILTERS,
  ): Promise<BaseResponseTypeDTO> {
    let hottakes: HotTake[];
    const matchStage = { isPublic: true };

    username = username.toLocaleLowerCase();
    const user = await this.userModel.findOne({ username });
    if (!user) throw new NotFoundException(`User not found.`);

    const page = Number(pagination?.page) || 1;
    const limit = Number(pagination?.limit) || 100;
    const skip = (page - 1) * limit;

    switch (filter) {
      case 'trending':
        // Trending = Top 5 takes with highest total reactions
        hottakes = await this.hotTakeModel.aggregate([
          {
            $addFields: {
              totalReactions: {
                $add: [
                  { $ifNull: ['$valid', 0] },
                  { $ifNull: ['$spicy', 0] },
                  { $ifNull: ['$trash', 0] },
                  { $ifNull: ['$mid', 0] },
                ],
              },
            },
          },
          { $match: { isPublic: true } },
          { $sort: { totalReactions: -1 } },
          { $skip: skip },
          { $limit: limit },
        ]);
        break;

      case 'controversial':
        hottakes = await this.hotTakeModel.aggregate([
          {
            $addFields: {
              valid: { $ifNull: ['$valid', 0] },
              spicy: { $ifNull: ['$spicy', 0] },
              trash: { $ifNull: ['$trash', 0] },
              mid: { $ifNull: ['$mid', 0] },
            },
          },
          {
            $addFields: {
              positive: { $add: ['$valid', '$spicy'] },
              negative: { $add: ['$trash'] },
              totalReactions: {
                $add: ['$valid', '$spicy', '$trash', '$mid'],
              },
            },
          },
          {
            $match: {
              totalReactions: { $gte: 10 },
              isPublic: true,
            },
          },
          {
            $addFields: {
              polarityScore: {
                $abs: {
                  $divide: [
                    { $subtract: ['$positive', '$negative'] },
                    '$totalReactions',
                  ],
                },
              },
            },
          },
          { $sort: { polarityScore: 1, createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
        ]);
        break;

      case 'newest':
        hottakes = await this.hotTakeModel
          .find({ isPublic: true })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec();
        break;

      default:
        hottakes = await this.hotTakeModel
          .find({ isPublic: true })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec();
        break;
    }

    const totalCount = await this.hotTakeModel.countDocuments(matchStage);


    return {
      totalCount,
      data: hottakes,
      success: true,
      code: HttpStatus.OK,
      message: hottakes.length ? 'Hot Takes Fetched' : 'No Hot Takes Available',
    };
  }

  async getSingleTake(id: string): Promise<BaseResponseTypeDTO> {
    const take = await this.hotTakeModel.findById(id);
    if (!take) throw new NotFoundException('Hot take not found');
    return {
      data: take,
      success: true,
      code: HttpStatus.OK,
      message: 'Take Fetched',
    };
  }

  async deleteTake(id: string): Promise<BaseResponseTypeDTO> {
    const take = await this.hotTakeModel.findById(id);
    if (!take) throw new NotFoundException('Hot take not found');
    await take.deleteOne();
    return {
      success: true,
      code: HttpStatus.OK,
      message: 'Take Deleted',
    };
  }

  async reactToHotTake(
    hotTakeId: string,
    reaction: string,
    username: string,
  ): Promise<BaseResponseTypeDTO> {
    const validReactions = ['spicy', 'trash', 'mid',  'valid'];
    username = username.toLowerCase();

    if (!validReactions.includes(reaction)) {
      throw new Error('Invalid reaction type');
    }

    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new NotFoundException(`User not found.`);
    }

    const hotTake = await this.hotTakeModel.findById(hotTakeId);
    if (!hotTake) throw new NotFoundException('Hot take not found');

    // Check if the user has already reacted
    const previousReaction = hotTake.reactedUsers.find(
      (reactedUser) => reactedUser.username === username,
    );

    if (previousReaction) {
      if (previousReaction.reaction === reaction) {
        // Same reaction => remove it (toggle off)
        hotTake[reaction] = Math.round(hotTake[reaction] - 1);
        // hotTake[reaction] -= 1;
        hotTake.reactedUsers = hotTake.reactedUsers.filter(
          (reactedUser) => reactedUser.username !== username,
        );

        await hotTake.save();

        return {
          success: true,
          code: HttpStatus.OK,
          message: `${reaction} removed`,
        };
      } else {
        // Different reaction => update it
        hotTake[previousReaction.reaction] = Math.round(hotTake[previousReaction.reaction] - 1);
        // hotTake[previousReaction.reaction] -= 1;
      }
    }

    // Add the new reaction count
    hotTake[reaction] += 1;

    // Update the user's reaction
    hotTake.reactedUsers = hotTake.reactedUsers.filter(
      (reactedUser) => reactedUser.username !== username,
    );
    hotTake.reactedUsers.push({ username, reaction });

    await hotTake.save();

    const payload = {
      recipientUsername: hotTake.sender,
      username: user.username,
      content: {hottakeId: hotTake._id, reaction: reaction},
      title: `${user.username} reacted (${reaction}) to your take`,
      contentType: 'Reaction'
    }
    
    await this.notiSrv.createNotifiction(payload)


    return {
      success: true,
      code: HttpStatus.OK,
      message: `${reaction} added`,
    };
  }

  async getTakesForUserCount(username: string): Promise<BaseResponseTypeDTO> {
    username = username.toLowerCase();
    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new NotFoundException(`User not found.`);
    }

    const hottakes = await this.hotTakeModel.find({
      recipientUsername: username,
    });

    return {
      totalCount: hottakes.length,
      success: true,
      code: HttpStatus.OK,
      message: hottakes.length > 0 ? 'Hot Takes Fetched' : 'No Hot Takes',
    };
  }

  async getPreviousTakes(
    username: string,
    filter?: FILTERS,
    pagination?: PaginationFilterDTO,
  ): Promise<BaseResponseTypeDTO> {
    const page = Number(pagination?.page) || 1;
    const limit = Number(pagination?.limit) || 50;
    const skip = (page - 1) * limit;

    username = username.toLowerCase();
    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new NotFoundException(`User not found.`);
    }

    let hottakes: HotTake[];

    const baseMatchStage = {
      reactedUsers: {
        $elemMatch: {
          username: username,
        },
      },
    };

    switch (filter) {
      case 'trending':
        hottakes = await this.hotTakeModel.aggregate([
          { $match: baseMatchStage },
          {
            $addFields: {
              totalReactions: {
                $add: [
                  { $ifNull: ['$valid', 0] },
                  { $ifNull: ['$spicy', 0] },
                  { $ifNull: ['$trash', 0] },
                  { $ifNull: ['$mid', 0] },
                ],
              },
            },
          },
          { $sort: { totalReactions: -1 } },
          { $skip: skip },
          { $limit: limit },
        ]);
        break;

      case 'controversial':
        hottakes = await this.hotTakeModel.aggregate([
          { $match: baseMatchStage },
          {
            $addFields: {
              valid: { $ifNull: ['$valid', 0] },
              spicy: { $ifNull: ['$spicy', 0] },
              trash: { $ifNull: ['$trash', 0] },
              mid: { $ifNull: ['$mid', 0] },
            },
          },
          {
            $addFields: {
              positive: { $add: ['$valid', '$spicy'] },
              negative: { $add: ['$trash'] },
              totalReactions: {
                $add: ['$valid', '$spicy', '$trash', '$mid'],
              },
            },
          },
          { $match: { totalReactions: { $gte: 10 } } },
          {
            $addFields: {
              polarityScore: {
                $abs: {
                  $divide: [
                    { $subtract: ['$positive', '$negative'] },
                    '$totalReactions',
                  ],
                },
              },
            },
          },
          { $sort: { polarityScore: 1, createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
        ]);
        break;

      case 'newest':
        hottakes = await this.hotTakeModel
          .find({
            'reactedUsers.username': username,
          })
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec();
        break;

      default:
        hottakes = await this.hotTakeModel
          .find({
            'reactedUsers.username': username,
          })
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec();
        break;
    }

    return {
      totalCount: hottakes.length,
      data: hottakes,
      success: true,
      code: HttpStatus.OK,
      message: hottakes.length ? 'Hot Takes Found' : 'No Hot Takes Available',
    };
  }

  generateTakeUrl(id: string): string {
    const baseUrl = process.env.APP_BASE_URL;
    return `${baseUrl}/${encodeURIComponent(id.toLowerCase())}`;
  }

  async createManyHottakes(dto: CreateHottakeDto[]): Promise<any> {
    try {
      const modifiedHottakes = dto.map((item) => ({
        ...item,
        recipientUsername: item.to,
      }));

      const result = await this.hotTakeModel.insertMany(modifiedHottakes);

      return result;
    } catch (error) {
      console.error('Error inserting hottakes:', error);
      throw error;
    }
  }

  async getMyTakes(
    username: string,
    pagination?: PaginationFilterDTO,
    filter?: FILTERS,
  ): Promise<BaseResponseTypeDTO> {
    username = username.toLocaleLowerCase();
    const user = await this.userModel.findOne({ username });
    if (!user) throw new NotFoundException(`User not found.`);

    const page = Number(pagination?.page) || 1;
    const limit = Number(pagination?.limit) || 50;
    const skip = (page - 1) * limit;

    let hottakes: any[];
    const matchUserTakes = {
      sender: username,
    };

    switch (filter) {
      case 'trending':
        hottakes = await this.hotTakeModel.aggregate([
          { $match: matchUserTakes },
          {
            $addFields: {
              totalReactions: {
                $add: [
                  { $ifNull: ['$valid', 0] },
                  { $ifNull: ['$spicy', 0] },
                  { $ifNull: ['$trash', 0] },
                  { $ifNull: ['$mid', 0] },
                ],
              },
            },
          },
          { $sort: { totalReactions: -1 } },
          { $skip: skip },
          { $limit: limit },
        ]);
        break;

      case 'controversial':
        hottakes = await this.hotTakeModel.aggregate([
          { $match: matchUserTakes },
          {
            $addFields: {
              valid: { $ifNull: ['$valid', 0] },
              spicy: { $ifNull: ['$spicy', 0] },
              trash: { $ifNull: ['$trash', 0] },
              mid: { $ifNull: ['$mid', 0] },
            },
          },
          {
            $addFields: {
              positive: { $add: ['$valid', '$spicy'] },
              negative: { $add: ['$trash'] },
              totalReactions: {
                $add: ['$valid', '$spicy', '$trash', '$mid'],
              },
            },
          },
          { $match: { totalReactions: { $gte: 10 } } },
          {
            $addFields: {
              polarityScore: {
                $abs: {
                  $divide: [
                    { $subtract: ['$positive', '$negative'] },
                    '$totalReactions',
                  ],
                },
              },
            },
          },
          { $sort: { polarityScore: 1, createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
        ]);
        break;

      case 'newest':
      default:
        hottakes = await this.hotTakeModel
          .find(matchUserTakes)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec();
        break;
    }

    return {
      totalCount: hottakes.length,
      data: hottakes,
      success: true,
      code: HttpStatus.OK,
      message: hottakes.length ? 'Hot Takes Fetched' : 'No Hot Takes',
    };
  }

  async getTakesStats(username: string): Promise<BaseResponseTypeDTO> {
    username = username.toLocaleLowerCase();
    const user = await this.userModel.findOne({ username });
    if (!user) throw new NotFoundException(`User not found.`);

    const allTakes = await this.hotTakeModel.find({});

    const takesReceived = allTakes.filter(
      (take) => take.recipientUsername?.toLowerCase() === username,
    );

    const takesPosted = allTakes.filter(
      (take) => take.sender?.toLowerCase() === username,
    );

    let totalReactions = 0;
    for (const take of takesPosted) {
      const {
        cold = 0,
        trash = 0,
        mid = 0,
        valid = 0,
        spicy = 0,
        hot = 0,
      } = take;
      totalReactions += trash + mid + valid + spicy;
    }

    return {
      data: {
        takesReceived: takesReceived.length,
        takesPosted: takesPosted.length,
        totalReactions: totalReactions,
      },
      success: true,
      code: HttpStatus.OK,
      message: '',
    };
  }
}

@Injectable()
export class CronWork {
  constructor(
    @InjectModel(HotTake.name) private readonly hotTakeModel: Model<HotTake>,
    private readonly hottakeSrv: HottakesService,
  ) {
    this.scheduleJobs();
  }

  private scheduleJobs() {
    // cron.schedule('* * * * *', async () => {
    //   console.log('🚀 Running scheduled job to create hottakes...');
    //   const categories = ['Sport', 'Entertainment', 'politics'];
    //   const hottakes = Array.from({ length: 1000 }, () => ({
    //     content: faker.hacker.phrase(),
    //     category: categories[Math.floor(Math.random() * categories.length)],
    //     sender: faker.person.lastName().toLocaleLowerCase(),
    //     to: faker.person.lastName().toLocaleLowerCase(),
    //     isPublic: true,
    //   }));
    //   //   const hottakesToDelete = await this.hotTakeModel.find()
    //   //   .sort({ createdAt: -1 })
    //   //   .limit(1000);
    //   // const idsToDelete = hottakesToDelete.map(hottake => hottake._id);
    //   // if (idsToDelete.length > 0) {
    //   //   await this.hotTakeModel.deleteMany({ _id: { $in: idsToDelete } });
    //   //   console.log(`Deleted ${idsToDelete.length} hottakes.`);
    //   // }
    // await this.hottakeSrv.createManyHottakes(hottakes);
    //   console.log('created hottakes...');
    // });
  }
}
