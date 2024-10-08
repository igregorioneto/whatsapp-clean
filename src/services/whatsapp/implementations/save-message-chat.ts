import { Model } from 'mongoose';
import { Message as MongoMessage } from '../../../models/message.schema';
import winstonLogger from 'src/config/winston.config';

export async function saveMessageToMongo(messageModel: Model<MongoMessage>, messageInfo: any) {
  try {
      // Verificar se a mensagem já existe no banco de dados
      const existingMessage = await messageModel.findOne({
          chatId: messageInfo.chatId,
          messageId: messageInfo.messageId,
      });
      // Se a mensagem já existe, não salvar novamente
      if (existingMessage) {
          winstonLogger.info('Mensagem já existente, não será salva novamente.');
          return;
      }
      // Criar nova instância da mensagem
      const newMessage = new messageModel({
          chatId: messageInfo.chatId || 'unknown',
          messageId: messageInfo.messageId || 'unknown',
          body: messageInfo.body || '',
          from: messageInfo.from || 'unknown',
          timestamp: new Date(messageInfo.timestamp),
          isMine: messageInfo.isMine || false,
          isViewed: messageInfo.isViewed || false,
          isDelivered: messageInfo.isDelivered || true,
          hour: messageInfo.hour || new Date().toLocaleTimeString(),
          userStatus: messageInfo.userStatus || 'unavailable',
          type: messageInfo.type || 'Sem setor',      // Placeholder, ajustar conforme necessário
          messageStatus: messageInfo.messageStatus || 'Recebido',
          lastMessageTime: messageInfo.lastMessageTime || new Date().toISOString(),
          newMessagesAmount: messageInfo.newMessagesAmount || 0,
          name: messageInfo.name || '',
          profilePictureUrl: messageInfo.profilePictureUrl || '',
          markedAsUnread: messageInfo?.markedAsUnread || false,
          messageIsNew: messageInfo?.messageIsNew || false,
          userId: messageInfo.userId || ''
      });
      // Salvar a nova mensagem no banco de dados
      await newMessage.save();
      winstonLogger.info('Mensagem salva com sucesso.');
  } catch (error) {
    winstonLogger.error(`Erro ao salvar a mensagem no banco de dados: ${JSON.stringify(error)}`);
  }
}