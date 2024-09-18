import { Injectable, OnModuleInit } from '@nestjs/common';
import { WhatsappWebClient } from './implementations/whatsapp-web-client';
import { Message as MongoMessage } from '../../models/message.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { NumberIntegration } from './implementations/number-integration';
import { sendMessage } from './implementations/send-message';
import { getMessages } from './implementations/get-message-chat';
import { GetAllMessageOptions, getAllMessages } from './implementations/get-all-messages';
import winstonLogger from 'src/config/winston.config';
import { logout } from './implementations/logout';
import { deletingMessage } from './implementations/deleting-message';
import { MessageInputDto } from './dto/message-input.dto';

@Injectable()
export class WhatsappService implements OnModuleInit {
  private readonly clientMap: Map<string, WhatsappWebClient> = new Map();

  constructor(
    @InjectModel('Message') private readonly messageModel: Model<MongoMessage>,
    private readonly numberIntegration: NumberIntegration
  ) { }

  onModuleInit() {}

  async createClientForUser(chatId: string): Promise<WhatsappWebClient> {
    const existingClient = this.clientMap.get(chatId);
    if (existingClient) {
      return existingClient;
    }
    const newClient = new WhatsappWebClient(this.messageModel, this.numberIntegration);
    await newClient.initializeClient(chatId);
    this.clientMap.set(chatId, newClient);
    return newClient;
  }

  async verifyNumberIntegrationIsCorrect(chatId: string) {
    const client = await this.createClientForUser(chatId);
    const result = await this.numberIntegration.verifyNumberIntegrationIsCorrect(chatId);
    if (!result.status && result.info === 'Número vinculado ao QR Code diferente do integrado. Verifique o número e tente novamente.') {
      await client.initializeClient(chatId); // Reinicializa o client associado
    }
    return result;
  }

  async sendMessage(numberIntegrated: string, to: string, message: string): Promise<void> {
    const client = await this.createClientForUser(numberIntegrated);
    const target = client.getClients().get(numberIntegrated);    
    if (!target) {
      throw new Error(`Client para ${numberIntegrated} não encontrado no mapa.`);
    }
    await sendMessage(target, to, message, numberIntegrated, this.messageModel);
  }

  async getMessages(numberIntegrated: string, chatId: string, page: number = 1, limit: number = 10) {
    const numberIntegration = this.numberIntegration.getNumberIntegration(numberIntegrated);
    return await getMessages(this.messageModel, numberIntegration, chatId, page, limit);
  }

  async getAllMessages(chatId: string) {
    const numberIntegration = this.numberIntegration.getNumberIntegration(chatId);
    return await getAllMessages(this.messageModel, numberIntegration);
  }

  async getQrCodeImageUrl(chatId: string): Promise<string | null> {
    const client = await this.createClientForUser(chatId);
    return await client.getQrCodeImageUrl(chatId);
  }

  async logout(numberIntegrated: string) {
    const target = this.clientMap.get(numberIntegrated).getClients().get(numberIntegrated);
    if (target) {
      await logout(target, numberIntegrated);
      return;
    }
    throw new Error(`Erro ao deslogar número integrado ${numberIntegrated}`); 
  }

  async deletingMessage(
    numberIntegrated: string,
    messages: [MessageInputDto]
  ) {
    const target = this.clientMap.get(numberIntegrated).getClients().get(numberIntegrated);
    if (target) {
      await deletingMessage(
        target, 
        this.messageModel, 
        numberIntegrated,
        messages
      );
      return;
    }
    throw new Error(`Erro deletar mensagem do numero`); 
  }
}
