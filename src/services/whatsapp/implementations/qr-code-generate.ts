import * as qrcode from 'qrcode';
import winstonLogger from 'src/config/winston.config';
export async function generateQrCode(qrText: string | null, numberUserIntegration: string): Promise<string> {
    if (!qrText) return null;
    try {
        if (!numberUserIntegration) {
            if (qrText.startsWith('data:image/png;base64,')) {
                return qrText;
            } else {
                // Gera uma URL de dados a partir da string QR code
                const qrCodeImageUrl = await qrcode.toDataURL(qrText);
                return qrCodeImageUrl;
            }
        } else {
            winstonLogger.info('QR Code não disponível para o usuário já logado.');
            return null;
        }
    } catch (error) {
        winstonLogger.error(`Error generating QR code:${error}`);
        throw `Error generating QR code:${error}`;
    }
}