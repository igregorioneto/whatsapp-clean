import { Model } from 'mongoose';
import { Message as MongoMessage } from '../../../models/message.schema';
import winstonLogger from "src/config/winston.config";
import { MessageInputDto } from '../dto/message-input.dto';

export async function deletingMessage(
  client: any, 
  messageModel: Model<MongoMessage>,
  numberUserIntegration: string, 
  messages: [MessageInputDto]
) {
  if (!messages)
    throw new Error('Necessário ter mensagens para enviar');
  for (const message of messages) {
    if (!message.fromMe) {
      continue;
    }
    try {
      const deletingObj = {
        fromMe: message.fromMe,
        id: message.messageId,
        remoteJid: `${message.chatId}@s.whatsapp.net`
      }
      const numberIntegration = `${numberUserIntegration}@s.whatsapp.net`;
      await client.sendMessage(deletingObj.remoteJid, { delete: deletingObj })
      await messageModel.deleteMany({ 
        chatId: deletingObj.remoteJid, 
        userId: numberIntegration, 
        messageId: deletingObj.id,
        isMine: deletingObj.fromMe 
      });
    } catch (error) {
      winstonLogger.error(`Erro ao realizar download da mensagem: ${error.message}`);
      throw new Error(`Erro ao realizar download da mensagem: ${error.message}`);
    }
  }  
}