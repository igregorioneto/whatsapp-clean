import { Model } from 'mongoose';
import { Message as MongoMessage } from '../../../models/message.schema';
import winstonLogger from 'src/config/winston.config';
import { formatMessage } from 'src/utils/format-message';

export interface GetAllMessageOptions {
  messageStatus?: string;
}

export async function getAllMessages(
  messageModel: Model<MongoMessage>,
  numberUserIntegration: string
) {
  winstonLogger.info(numberUserIntegration + '@s.whatsapp.net')

  const matchFilter: any = { userId: numberUserIntegration + '@s.whatsapp.net' };

  const messages = await messageModel
    .aggregate([
      { $match: matchFilter },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$from",
          lastMessage: { $first: "$$ROOT" },
          totalUnread: { $sum: "$newMessagesAmount" }
        }
      },
      { $sort: { "lastMessage.timestamp": -1 } }
    ])
    .exec();

  return {
    data: messages.map(group => ({
      id: group._id,
      userStatus: group.lastMessage.userStatus,
        name: group.lastMessage.name.includes('@') 
          ? group.lastMessage.name.split('@')[0]
          : (group.lastMessage.name || group.lastMessage.from.split('@')[0]),
      lastMessage: formatMessage(group.lastMessage.body),
      type: group.lastMessage.type,
      messageStatus: group.lastMessage.messageStatus,
      lastMessageTime: group.lastMessage.lastMessageTime,
      newMessagesAmount: group.totalUnread,
      avatar: group.lastMessage.profilePictureUrl,
      isDelivered: group.lastMessage.isDelivered,
      isMine: group.lastMessage.isMine,
      isViewed: group.lastMessage.isViewed,
      phoneNumber: group.lastMessage.from.split('@')[0],
      markedAsUnread: group.lastMessage.markedAsUnread,
      messageIsNew: group.lastMessage.messageIsNew,
      userId: group.lastMessage.userId.split('@')[0]
    }))
  };
}