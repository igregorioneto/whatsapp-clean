import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappResolver } from './whatsapp.resolve';
import { createWhatsappClient } from './whatsapp.factory';
import { MongooseModule } from '@nestjs/mongoose';
import mongoConfig from 'src/config/mongo.config';
import { ModelsModule } from 'src/models/models.model';
import { NumberIntegration } from './implementations/number-integration';

@Module({
  imports: [
    ModelsModule,
    MongooseModule.forRootAsync(mongoConfig),
  ],
  providers: [
    WhatsappService,
    WhatsappResolver,
    NumberIntegration,
    {
      provide: 'WhatsappClient',
      useFactory: createWhatsappClient
    }
  ],
  exports: [WhatsappService],
})
export class WhatsappModule { }