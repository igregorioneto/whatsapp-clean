export async function getAllMessages() {
  console.log(this.numberUserIntegration + '@s.whatsapp.net')
  const messages = await this.messageModel.find({ userId: this.numberUserIntegration + '@s.whatsapp.net' }).exec();
  console.log('Mensagens carregadas do ALL Messages', messages[435])
  return messages.map((message, index) => ({
    id: index + 1,
    userStatus: message.userStatus || 'offline',
    name: message.name || 'Unknown',
    lastMessage: message.body,
    type: message.type || 'Personal',
    messageStatus: message.messageStatus || 'Aberto',
    lastMessageTime: message.lastMessageTime || 'há algum tempo',
    newMessagesAmount: message.newMessagesAmount || 0,
    userId: message.userId || ''
  }));
}