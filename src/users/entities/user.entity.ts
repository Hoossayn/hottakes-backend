import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ timestamps: true })
export class User {
@Prop()
username: string

@Prop()
user_link: string

@Prop()
whatsappShare: string

@Prop()
twitterShare: string
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
