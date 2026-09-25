import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import configuration from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      // Strip unknown keys; do not 400 (legacy clients may send extra fields).
    }),
  );

  // Increase payload limit for large uploads/prints
  const express = require('express');
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const corsOrigins = configuration().corsOrigins;
  app.enableCors({
    origin:
      corsOrigins.length > 0
        ? corsOrigins
        : process.env.NODE_ENV === 'production'
          ? false
          : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-lis-api-key',
      'x-api-key',
    ],
    credentials: true,
  });
  await app.listen(3001, '0.0.0.0');
}

bootstrap();
