import { forwardRef, Module } from '@nestjs/common';
import { CronWork, HottakesService } from './hottakes.service';
import { HottakesController } from './hottakes.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { HotTake, HotTakeSchema } from './entities/hottake.entity';
import { User, UserSchema } from 'src/users/entities/user.entity';
import { UsersModule } from 'src/users/users.module';
import {
  Notifications,
  NotificationsSchema,
} from 'src/notification/entities/notification.entity';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: HotTake.name, schema: HotTakeSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => UsersModule),

    MongooseModule.forFeature([
      { name: Notifications.name, schema: NotificationsSchema },
    ]),
    forwardRef(() => NotificationModule),
  ],

  controllers: [HottakesController],
  providers: [HottakesService, CronWork],
  exports: [HottakesService, CronWork],
})
export class HottakesModule {}
