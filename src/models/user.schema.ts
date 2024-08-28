import { Schema, Document } from 'mongoose';

export const ConnectedUserSchema = new Schema({
  phoneNumber: { type: String, required: false },
  isConnected: { type: Boolean, required: false },
  connectedAt: { type: Date, required: false, default: Date.now },
  disconectedAt: { type: Date, required: false },
});

export interface ConnectedUser extends Document {
  userNumber?: string;
  isConnected?: boolean;
  connectedAt?: Date;
  disconectedAt?: Date;
}