import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum Category {
  ENTERTAINMENT = 'Entertainment',
  FOOD = 'Food',
  GAMING = 'Gaming',
  SOCIETY = 'Society',
  SPORT = 'Sport',
  POLITICS = 'politics',
}

export enum REACTIONS {
  SPICY = 'spicy',
  MID = 'mid',
  TRASH = 'trash',
  VALID = 'valid',
}

export enum FILTERS {
  NEWEST = 'newest',
  TRENDING = 'trending',
  CONTROVERSIAL = 'controversial',
}

export class REACTIONSOBJ {
  @Prop()
  username: string;
  @Prop()
  reaction: string;
}

@Schema({ timestamps: true })
export class HotTake {
  @Prop({ required: true })
  content: string;

  @Prop({ enum: Category })
  category?: Category;

  @Prop({ default: 0 })
  hot: number;

  @Prop({ default: 0 })
  spicy: number;

  @Prop({ default: 0 })
  trash: number;

  @Prop({ default: 0 })
  mid: number;

  @Prop({ default: 0 })
  valid: number;

  @Prop({ default: 0 })
  cold: number;

  @Prop({ default: false })
  isFlagged?: boolean;

  @Prop()
  sender?: string;

  @Prop()
  reactedUsers?: REACTIONSOBJ[];

  @Prop()
  recipientUsername?: string;

  @Prop()
  takeUrl?: string;

  @Prop({default: true})
  isPublic?: boolean;

}

export type HotTakeDocument = HotTake & Document;
export const HotTakeSchema = SchemaFactory.createForClass(HotTake);
