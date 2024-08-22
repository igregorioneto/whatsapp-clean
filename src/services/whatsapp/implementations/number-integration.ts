import { Injectable } from "@nestjs/common";
import { clearAuthState } from "src/utils/clean-auth-state";

@Injectable()
export class NumberIntegration {
  private numberUserIntegration: string | null = null;

  async verifyNumberIntegrationIsCorrect(chatId: string) {
    if (!chatId || this.numberUserIntegration) {
      // Número não está integrado
      return {
        status: false,
        info: 'Número não integrado. Por favor, integre um número antes de verificar.'
      };
    }
    if (this.numberUserIntegration === chatId) {
      // Número correto
      return {
        status: true,
        info: 'Número integrado com sucesso com o WhatsApp!'
      };
    } else {
      // Número incorreto
      clearAuthState();
      return {
        status: false,
        info: 'Número vinculado ao QR Code diferente do integrado. Verifique o número e tente novamente.'
      };
    }
  }

  setNumberUserIntegration(number: string) {
    this.numberUserIntegration = number;
  }

  getNumberIntegration() {
    return this.numberUserIntegration;
  }

}