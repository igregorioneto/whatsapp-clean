import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message as MongoMessage } from '../../../models/message.schema';
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { generateQrCode } from './qr-code-generate';
import { clearAuthState } from 'src/utils/clean-auth-state';
import winstonLogger from 'src/config/winston.config';
import { NumberIntegration } from './number-integration';
import { createAuthState } from 'src/utils/create-auth-state';
import processSingleMessage from './process-single-message';

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
            this.registerEventHandler(client, chatId);
        } catch (error) {
            console.error(`Error initializing client: ${error}`);
        }
    }

    private async registerEventHandler(client: any, numberIntegrated: string) {
        client.ev.process(async (events) => {
            if (events['connection.update']) {
                await this.handleConnectionUpdate(client, events['connection.update'], numberIntegrated);
            }
            if (events['messages.upsert']) {
                await this.handleMessageUpsert(client, events['messages.upsert'], numberIntegrated);
            }
            if (events['messaging-history.set']) {
                await this.handleMessagingHistorySet(client, events['messaging-history.set'], numberIntegrated);
            }
            if (events['messages.update']) {
                await this.updateViewMessage(client, events['messages.update'], numberIntegrated);
            }
        })

        client.ev.on('presence.update', async (chat) => {
            await this.updatePresenceSubscribe(client, chat, numberIntegrated);
        });
    }

    private async updateViewMessage(client: any, updates: any, numberIntegrated: string) {
        try {
            for (const update of updates) {
                const { key, update: updateStatus } = update;
                const query = { userId: numberIntegrated + '@s.whatsapp.net', chatId: key.remoteJid };
                if (updateStatus.status === 3 || updateStatus.status === 4) {
                    await this.messageModel
                        .updateMany(
                            query,
                            { $set: { isDelivered: true, isViewed: true, newMessagesAmount: 0 } }
                        );
                    winstonLogger.info(`Mensagem entregue ${numberIntegrated} ${key.remoteJid}`);
                }
            }
        } catch (error) {
            winstonLogger.error(`Erro em relação aos status do message: ${error.message}`);
        }
    }

    private async updatePresenceSubscribe(client: any, chat: any, numberIntegrated: string) {
        try {
            const chatId = chat.id || Object.keys(chat.presences)[0];
            const lastKnownPresence = chat.presences[chatId]?.lastKnownPresence;
            if (chatId && lastKnownPresence) {
                await this.messageModel
                    .updateMany(
                        { userId: numberIntegrated + '@s.whatsapp.net', chatId: chatId },
                        { userStatus: lastKnownPresence }
                    );
                await client.presenceSubscribe(chatId);
                winstonLogger.info(`Status do usuário ${chatId} atualizado para ${lastKnownPresence}`);
            }
        } catch (error) {
            winstonLogger.error(`Erro ao atualizar status de presença: ${error.message}`);
        }
    }

    private async handleConnectionUpdate(client: any, update: any, chatId: string) {
        const { connection, lastDisconnect, qr } = update;
        const userId = this.getUserIdFromClient(client);
        if (connection === 'close') {
            this.clearUserSession(userId);
            this.numberIntegration.removeNumberIntegration(chatId);
            const shouldReconnect = (lastDisconnect.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
            winstonLogger.info(`Connection closed due to: ${JSON.stringify(lastDisconnect.error)}`)
            winstonLogger.info(`reconnecting: ${JSON.stringify(shouldReconnect)}`)
            if (shouldReconnect) {
                setTimeout(() => this.initializeClient(chatId), 5000);
            } else {
                winstonLogger.info('Logged out. Please scan the QR code again.')
                clearAuthState(chatId);
                setTimeout(() => this.initializeClient(chatId), 5000);
            }
        } else if (connection === 'open') {
            winstonLogger.info('Connection opened');
            this.clients.set(chatId, client);
            this.numberIntegration.setNumberUserIntegration(chatId, userId);
            winstonLogger.info(`Numero vinculado com o QR CODE: ${JSON.stringify(chatId)}`);
            this.qrCodeImageUrl[chatId] = null;
        } else if (qr) {
            if (!this.numberIntegration.getNumberIntegration(chatId)) {
                this.qrCodeImageUrl[chatId] = await generateQrCode(qr, null);
            } else {
                winstonLogger.info('QR Code não disponível para o usuário já logado.');
                this.qrCodeImageUrl[chatId] = null;
            }
        }
    }

    private async handleMessageUpsert(client: any, upsert: any, numberIntegrated: string) {
        for (const msg of upsert.messages) {
            const remotedJid = msg.key.remoteJid;
            if (!remotedJid.endsWith('@s.whatsapp.net')) {
                winstonLogger.warn(`Ignorado mensagem do ${remotedJid}`);
                continue;
            }
            let profilePictureUrl = '';
            let chatDetails = {
                userStatus: '',
                name: '',
                type: '',
                messageStatus: '',
                lastMessageTime: '',
                newMessagesAmount: 1
            };
            try {
                profilePictureUrl = await client.profilePictureUrl(remotedJid);
            } catch (error) {
                profilePictureUrl = '';
                winstonLogger.error(`Erro ao obter a URL da imagem de perfil para ${remotedJid}: ${error.message}`);
            }
            try {
                chatDetails.userStatus = await client.presenceSubscribe(remotedJid);
            } catch (error) {
                chatDetails.userStatus = 'available';
                winstonLogger.error(`Erro ao obter o status de login do usuario ${remotedJid}: ${error.message}`);
            }
            msg.profilePictureUrl = profilePictureUrl;
            if (!msg.key.fromMe) {
                msg.messageIsNew = true;
            } else {
                await this.messageModel
                    .updateMany(
                        { userId: numberIntegrated + '@s.whatsapp.net', chatId: remotedJid },
                        { messageIsNew: false, newMessagesAmount: 0 }
                    );
            }

            await processSingleMessage(msg, remotedJid, this.messageModel, chatDetails, numberIntegrated);
        }
    }

    private async handleMessagingHistorySet(client: any, event: any, chatId: string) {
        const { chats, messages, contacts } = event;
        const userId = this.getUserIdFromClient(client);
        for (const chat of chats) {
            // await this.processChat(chat, chatId, userId);
            winstonLogger.warn(`Chat ID: ${JSON.stringify(chat.id)}`);
        }
        for (const message of messages) {
            const remoteId = message.key.remoteJid;
            const chat = chats.find(chat => chat.id === remoteId);

            if (!remoteId.endsWith('@s.whatsapp.net')) {
                winstonLogger.warn(`Ignorado mensagem do ${remoteId}`);
                continue;
            }

            let profilePictureUrl = '';
            try {
                profilePictureUrl = await client.profilePictureUrl(remoteId);
            } catch (error) {
                profilePictureUrl = '';
                winstonLogger.error(`Erro ao obter a URL da imagem de perfil para ${remoteId}: ${error.message}`);
            }

            if (chat) {
                try {
                    chat.userStatus = await client.presenceSubscribe(remoteId);
                } catch (error) {
                    chat.userStatus = 'available';
                    winstonLogger.error(`Erro ao obter o status de login do usuario ${remoteId}: ${error.message}`);
                }
                
                message.profilePictureUrl = profilePictureUrl;

                await processSingleMessage(message, remoteId, this.messageModel, chat, userId);
                winstonLogger.info(`Mensagem fora do chat salva para o chat ${remoteId}}`);
            } else {
                winstonLogger.warn(`Nenhum chat encontrado para a mensagem com remoteId: ${remoteId}`);
            }
        }
        for (const contact of contacts) {
            winstonLogger.info(`Contact: ${JSON.stringify(contact)}`);
        }
    }

    private async processChat(chat: any, chatId: string, userId: string) {
        if (Array.isArray(chat.messages)) {
            for (const message of chat.messages) {
                await processSingleMessage(message, chatId, this.messageModel, chat, userId);
            }
        } else {
            winstonLogger.error(`Expected an array for chat.messages but got: ${JSON.stringify(chat.messages)}`);
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

    public getClients(): Map<string, any> {
        return this.clients;
    }
}