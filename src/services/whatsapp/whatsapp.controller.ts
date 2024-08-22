import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('messages')
export class WhatsappController {
    constructor(private readonly whatsappService: WhatsappService) {}

    @Post('sendMessage')
    async sendMessage(
        @Body('to') to: string,
        @Body('message') message: string
    ): Promise<string> {
        try {
            await this.whatsappService.sendMessage(to, message);
            return 'Mensagem enviada com sucesso!';
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            return 'Erro ao enviar mensagem.';
        }
    }

    @Get('messages/:chatId')
    async getMessages(@Param('chatId') chatId: string) {
        try {
            return await this.whatsappService.getMessages(chatId);
        } catch (error) {
            console.error('Erro ao buscar mensagens:', error);
            return [];
        }
    }

    @Get('messages')
    async getAllMessages() {
        try {
            return await this.whatsappService.getAllMessages();
        } catch (error) {
            console.error('Erro ao buscar todas as mensagens:', error);
            return {};
        }
    }

    @Get('getQRCode')
    async getQrCodeImageUrl(): Promise<string | null> {
        return this.whatsappService.getQrCodeImageUrl();
    }
}
