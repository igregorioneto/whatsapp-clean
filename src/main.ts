import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import * as path from 'path';
import { AppModule } from './app.module';
import { envorimentVariables } from './env/envoriment';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  app.use(express.json());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '../src/views'));

  const port = envorimentVariables.port;
  await app.listen(3000, () =>
    console.log(
      `App is Running\nDocumentation available on http://localhost:${port}/graphQL`,
    ),
  );
}
bootstrap();
