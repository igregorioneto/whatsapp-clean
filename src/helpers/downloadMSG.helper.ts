import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import winstonLogger from 'src/config/winston.config';

export const downloadMessage = async (msg, msgType) => {
  let buffer = Buffer.from([]);
  try {
    const stream = await downloadContentFromMessage(msg, msgType);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
  } catch {
    return winstonLogger.error('error downloading file-message');
  }
  return buffer.toString('base64');
};
