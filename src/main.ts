import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: [
      'http://localhost:3000', // Next.js local
      'http://localhost:3001', // Optional local admin or test client
      'https://synapsehms.com', // Production frontend
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // allows cookies, tokens, etc.
  });
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
