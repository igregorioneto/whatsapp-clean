import { Model } from 'mongoose';
import { Message as MongoMessage } from '../../../models/message.schema';
import winstonLogger from 'src/config/winston.config';

export async function getAllMessages(
  messageModel: Model<MongoMessage>, 
  numberUserIntegration: string,
  page: number = 1,
  limit: number = 10
) {
  winstonLogger.info(numberUserIntegration + '@s.whatsapp.net')
  const skip = (page - 1) * limit;
  const messages = await messageModel
    .find({ userId: numberUserIntegration + '@s.whatsapp.net' })
    .skip(skip)
    .limit(limit)
    .exec();
  const totalMessages = await messageModel
    .countDocuments({ userId: numberUserIntegration + '@s.whatsapp.net' });
  return {
    data: messages.map((message, index) => ({
      id: message._id.toString(),
      userStatus: message.userStatus || 'offline',
      name: message.name || 'Unknown',
      lastMessage: message.body,
      type: message.type || 'Personal',
      messageStatus: message.messageStatus || 'Aberto',
      lastMessageTime: message.lastMessageTime || 'há algum tempo',
      newMessagesAmount: message.newMessagesAmount || 0,
      userId: message.userId || ''
    })),
    currentPage: page,
    totalPages: Math.ceil(totalMessages / limit),
    totalMessages,
  };
}