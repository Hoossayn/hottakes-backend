import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export class ContentObj {
  @Prop({ ref: 'HotTake' })
  @Prop()
  reaction?: string;
  
  @Prop()
  takeContent?: string;

  @Prop()
  hottakeId?: string;

  @Prop()
  sender?: string;

}

@Schema({ timestamps: true })
export class Notifications {
  @Prop()
  receipiantUsername: string;

  @Prop()
  content: ContentObj;

  @Prop()
  contentType: string;

  @Prop()
  deviceId?: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ ref: 'User' })
  receiverId: string;

  @Prop({ ref: 'User' })
  senderId: string;
}

export type NotificationsDocument = Notifications & Document;
export const NotificationsSchema = SchemaFactory.createForClass(Notifications);
