import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import configuration from './config/configuration';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
     ConfigModule.forRoot({
      load: [configuration],
    }),
    MongooseModule.forRoot(configuration().databaseUrl as string),
    UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
