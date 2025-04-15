import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { BaseResponseTypeDTO } from 'src/utils';
import { User } from './entities/user.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Token } from 'src/token/schema/token.schema';
import { TokenService } from 'src/token/token.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async createUser(dto: CreateUserDto): Promise<BaseResponseTypeDTO> {
    const username = dto.username.toLowerCase();
    await this.findByUsername(username);
    const profilelink = await this.generateProfileUrl(username);
    const user = new this.userModel({
      username,
      user_link: profilelink,
    });
    await user.save();
    const socials = await this.getShareUrls(username);
    user.whatsappShare= socials.whatsappShareUrl
    user.twitterShare= socials.twitterShareUrl
    const data = await user.save();

    return {
      data,
      success: true,
      code: HttpStatus.CREATED,
      message: 'User Created',
    };
  }

  async findByUsername(name: string) {
    try {
      const user = await this.userModel.findOne({ username: name });
      if (user) {
        throw new NotFoundException(`Username already exist.`);
      }
    } catch (ex) {
      throw ex;
    }
  }

  async findAllUsers(): Promise<BaseResponseTypeDTO> {
    try {
      const user = await this.userModel.find().sort({ createdAt: -1 });
      if (!user) {
        return {
          data: [],
          success: true,
          code: HttpStatus.OK,
          message: 'No User Found',
        };
      }
      return {
        totalCount: user.length,
        data: user,
        success: true,
        code: HttpStatus.OK,
        message: 'Users fetched',
      };
    } catch (ex) {
      throw ex;
    }
  }

  generateProfileUrl(username: string): string {
    const baseUrl = process.env.APP_BASE_URL;
    return `${baseUrl}/profile/${encodeURIComponent(username.toLowerCase())}`;
  }

  async getShareUrls(name: string) {
    const username = name.toLowerCase();
    const user = await this.userModel.findOne({ username });
    if (!user) throw new NotFoundException(`User not found.`);

    const profileUrl = user.user_link;

    const whatsappMessage = `Send me an anonymous hot take: ${profileUrl}`;
    const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

    const tweetText = `Send me your hottest anonymous takes!`;
    const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(profileUrl)}`;

    return {
      profileUrl,
      whatsappShareUrl,
      twitterShareUrl,
    };
  }
}
