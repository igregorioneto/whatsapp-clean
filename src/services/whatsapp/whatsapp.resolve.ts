import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { WhatsappService } from './whatsapp.service';
import { GraphQLJSONObject } from 'graphql-type-json';
import { IntegrationResult } from './integration-type';

@Resolver()
export class WhatsappResolver {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Query(() => String, { nullable: true })
  async getQrCodeImage(): Promise<string | null> {
    try {      
      const qrCodeImageUrl = await this.whatsappService.getQrCodeImageUrl();
      console.log(qrCodeImageUrl)
      return qrCodeImageUrl;
    } catch (error) {
      console.error('Erro ao buscar QR Code:', error);
      return null;
    }
  }

  @Query(() => [GraphQLJSONObject])
  async getMessages(@Args('chatId') chatId: string) {
    try {
      return await this.whatsappService.getMessages(chatId);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      return [];
    }
  }

  @Query(() => [GraphQLJSONObject])
  async getAllMessages() {
    try {
      return await this.whatsappService.getAllMessages();
    } catch (error) {
      console.error('Erro ao buscar todas as mensagens:', error);
      return {};
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
