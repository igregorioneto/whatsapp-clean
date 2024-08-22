import { WhatsappWebClient } from "./implementations/whatsapp-web-client";
import { IWhatsappClient } from "./interfaces/whatsapp-client.interface";
import { Message as MongoMessage } from '../../models/message.schema';
import { Model } from "mongoose";
import { NumberIntegration } from "./implementations/number-integration";

export const createWhatsappClient = (messageModel: Model<MongoMessage>, numberIntegration: NumberIntegration ) => {
    return new WhatsappWebClient(messageModel, numberIntegration);
}