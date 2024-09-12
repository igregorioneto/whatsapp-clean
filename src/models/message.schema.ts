import { Schema, Document } from 'mongoose';

export const MessageSchema = new Schema({
  chatId: { type: String, required: false },
  messageId: { type: String, required: false },  
  body: { type: String, required: false },
  from: { type: String, required: false },
  timestamp: { type: Date, default: Date.now },
  isMine: { type: Boolean, required: false }, 
  isViewed: { type: Boolean, required: false }, 
  isDelivered: { type: Boolean, required: false }, 
  hour: { type: String, required: false }, 
  userStatus: { type: String, required: false },
  name: { type: String, required: false },
  type: { type: String, required: false },
  messageStatus: { type: String, required: false },
  lastMessageTime: { type: String, required: false },
  newMessagesAmount: { type: Number, required: false },
  profilePictureUrl: { type: String, required: false },
  markedAsUnread: { type: String, required: false },
  messageIsNew: { type: Boolean, required: false },
  userId: { type: String, required: false },
});

export interface Message extends Document {
  chatId: string;
  messageId: string;
  body: string;
  from: string;
  timestamp: Date;
  isMine: boolean; 
  isViewed: boolean; 
  isDelivered: boolean; 
  hour: string;
  userStatus?: string;
  name?: string;
  type?: string;
  messageStatus?: string;
  lastMessageTime?: string;
  newMessagesAmount?: number;
  profilePictureUrl?: string;
  markedAsUnread?: boolean;
  messageIsNew?: boolean;
  userId?: string;
}