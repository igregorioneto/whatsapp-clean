export async function getMessages(chatId: string) {
  const messages = await this.messageModel.find({ chatId, userId: this.numberUserIntegration + '@s.whatsapp.net'}).exec();
  console.log('Mensagens carregadas do getMessages', messages)
  return messages.map((message, index) => ({
      id: message._id.toString(),
      message: message.body,
      isMine: message.from !== chatId,
      isViewed: true,
      isDelivered: true,
      hour: new Date(message.timestamp).toLocaleTimeString()
  }));
}