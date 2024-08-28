// Envia mensagem
export async function sendMessage(to: string, message: string): Promise<void> {
  try {
      // Enviar a mensagem
      await this.client.sendMessage(to, { text: message });
      // Carregar histórico de mensagens
      this.client.ev.on('messages.upsert', async (event) => {
          const messages = event.messages;
          for (const message of messages) {
              console.log('Message do sendMessage: ', message)
              const messageId = message.key.id;
              const remoteJid = message.key.remoteJid;
              const isViewed = message.messageTimestamp ? Boolean(message.messageTimestamp.low) : false;
              const body = message.message?.extendedTextMessage?.text || '';
              const messageTimestamp = message.messageTimestamp.toNumber();
              const existingMessage = await this.messageModel.findOne({ messageId });
              if (!existingMessage) {
                  const newMessage = new this.messageModel({
                      chatId: remoteJid,
                      messageId: messageId,
                      body: body,
                      from: remoteJid,
                      timestamp: new Date(message.messageTimestamp * 1000),
                      isMine: message.key.fromMe || false,
                      isViewed: isViewed,
                      isDelivered: true,
                      hour: new Date(messageTimestamp * 1000).toLocaleTimeString(),
                      userStatus: '',
                      name: '',
                      type: '',
                      messageStatus: '',
                      lastMessageTime: '',
                      newMessagesAmount: 0,
                      userId: this.numberUserIntegration
                  });
                  await newMessage.save();
              }
          }
      });
  } catch (error) {
      console.error('Erro ao enviar a mensagem ou salvar no banco de dados:', error);
      throw error; // Re-throw para que o erro possa ser tratado no nível superior
  }
}