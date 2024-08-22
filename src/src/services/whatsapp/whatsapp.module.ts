import { Module } from '@nestjs/common';
import { ModelsModule } from 'src/models/models.model';
import { MongooseModule } from '@nestjs/mongoose';
import mongoConfig from 'src/config/mongo.config';
import { WhatsappService } from 'src/services/whatsapp/whatsapp.service';
import { WhatsappResolver } from 'src/services/whatsapp/whatsapp.resolve';
import { WhatsappController } from 'src/services/whatsapp/whatsapp.controller';
import { createWhatsappClient } from 'src/services/whatsapp/whatsapp.factory';

@Module({
  imports: [
    ModelsModule,
    MongooseModule.forRootAsync(mongoConfig),
  ],
  providers: [
    WhatsappService,
    WhatsappResolver,
    WhatsappController,
    {
      provide: 'WhatsappClient',
      useFactory: createWhatsappClient
    }
  ],
  exports: [WhatsappService],
})
export class WhatsappModule { }