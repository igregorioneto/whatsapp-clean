import * as qrcode from 'qrcode';
export async function generateQrCode(qrText: any, numberUserIntegration: string): Promise<string> {
  try {
      if (numberUserIntegration === null) {
          const qrCodeImageUrl = await qrcode.toDataURL(qrText);
          return qrCodeImageUrl;
      } else {
          console.log('QR Code não disponível para o usuário já logado.');
          return null;
      }
  } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
  }
}