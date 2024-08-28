import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageSchema } from './message.schema';
import { ConnectedUserSchema } from './user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Message', schema: MessageSchema }, 
      { name: 'ConnectedUser', schema: ConnectedUserSchema }
    ]),
  ],
  exports: [MongooseModule],
})
export class ModelsModule { }
