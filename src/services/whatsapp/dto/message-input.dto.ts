import { Args, Field, InputType } from "@nestjs/graphql";

@InputType()
export class MessageInputDto {
  @Field(() => String)
  messageId: string;
  @Field(() => String)
  chatId: string;
  @Field(() => Boolean)
  fromMe: boolean;
}