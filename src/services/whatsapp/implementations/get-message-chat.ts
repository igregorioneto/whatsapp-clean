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
    .find({ chatId: chatId + '@s.whatsapp.net', userId: numberUserIntegration + '@s.whatsapp.net' })
    .sort({ "timestamp": -1 })
    .skip(skip)
    .limit(limit)
    .exec();
  const totalMessages = await messageModel
    .countDocuments({ chatId: chatId + '@s.whatsapp.net', userId: numberUserIntegration + '@s.whatsapp.net' });
  return {
    data: messages.map(group => ({
      id: group._id, 
      message: group.body,
      isMine: group.isMine,
      isViewed: group.isViewed,
      isDelivered: group.isDelivered,
      hour: group.hour,
      userId: group.userId.split('@')[0]
    })),
    currentPage: page,
    totalPages: Math.ceil(totalMessages / limit),
    totalMessages,
  }
}