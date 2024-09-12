import { saveMessageToMongo } from "./save-message-chat";

export default async function processSingleMessage(message: any, chatId: string, messageModel: any, chat?: any, userId?: string) {
  const messageWithKey = message as unknown as {
      key: { id: string, remoteJid: string, fromMe?: boolean };
      message: { conversation?: string; extendedTextMessage?: any; };
      messageTimestamp?: { low: number, unsigned: boolean };
      profilePictureUrl: string;
      pushName?: string;
      messageIsNew?: boolean;
  };

  if (
    messageWithKey.key && 
    messageWithKey.key.id && 
    messageWithKey.key.remoteJid &&
    messageWithKey.message && 
    messageWithKey.key && 
    (messageWithKey.message.conversation || (messageWithKey.message.extendedTextMessage && messageWithKey.message.extendedTextMessage.text))) {
      
      const isMine =messageWithKey.key.fromMe || false;
      let newMessagesAmount = 0;
      if (!isMine) {
        const chatDocument = await messageModel.findOne({ chatId: messageWithKey.key.remoteJid, userId: `${userId}@s.whatsapp.net` })
        newMessagesAmount = chatDocument?.newMessagesAmount ? chatDocument?.newMessagesAmount + 1 : 1;
      }
      
      await saveMessageToMongo(messageModel, {
          chatId: messageWithKey.key.remoteJid,
          messageId: messageWithKey.key.id,
          body: messageWithKey.message?.conversation || messageWithKey.message.extendedTextMessage.text || '',
          from: messageWithKey.key.remoteJid || '',
          timestamp: messageWithKey.messageTimestamp?.low ? new Date(messageWithKey.messageTimestamp?.low * 1000) : new Date(),
          isMine: messageWithKey.key.fromMe || false,
          isViewed: messageWithKey.messageTimestamp?.unsigned || false,
          isDelivered: true,
          hour: new Date(messageWithKey.messageTimestamp?.low * 1000).toLocaleTimeString(),
          userStatus: chat?.userStatus || '',
          name: chat?.name || messageWithKey.key.remoteJid || messageWithKey.pushName || '',
          type: chat?.type || '',
          messageStatus: chat?.messageStatus || '',
          lastMessageTime: chat?.lastMessageTime || '',
          newMessagesAmount: newMessagesAmount,
          profilePictureUrl: messageWithKey.profilePictureUrl || '',
          markedAsUnread: chat?.markedAsUnread || false,
          messageIsNew: messageWithKey.messageIsNew || false,
          userId: userId ? `${userId}@s.whatsapp.net` : ''
      });
  }
}