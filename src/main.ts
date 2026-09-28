import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { validateEnv } from './config/validate-env';

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      // forbidNonWhitelisted: true,
    }),
  );

  // Increase payload limit for large uploads/prints
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const isProduction = process.env.NODE_ENV === 'production';
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : isProduction
      ? []
      : [
          'http://localhost:3000',
          'http://localhost:3001',
          'https://synapsehms.com',
          'https://www.synapsehms.com',
        ];

  if (isProduction && corsOrigins.length === 0) {
    throw new Error(
      'CORS_ORIGINS must be set to a non-empty comma-separated allow-list in production.',
    );
  }

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-lis-api-key'],
    credentials: true,
  });
  await app.listen(3001, '0.0.0.0');
}

bootstrap();
