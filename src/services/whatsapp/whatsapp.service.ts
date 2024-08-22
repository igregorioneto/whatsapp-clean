import { Injectable, OnModuleInit } from '@nestjs/common';
import { WhatsappWebClient } from './implementations/whatsapp-web-client';
import { Message as MongoMessage } from '../../models/message.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { NumberIntegration } from './implementations/number-integration';
import { sendMessage } from './implementations/send-message';
import { getMessages } from './implementations/get-message-chat';
import { getAllMessages } from './implementations/get-all-messages';

@Injectable()
export class WhatsappService implements OnModuleInit {
  private readonly client: WhatsappWebClient;

  constructor(
    @InjectModel('Message') private readonly messageModel: Model<MongoMessage>,
    private readonly numberIntegration: NumberIntegration
  ) {
    this.client = new WhatsappWebClient(this.messageModel, this.numberIntegration);
  }

  onModuleInit() {
    this.client.initializeClient();
  }

  async verifyNumberIntegrationIsCorrect(chatId: string) {
    const result = await this.numberIntegration.verifyNumberIntegrationIsCorrect(chatId);
    if (!result.status) {
      this.client.initializeClient();
    }
    return result;
  }

  async sendMessage(to: string, message: string): Promise<void> {
    await sendMessage(to, message);
  }

  async getMessages(chatId: string) {
    return await getMessages(chatId);
  }

  async getAllMessages() {
    return await getAllMessages();
  }

  async getQrCodeImageUrl(): Promise<string | null> {
    return await this.client.getQrCodeImageUrl();
  }
}
