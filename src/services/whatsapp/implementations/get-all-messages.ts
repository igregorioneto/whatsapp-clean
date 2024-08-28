import { Model } from 'mongoose';
import { Message as MongoMessage } from '../../../models/message.schema';
import winstonLogger from 'src/config/winston.config';

export interface GetAllMessageOptions {
  messageStatus?: string;
}

export async function getAllMessages(
  messageModel: Model<MongoMessage>,
  numberUserIntegration: string,
  page: number = 1,
  limit: number = 10,
  options: GetAllMessageOptions = {}
) {
  winstonLogger.info(numberUserIntegration + '@s.whatsapp.net')
  const skip = (page - 1) * limit;

  const matchFilter: any = { userId: numberUserIntegration + '@s.whatsapp.net' };
  if (options.messageStatus) {
    matchFilter.messageStatus = options.messageStatus;
  }

  const messages = await messageModel
    .aggregate([
      { $match: matchFilter },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$from",
          lastMessage: { $first: "$$ROOT" }
        }
      },
      { $sort: { "lastMessage.timestamp": -1 } },
      { $skip: skip },
      { $limit: limit }
    ])
    .exec();

  const totalMessages = await messageModel
    .aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$from",
          lastMessage: { $first: "$$ROOT" }
        }
      },
      { $count: "total" }
    ])
    .exec()
    .then(result => (result.length > 0 ? result[0].total : 0));

  return {
    data: messages.map(group => group.lastMessage),
    currentPage: page,
    totalPages: Math.ceil(totalMessages / limit),
    totalMessages,
  };
}