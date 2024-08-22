import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message as MongoMessage } from '../../../models/message.schema';
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { saveMessageToMongo } from './save-message-chat';
import { generateQrCode } from './qr-code-generate';
import { createAuthState } from 'src/utils/create-auth-state';
import { clearAuthState } from 'src/utils/clean-auth-state';
import winstonLogger from 'src/config/winston.config';
import { NumberIntegration } from './number-integration';

export class WhatsappWebClient  {
    private client: any;
    private qrCodeImageUrl: string | null = null;

    constructor(
        @InjectModel('Message') private readonly messageModel: Model<MongoMessage>,
        private readonly numberIntegration: NumberIntegration
    ) { }

    async initializeClient() {
        try {
            const connect = async () => {
                const authPath = await createAuthState();
                const { state, saveCreds } = await useMultiFileAuthState(authPath);
                this.client = makeWASocket({
                    printQRInTerminal: true,
                    auth: state,
                });
                this.client.ev.on('creds.update', saveCreds);
                this.client.ev.process(async (events) => {
                    if (events['connection.update']) {
                        const update = events['connection.update'];
                        const { connection, lastDisconnect, qr } = update;
                        if (connection === 'close') {
                            const shouldReconnect = (lastDisconnect.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
                            winstonLogger.info(`Connection closed due to: ${JSON.stringify(lastDisconnect.error)}`)
                            winstonLogger.info(`reconnecting: ${JSON.stringify(shouldReconnect)}`)
                            if (shouldReconnect) {
                                connect();
                            } else {
                                winstonLogger.info('Logged out. Please scan the QR code again.')
                                clearAuthState();
                                connect();
                            }
                        } else if (connection === 'open') {
                            winstonLogger.info('Connection opened');
                            this.qrCodeImageUrl = null;
                            const { user } = this.client;
                            winstonLogger.info(`Usuario logado no sistema ${JSON.stringify(user)}`)
                            let number = user?.id.split(':')[0] || null;
                            this.numberIntegration.setNumberUserIntegration(number);
                            winstonLogger.info(`Numero vinculado com o QR CODE: ${JSON.stringify(number)}`)
                        } else if (qr) {
                            this.qrCodeImageUrl = await generateQrCode(qr, this.numberIntegration.getNumberIntegration());
                        } else if (qr && this.numberIntegration.getNumberIntegration() === null) {
                            this.qrCodeImageUrl = await generateQrCode(qr, this.numberIntegration.getNumberIntegration());
                        }
                    }
                    if (events['messages.upsert']) {
                        const upsert = events['messages.upsert'];
                        if (upsert.type === 'notify') {
                            for (const msg of upsert.messages) {
                                if (!msg.key.fromMe) {
                                    await saveMessageToMongo(msg);
                                }
                            }
                        }
                    }
                    if (events['messaging-history.set']) {
                        const { chats, messages, contacts, isLatest } = events['messaging-history.set'];
                        // Processar chats
                        for (const chat of chats) {
                            if (Array.isArray(chat.messages)) {
                                for (const message of chat.messages) {
                                    winstonLogger.info(`Messages recebidas: ${JSON.stringify(message)}`)
                                    if (message.key && message.key.id && message.key.remoteJid) {
                                        await saveMessageToMongo({
                                            chatId: chat.id,
                                            messageId: message.key.id,  // Identificador único da mensagem
                                            body: message.message?.conversation || '',  // Conteúdo da mensagem
                                            from: message.key.remoteJid || '',  // Remetente da mensagem
                                            timestamp: new Date(message.messageTimestamp?.low * 1000),  // Timestamp convertido em Date
                                            isMine: message.key.fromMe || false,  // Indica se a mensagem foi enviada pelo usuário
                                            isViewed: message.messageTimestamp?.unsigned || false,  // Indica se a mensagem foi visualizada
                                            isDelivered: true,  // Se quiser checar a entrega, precisa de lógica adicional
                                            hour: new Date(message.messageTimestamp?.low * 1000).toLocaleTimeString(),  // Hora formatada
                                            userStatus: chat.userStatus || '',
                                            name: chat.name || '',
                                            type: chat.type || '',
                                            messageStatus: chat.messageStatus || '',
                                            lastMessageTime: chat.lastMessageTime || '',
                                            newMessagesAmount: chat.newMessagesAmount || 0,
                                            userId: this.numberIntegration.getNumberIntegration()  + 's.@whastapp.net'
                                        });
                                    }
                                }
                            } else {
                                console.error(`Expected an array for chat.messages but got: ${JSON.stringify(chat.messages)}`);
                            }
                        }
                        // Processar mensagens
                        for (const message of messages) {
                            //console.log('Message:', message);
                            if (message.key && message.key.id && message.key.remoteJid) {
                                await saveMessageToMongo({
                                    chatId: message.key.remoteJid,  // ID do chat (remetente)
                                    messageId: message.key.id,  // Identificador único da mensagem
                                    body: message.message?.conversation || '',  // Conteúdo da mensagem
                                    from: message.key.remoteJid || '',  // Remetente da mensagem
                                    timestamp: new Date(message.messageTimestamp?.low * 1000),  // Timestamp convertido em Date
                                    isMine: message.key.fromMe || false,  // Indica se a mensagem foi enviada pelo usuário
                                    isViewed: message.messageTimestamp?.unsigned || false,  // Indica se a mensagem foi visualizada
                                    isDelivered: true,  // Se quiser checar a entrega, precisa de lógica adicional
                                    hour: new Date(message.messageTimestamp?.low * 1000).toLocaleTimeString(),  // Hora formatada
                                    // Os campos abaixo podem não estar disponíveis na mensagem individual,
                                    userStatus: '',  // Se disponível, preencha com o status do usuário
                                    name: '',  // Se disponível, preencha com o nome do usuário
                                    type: '',  // Se disponível, preencha com o tipo da mensagem
                                    messageStatus: '',  // Se disponível, preencha com o status da mensagem
                                    lastMessageTime: '',  // Se disponível, preencha com o tempo da última mensagem
                                    newMessagesAmount: 0,  // Se disponível, preencha com a quantidade de novas mensagens
                                    userId: this.numberIntegration.getNumberIntegration()  + 's.@whastapp.net',
                                });
                            }
                        }
                        // Processar contatos
                        for (const contact of contacts) {
                            console.log(`Contact:${JSON.stringify(contact)}`);
                        }
                    }
                    console.log('Other events:', events);
                    if (events['messages.upsert']) {
                        const { messages } = events['messages.upsert'];
                        for (const message of messages) {
                            // Verifique se message.key e suas propriedades estão definidas
                            if (message.key && message.key.id && message.key.remoteJid) {
                                await saveMessageToMongo({
                                    chatId: message.key.remoteJid,  // ID do chat (remetente)
                                    messageId: message.key.id,  // Identificador único da mensagem
                                    body: message.message?.conversation || '',  // Conteúdo da mensagem
                                    from: message.key.remoteJid || '',  // Remetente da mensagem
                                    timestamp: new Date(message.messageTimestamp * 1000),  // Timestamp convertido em Date
                                    isMine: message.key.fromMe || false,  // Indica se a mensagem foi enviada pelo usuário
                                    isViewed: message.status === 2,  // Indica se a mensagem foi visualizada (status 2 indica "visto")
                                    isDelivered: message.status === 2 || message.status === 1,  // Se status é 1 (entregue) ou 2 (visto)
                                    hour: new Date(message.messageTimestamp * 1000).toLocaleTimeString(),  // Hora formatada
                                    userStatus: '',  // Se disponível, preencha com o status do usuário
                                    name: message.pushName || '',  // Nome do remetente (se disponível)
                                    type: '',  // Se disponível, preencha com o tipo da mensagem
                                    messageStatus: '',  // Se disponível, preencha com o status da mensagem
                                    lastMessageTime: '',  // Se disponível, preencha com o tempo da última mensagem
                                    newMessagesAmount: 0,  // Se disponível, preencha com a quantidade de novas mensagens
                                    userId: this.numberIntegration.getNumberIntegration()  + 's.@whastapp.net',
                                });
                            } else {
                                console.error(`Message key is undefined or missing important fields: ${JSON.stringify(message)}`);
                            }
                        }
                    }
                });
            }
            connect();
        } catch (error) {
            console.error(`Error initializing client: ${error}`);
        }
    }

    on(event: string, listener: (...args: any[]) => void): this {
        this.client.on(event, listener);
        return this;
    }

    async getQrCodeImageUrl(): Promise<string | null> {
        return this.qrCodeImageUrl;
    }
}