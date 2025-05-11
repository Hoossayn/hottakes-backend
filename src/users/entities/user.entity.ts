import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsEmail } from "class-validator";

@Schema({ timestamps: true })
export class User {
@Prop()
username: string

@Prop()
@IsEmail()
email?: string

@Prop()
picture?: string

@Prop()
googleId?: string

@Prop() 
token?: string

@Prop()
user_link: string

@Prop()
whatsappShare: string

@Prop()
twitterShare: string
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
