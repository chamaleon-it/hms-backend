import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.enableCors({
    origin: true,
    // [
    //   'http://localhost:3000',
    //   'http://localhost:3001',
    //   'http://localhost:3002',
    //   'http://localhost:3003',
    //   'http://localhost:3004',
    //   'https://synapsehms.com',
    // ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  await app.listen(3001);
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
