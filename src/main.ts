import { ValidationPipe } from '@nestjs/common';

if (!process.env.IS_TS_NODE) {
  require('module-alias/register');
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from '@app/app.module';
import { BackendValidationPipe } from '@app/shared/pipes/backendValidation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  app.setGlobalPrefix('api');
  await app.listen(3000);
}
bootstrap();
