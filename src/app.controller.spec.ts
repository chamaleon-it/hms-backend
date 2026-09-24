import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return a health payload', () => {
      const result = appController.getHello();
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('cpu');
      expect(result.data).toHaveProperty('memory');
    });
  });
});
