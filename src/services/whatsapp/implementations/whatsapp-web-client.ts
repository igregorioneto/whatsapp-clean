import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message as MongoMessage } from '../../../models/message.schema';
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { saveMessageToMongo } from './save-message-chat';
import { generateQrCode } from './qr-code-generate';
import { clearAuthState } from 'src/utils/clean-auth-state';
import winstonLogger from 'src/config/winston.config';
import { NumberIntegration } from './number-integration';
import { createAuthState } from 'src/utils/create-auth-state';

export class WhatsappWebClient {
    private clients: Map<string, any> = new Map();
    private qrCodeImageUrl: { [chatId: string]: string | null } = {};
    private isConnecting: { [chatId: string]: boolean } = {};

    constructor(
        @InjectModel('Message') private readonly messageModel: Model<MongoMessage>,
        private readonly numberIntegration: NumberIntegration
    ) { }

    async initializeClient(chatId: string) {
        try {
            if (this.isConnecting[chatId]) return;
            this.initializeClient[chatId] = true;

            const authPath = await createAuthState(chatId); // Cria um caminho de autenticação genérico
            const { state, saveCreds } = await useMultiFileAuthState(authPath);

            const client = makeWASocket({
                printQRInTerminal: true,
                auth: state,
            });

            client.ev.on('creds.update', saveCreds);

            const connect = async (update: any) => {
                if (!update) {
                    winstonLogger.error('Atualização recebida é indefinida');
                    return;
                }
                const { connection, lastDisconnect, qr } = update;
                const userId = this.getUserIdFromClient(client);

                if (connection === 'close') {
                    this.clearUserSession(chatId);
                    const shouldReconnect = (lastDisconnect.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
                    winstonLogger.info(`Connection closed due to: ${JSON.stringify(lastDisconnect.error)}`);
                    winstonLogger.info(`Reconnecting: ${JSON.stringify(shouldReconnect)}`);

                    if (shouldReconnect) {
                        setTimeout(() => this.initializeClient(chatId), 5000); // Recria o cliente
                    } else {
                        winstonLogger.info('Logged out. Please scan the QR code again.');
                        clearAuthState(authPath);
                        setTimeout(() => this.initializeClient(chatId), 5000); // Recria o cliente
                    }
                } else if (connection === 'open') {
                    winstonLogger.info('Connection opened');

                    if (!this.clients.has(chatId)) {
                        this.clients.set(chatId, client);
                        this.numberIntegration.setNumberUserIntegration(chatId, userId);
                        winstonLogger.info(`User logged in with chatId: ${chatId}`);
                        this.qrCodeImageUrl[chatId] = null;
                    } else {
                        winstonLogger.info(`Client already exists for chatId: ${chatId}`);
                    }
                } else if (qr) {
                    if (!this.numberIntegration.getNumberIntegration(chatId)) {
                        this.qrCodeImageUrl[chatId] = await generateQrCode(qr, null);
                    } else {
                        winstonLogger.info('QR Code not available for already logged-in user.');
                        this.qrCodeImageUrl[chatId] = null;
                    }
                }
            }

            // client.ev.on('creds.update', saveCreds);

            client.ev.process(async (events) => {                
                if (events['connection.update']) {
                    const update = events['connection.update'];
                    connect(update);
                    const { connection, lastDisconnect, qr } = update;                    
                    const userId = this.getUserIdFromClient(client);
                    if (connection === 'close') {
                        this.clearUserSession(userId);
                        this.numberIntegration.removeNumberIntegration(chatId); 
                        const shouldReconnect = (lastDisconnect.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
                        winstonLogger.info(`Connection closed due to: ${JSON.stringify(lastDisconnect.error)}`)
                        winstonLogger.info(`reconnecting: ${JSON.stringify(shouldReconnect)}`)
                        if (shouldReconnect) {
                            setTimeout(connect, 5000);
                        } else {
                            winstonLogger.info('Logged out. Please scan the QR code again.')
                            clearAuthState(chatId);
                            setTimeout(connect, 5000);
                        }
                    } else if (connection === 'open') {
                        winstonLogger.info('Connection opened');
                        this.qrCodeImageUrl[chatId] = null;
                        const { user } = client;
                        winstonLogger.info(`Usuario logado no sistema ${JSON.stringify(user)}`)
                        let number = user?.id.split(':')[0] || null;
                        this.numberIntegration.setNumberUserIntegration(chatId, number); 
                        winstonLogger.info(`Numero vinculado com o QR CODE: ${JSON.stringify(number)}`)
                    } else if (qr) {
                        if (!this.numberIntegration.getNumberIntegration(chatId)) {
                            this.qrCodeImageUrl[chatId] = await generateQrCode(qr, null);
                        } else {
                            winstonLogger.info('QR Code não disponível para o usuário já logado.');
                            this.qrCodeImageUrl[chatId] = null;
                        }
                    }
                }
                if (events['messages.upsert']) {
                    const upsert = events['messages.upsert'];
                    if (upsert.type === 'notify') {
                        for (const msg of upsert.messages) {
                            if (!msg.key.fromMe) {
                                await saveMessageToMongo(this.messageModel, msg);
                            }
                        }
                    }
                }
                if (events['messaging-history.set']) {
                    const { chats, messages, contacts, isLatest } = events['messaging-history.set'];
                    const userId = this.getUserIdFromClient(client);
                    for (const chat of chats) {
                        console.log('Chats dos eventos: ', chat);
                        const chatWithProps = chat as unknown as {
                            id: string;
                            messages: Array<{ key: { id: string, remoteJid: string, fromMe?: boolean }, message: { conversation?: string }, messageTimestamp?: { low: number, unsigned: boolean } }>;
                            userStatus?: string;
                            name?: string;
                            type?: string;
                            messageStatus?: string;
                            lastMessageTime?: string;
                            newMessagesAmount?: number;
                            profilePictureUrl?: string;
                        };

                        try {
                            chatWithProps.profilePictureUrl = await client.profilePictureUrl(chatWithProps.id, 'image');
                        } catch (error) {
                            console.warn(`Não foi possível obter a foto de perfil para o chat ID ${chatWithProps.id}:`, error);
                            chatWithProps.profilePictureUrl = '';
                        }

                        if (Array.isArray(chatWithProps.messages)) {
                            for (const message of chat.messages) {
                                console.log('Mensagem esta sendo gerado: ', message)
                                const messageWithKey = message as unknown as { 
                                    key: { id: string, remoteJid: string, fromMe?: boolean }, 
                                    message: { conversation?: string }, messageTimestamp?: { low: number, unsigned: boolean } }; 
                                    winstonLogger.info(`Messages recebidas: ${JSON.stringify(message)}`)
                                if (messageWithKey.key && messageWithKey.key.id && messageWithKey.key.remoteJid) {
                                    await saveMessageToMongo(this.messageModel, {
                                        chatId: chatId,
                                        messageId: messageWithKey.key.id,  // Identificador único da mensagem
                                        body: messageWithKey.message?.conversation || '',  // Conteúdo da mensagem
                                        from: messageWithKey.key.remoteJid || '',  // Remetente da mensagem
                                        timestamp: new Date(messageWithKey.messageTimestamp?.low * 1000),  // Timestamp convertido em Date
                                        isMine: messageWithKey.key.fromMe || false,  // Indica se a mensagem foi enviada pelo usuário
                                        isViewed: messageWithKey.messageTimestamp?.unsigned || false,  // Indica se a mensagem foi visualizada
                                        isDelivered: true,  // Se quiser checar a entrega, precisa de lógica adicional
                                        hour: new Date(messageWithKey.messageTimestamp?.low * 1000).toLocaleTimeString(),  // Hora formatada
                                        userStatus: chatWithProps.userStatus || '',
                                        name: chatWithProps.name || '',
                                        type: chatWithProps.type || '',
                                        messageStatus: chatWithProps.messageStatus || '',
                                        lastMessageTime: chatWithProps.lastMessageTime || '',
                                        newMessagesAmount: chatWithProps.newMessagesAmount || 0,
                                        profilePictureUrl: chatWithProps.profilePictureUrl || '',
                                        userId: this.numberIntegration.getNumberIntegration(chatId) + 's.@whastapp.net'
                                    });
                                }
                            }
                        } else {
                            console.error(`Expected an array for chat.messages but got: ${JSON.stringify(chat.messages)}`);
                        }
                    }
                    // Processar mensagens
                    for (const message of messages) {
                        const messageWithKey = message as unknown as {
                            key: { id: string, remoteJid: string, fromMe?: boolean };
                            message: { conversation?: string };
                            messageTimestamp?: { low: number, unsigned: boolean };
                        }; // Conversão dupla para message

                        if (messageWithKey.key && messageWithKey.key.id && messageWithKey.key.remoteJid) {
                            await saveMessageToMongo(this.messageModel, {
                                chatId: chatId,  // Usuario
                                messageId: messageWithKey.key.id,  // Identificador único da mensagem
                                body: messageWithKey.message?.conversation || '',  // Conteúdo da mensagem
                                from: messageWithKey.key.remoteJid || '',  // Remetente da mensagem
                                timestamp: new Date(messageWithKey.messageTimestamp?.low * 1000),  // Timestamp convertido em Date
                                isMine: messageWithKey.key.fromMe || false,  // Indica se a mensagem foi enviada pelo usuário
                                isViewed: messageWithKey.messageTimestamp?.unsigned || false,  // Indica se a mensagem foi visualizada
                                isDelivered: true,  // Se quiser checar a entrega, precisa de lógica adicional
                                hour: new Date(messageWithKey.messageTimestamp?.low * 1000).toLocaleTimeString(),  // Hora formatada

                                // Os campos abaixo podem não estar disponíveis na mensagem individual,
                                userStatus: '',  // Se disponível, preencha com o status do usuário
                                name: '',  // Se disponível, preencha com o nome do usuário
                                type: '',  // Se disponível, preencha com o tipo da mensagem
                                messageStatus: '',  // Se disponível, preencha com o status da mensagem
                                lastMessageTime: '',  // Se disponível, preencha com o tempo da última mensagem
                                newMessagesAmount: 0,  // Se disponível, preencha com a quantidade de novas mensagens
                                userId: this.numberIntegration.getNumberIntegration(chatId) + '@s.whatsapp.net',
                            });
                        }
                    }
                    // Processar contatos
                    for (const contact of contacts) {
                        console.log(`Contact:${JSON.stringify(contact)}`);
                    }
                }
                if (events['connection.update']) {
                    const userId = this.getUserIdFromClient(client);
                    const { qr } = events['connection.update'];
                    if (!this.numberIntegration.getNumberIntegration(chatId)) {
                        this.qrCodeImageUrl[chatId] = await generateQrCode(qr, null);
                    } else {
                        winstonLogger.info('QR Code não disponível para o usuário já logado.');
                        this.qrCodeImageUrl[chatId] = null;
                    }
                }
                if (events['messages.upsert']) {
                    const userId = this.getUserIdFromClient(client);
                    const { messages } = events['messages.upsert'];
                    for (const message of messages) {
                        const messageWithKey = message as unknown as {
                            key: { id: string, remoteJid: string, fromMe?: boolean };
                            message: { conversation?: string };
                            messageTimestamp: number;
                            status: number;
                            pushName?: string;
                        }; // Conversão dupla para message

                        // Verifique se message.key e suas propriedades estão definidas
                        if (messageWithKey.key && messageWithKey.key.id && messageWithKey.key.remoteJid) {
                            await saveMessageToMongo(this.messageModel, {
                                chatId: chatId,  // ID do chat (remetente)
                                messageId: messageWithKey.key.id,  // Identificador único da mensagem
                                body: messageWithKey.message?.conversation || '',  // Conteúdo da mensagem
                                from: messageWithKey.key.remoteJid || '',  // Remetente da mensagem
                                timestamp: new Date(messageWithKey.messageTimestamp * 1000),  // Timestamp convertido em Date
                                isMine: messageWithKey.key.fromMe || false,  // Indica se a mensagem foi enviada pelo usuário
                                isViewed: messageWithKey.status === 2,  // Indica se a mensagem foi visualizada (status 2 indica "visto")
                                isDelivered: messageWithKey.status === 2 || messageWithKey.status === 1,  // Se status é 1 (entregue) ou 2 (visto)
                                hour: new Date(messageWithKey.messageTimestamp * 1000).toLocaleTimeString(),  // Hora formatada
                                userStatus: '',  // Se disponível, preencha com o status do usuário
                                name: messageWithKey.pushName || '',  // Nome do remetente (se disponível)
                                type: '',  // Se disponível, preencha com o tipo da mensagem
                                messageStatus: '',  // Se disponível, preencha com o status da mensagem
                                lastMessageTime: '',  // Se disponível, preencha com o tempo da última mensagem
                                newMessagesAmount: 0,  // Se disponível, preencha com a quantidade de novas mensagens
                                userId: this.numberIntegration.getNumberIntegration(chatId) + 's.@whastapp.net',
                            });
                        } else {
                            console.error(`Message key is undefined or missing important fields: ${JSON.stringify(message)}`);
                        }
                    }
                }

                console.log('Other Events: ', events);                
            });
        } catch (error) {
            console.error(`Error initializing client: ${error}`);
        }
    }

    private getUserIdFromClient(client: any): string | null {
        const { user } = client;
        return user?.id.split(':')[0] || null;
    }

    async clearUserSession(userId: string) {
        this.numberIntegration.removeNumberIntegration(userId);
        this.clients.delete(userId);
        this.qrCodeImageUrl[userId] = null;
    }

    on(userId: string, event: string, listener: (...args: any[]) => void): this {
        const client = this.clients.get(userId);
        if (client) {
            client.on(event, listener);
        } else {
            winstonLogger.info(`Cliente nao encontrado ${userId}`);
        }
        return this;
    }

    async getQrCodeImageUrl(chatId: string): Promise<string | null> {
        return this.qrCodeImageUrl[chatId] || null;
    }
}