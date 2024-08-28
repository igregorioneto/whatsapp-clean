import { Model } from 'mongoose';
import { Message as MongoMessage } from '../../../models/message.schema';
import winstonLogger from 'src/config/winston.config';

export async function getMessages(
  messageModel: Model<MongoMessage>,
  numberUserIntegration: string,
  chatId: string,
  page: number = 1,
  limit: number = 10
) {
  const skip = (page - 1) * limit;
  const messages = await messageModel
    .find({ chatId: numberUserIntegration, userId: chatId + '@s.whatsapp.net' })
    .skip(skip)
    .limit(limit)
    .exec();
  const totalMessages = await messageModel
    .countDocuments({ chatId: numberUserIntegration, userId: chatId + '@s.whatsapp.net' });
  winstonLogger.info(`Mensagens carregadas do getMessages: ${JSON.stringify(messages)}`);
  return {
    data: messages,
    currentPage: page,
    totalPages: Math.ceil(totalMessages / limit),
    totalMessages,
  }
}