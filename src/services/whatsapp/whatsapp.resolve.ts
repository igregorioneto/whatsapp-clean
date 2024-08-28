import { Resolver, Query, Args, Mutation, InputType, Field, ObjectType } from '@nestjs/graphql';
import { WhatsappService } from './whatsapp.service';
import { GraphQLJSONObject } from 'graphql-type-json';
import { IntegrationResult } from './integration-type';

@InputType()
export class GetAllMessageOptions {
  @Field({ nullable: true })
  messageStatus?: string;
}

@ObjectType()
class MessageInfo {
  @Field(() => String, { nullable: true })
  id?: string;

  @Field(() => String, { nullable: true })
  userStatus?: string;

  @Field(() => String, { nullable: true })
  from?: string;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  lastMessage?: string;

  @Field(() => Boolean, { nullable: true })
  isMine?: boolean;

  @Field(() => String, { nullable: true })
  type?: string;

  @Field(() => String, { nullable: true })
  messageStatus?: string;

  @Field(() => Date, { nullable: true })
  lastMessageTime?: Date;

  @Field(() => Number, { nullable: true })
  newMessagesAmount?: number;

  @Field(() => String, { nullable: true })
  profilePictureUrl?: string;

  @Field(() => String, { nullable: true })
  userId?: string;
}

@ObjectType()
class GetAllMessagesResponse {
  @Field(() => [MessageInfo])
  data: MessageInfo[];

  @Field(() => Number)
  currentPage: number;

  @Field(() => Number)
  totalPages: number;

  @Field(() => Number)
  totalMessages: number;
}

@Resolver()
export class WhatsappResolver {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Query(() => String, { nullable: true })
  async getQrCodeImage(@Args('chatId') chatId: string): Promise<string | null> {
    try {      
      return await this.whatsappService.getQrCodeImageUrl(chatId);
    } catch (error) {
      console.error('Erro ao buscar QR Code:', error);
      return null;
    }
  }

  @Query(() => GraphQLJSONObject, { nullable: true })
  async createClientForUser(@Args('chatId') chatId: string) {
    try {      
      await this.whatsappService.createClientForUser(chatId);
      return {message: `Cliente para o número ${chatId} inicializado com sucesso`, success: true}
    } catch (error) {
      console.error(`Erro ao criar cliente para o número ${chatId}: ${JSON.stringify(error)}`);
      return {message: `Erro ao criar cliente para o número ${chatId}: ${JSON.stringify(error)}`, success: false}
    }
  }

  @Query(() => GraphQLJSONObject)
  async getMessages(
    @Args('numberIntegrated') numberIntegrated: string,
    @Args('chatId') chatId: string,
    @Args('page', { type: () => Number, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Number, defaultValue: 10 }) limit: number,
  ) {
    try {
      const result = await this.whatsappService.getMessages(numberIntegrated, chatId, page, limit);
      return {...result};
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      return {message: `Erro ao buscar mensagens: ${error}`};
    }
  }

  @Query(() => GraphQLJSONObject)
  async getAllMessages(
    @Args('chatId') chatId: string,
    @Args('page', { type: () => Number, defaultValue: 1 }) page?: number, 
    @Args('limit', { type: () => Number, defaultValue: 10 }) limit?: number,
    @Args('options', { type: () => GetAllMessageOptions, defaultValue: 10 }) options?: GetAllMessageOptions
  ) {
    try {
      const result = await this.whatsappService.getAllMessages(chatId, page, limit, options);
      return {...result};
    } catch (error) {
      console.error('Erro ao buscar todas as mensagens:', error);
      return [{message: `Erro ao buscar todas as mensagens: ${error}`}];
    }
  }

  @Mutation(() => IntegrationResult)
  async verifyNumberIntegrationIsCorrect(@Args('chatId') chatId: string) {
    try {
      return await this.whatsappService.verifyNumberIntegrationIsCorrect(chatId);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      return 'Erro ao enviar mensagem.';
    }
  }

  @Mutation(() => String)
  async sendMessage(
    @Args('to') to: string,
    @Args('message') message: string
  ): Promise<string> {
    try {
      await this.whatsappService.sendMessage(to, message);
      return 'Mensagem enviada com sucesso!';
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      return 'Erro ao enviar mensagem.';
    }
  }
}
