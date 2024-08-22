import { Model } from 'mongoose';
import { Message as MongoMessage } from '../../../models/message.schema';
import winstonLogger from 'src/config/winston.config';

export async function getMessages(messageModel: Model<MongoMessage>, numberUserIntegration: string, chatId: string) {
  const messages = await messageModel.find({ chatId, userId: numberUserIntegration + '@s.whatsapp.net'}).exec();
  winstonLogger.info(`Mensagens carregadas do getMessages: ${JSON.stringify(messages)}`);
  return messages.map((message, index) => ({
      id: message._id.toString(),
      message: message.body,
      isMine: message.from !== chatId,
      isViewed: true,
      isDelivered: true,
      hour: new Date(message.timestamp).toLocaleTimeString()
  }));
}