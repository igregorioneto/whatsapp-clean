import { WAMessage } from "@whiskeysockets/baileys";

export interface IWhatsappClient {
    initializeClient(): void;
    on(event: string, lisneter: (...arts: any[]) => void): this;
    sendMessage(to: string, message: string): void;
    getQrCodeImageUrl(): Promise<string | null>;
    getMessages(chatId: string);
    getAllMessages();
    verifyNumberIntegrationIsCorrect(chatId: string);
    verifyNumberIntegration(chatId: string);
}

export interface CustomMessage {
    from?: string;
    body: string;
    timestamp?: number;
    fromMe?: boolean;
    unsigned?: boolean;
    message?: {
        conversation: string;
        messageTimestamp: number;
    };
}

export type Message = WAMessage | CustomMessage;