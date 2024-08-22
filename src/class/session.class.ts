/* eslint-disable no-unsafe-optional-chaining */
import mongoose from 'mongoose';
import winstonLogger from '../config/winston.config';
import { envorimentVariables } from '../env/envoriment';
// import WhatsAppInstance from './instance.class';
import { MongoClient } from 'mongodb';

class Session {
  async restoreSessions() {
    let restoredSessions = new Array();
    let allCollections = [];
    try {
      const db = (await MongoClient.connect(envorimentVariables.mongoose.uri)).db('whatsapp-api')
      const result = await db.listCollections().toArray();
      result.forEach((collection) => {
        allCollections.push(collection.name);
      });

      allCollections.map((key) => {
        const query = {};
        db.collection(key)
          .find(query)
          .toArray()
        restoredSessions.push(key);
      });
    } catch (e) {
      winstonLogger.error('Error restoring sessions');
      winstonLogger.error(e);
    }
    return restoredSessions;
  }
}

export default Session;
