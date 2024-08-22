import { WAMessage } from "@whiskeysockets/baileys";
import { CustomMessage, Message } from "./whatsapp-client.interface";

export const isWAMessage = (message: Message): message is WAMessage => {
    return (message as WAMessage).message !== undefined;
}

export const isCustomMessage = (message: Message): message is CustomMessage => {
    return (message as CustomMessage).body !== undefined;
}