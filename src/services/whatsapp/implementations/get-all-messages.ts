import { Model } from 'mongoose';
import { Message as MongoMessage } from '../../../models/message.schema';
import winstonLogger from 'src/config/winston.config';

export async function getAllMessages(messageModel: Model<MongoMessage>, numberUserIntegration: string) {
  winstonLogger.info(numberUserIntegration + '@s.whatsapp.net')
  const messages = await messageModel.find({ userId: numberUserIntegration + '@s.whatsapp.net' }).exec();
  return messages.map((message, index) => ({
    id: index + 1,
    userStatus: message.userStatus || 'offline',
    name: message.name || 'Unknown',
    lastMessage: message.body,
    type: message.type || 'Personal',
    messageStatus: message.messageStatus || 'Aberto',
    lastMessageTime: message.lastMessageTime || 'há algum tempo',
    newMessagesAmount: message.newMessagesAmount || 0,
    userId: message.userId || ''
  }));
}