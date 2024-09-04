import winstonLogger from "src/config/winston.config";
import processSingleMessage from "./process-single-message";
// Envia mensagem
export async function sendMessage(client: any, to: string, message: string, numberIntegrated: string, messageModel: any): Promise<void> {
    try {
        // Enviar a mensagem
        await client.sendMessage(`${to}@s.whatsapp.net`, { text: message });
    } catch (error) {
        console.error('Erro ao enviar a mensagem ou salvar no banco de dados:', error);
        throw error; // Re-throw para que o erro possa ser tratado no nível superior
    }
}