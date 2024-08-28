import { Injectable } from "@nestjs/common";
import { clearAuthState } from "src/utils/clean-auth-state";

@Injectable()
export class NumberIntegration {
  private userNumberIntegrations: Map<string, string> = new Map();

  async verifyNumberIntegrationIsCorrect(chatId: string) {
    const integratedNumber = this.userNumberIntegrations.get(chatId);
    if (!chatId || !integratedNumber) {
      // Número não está integrado
      this.userNumberIntegrations.delete(chatId);
      return {
        status: false,
        info: 'Número não integrado. Por favor, integre um número antes de verificar.'
      };
    }
    if (integratedNumber === chatId) {
      // Número correto
      return {
        status: true,
        info: 'Número integrado com sucesso com o WhatsApp!'
      };
    } else {
      // Número incorreto
      this.userNumberIntegrations.delete(chatId);
      clearAuthState(chatId);
      return {
        status: false,
        info: 'Número vinculado ao QR Code diferente do integrado. Verifique o número e tente novamente.'
      };
    }
  }

  setNumberUserIntegration(userId: string, number: string) {
    this.userNumberIntegrations.set(userId, number);
  }

  getNumberIntegration(userId: string) {
    return this.userNumberIntegrations.get(userId);
  }

  removeNumberIntegration(userId: string) {
    this.userNumberIntegrations.delete(userId);
  }

  getAllUserIds(): string[] {
    return Array.from(this.userNumberIntegrations.keys());
  }

}