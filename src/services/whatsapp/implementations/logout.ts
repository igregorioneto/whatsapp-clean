import winstonLogger from "src/config/winston.config";

export async function logout(client: any, numberIntegrated: string): Promise<void> {
  try {
      // Enviar a mensagem
      await client.logout();
      await client.end();
      winstonLogger.info(`Número integrado ${numberIntegrated} deslogado.`);
  } catch (error) {
      winstonLogger.error(`Erro ao deslogar número integrado ${numberIntegrated}: ${error.message}`);
      throw new Error(`Erro ao deslogar número integrado ${numberIntegrated}: ${error.message}`); 
  }
}