import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.enableCors({
    origin: [
      'http://localhost:4000',
      "http://72.60.206.197:4000",
      'http://localhost:4001',
      'http://localhost:4002',
      'http://localhost:4003',
      'http://localhost:4004',
      'https://mukalel.synapsehms.com',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  await app.listen(4001);
}

bootstrap();

// void (async () => {
//   try {
//     await bootstrap();
//   } catch (error) {
//     console.error('Bootstrap error:', error);
//     process.exit(1);
//   }
// })();
