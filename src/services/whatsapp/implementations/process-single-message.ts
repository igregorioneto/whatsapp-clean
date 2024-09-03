import { saveMessageToMongo } from "./save-message-chat";

export default async function processSingleMessage(message: any, chatId: string, messageModel: any, chat?: any, userId?: string) {
  const messageWithKey = message as unknown as {
      key: { id: string, remoteJid: string, fromMe?: boolean };
      message: { conversation?: string };
      messageTimestamp?: { low: number, unsigned: boolean };
  };

  if (
    messageWithKey.key && 
    messageWithKey.key.id && 
    messageWithKey.key.remoteJid &&
    messageWithKey.message && 
    messageWithKey.message.conversation) {
      await saveMessageToMongo(messageModel, {
          chatId: messageWithKey.key.remoteJid,
          messageId: messageWithKey.key.id,
          body: messageWithKey.message?.conversation || '',
          from: messageWithKey.key.remoteJid || '',
          timestamp: messageWithKey.messageTimestamp?.low ? new Date(messageWithKey.messageTimestamp?.low * 1000) : new Date(),
          isMine: messageWithKey.key.fromMe || false,
          isViewed: messageWithKey.messageTimestamp?.unsigned || false,
          isDelivered: true,
          hour: new Date(messageWithKey.messageTimestamp?.low * 1000).toLocaleTimeString(),
          userStatus: chat?.userStatus || '',
          name: chat?.name || '',
          type: chat?.type || '',
          messageStatus: chat?.messageStatus || '',
          lastMessageTime: chat?.lastMessageTime || '',
          newMessagesAmount: chat?.newMessagesAmount || 0,
          profilePictureUrl: '',
          userId: userId ? `${userId}@s.whatsapp.net` : ''
      });
  }
}