import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { CountersService } from './counters.service';
import { NextFormattedIdDto, SetCounterDto } from './dto/counter.dto';

@Controller('counters')
export class CountersController {
  constructor(private readonly countersService: CountersService) {}

  @Get()
  async getAllCounters() {
    return this.countersService.getAllCounters();
  }

  @Get('latest-pid')
  async getLatestPID() {
    return this.countersService.getLatestPID();
  }

  @Post('next-pid')
  async getNextPID() {
    const mrn = await this.countersService.getNextPID();
    return { mrn };
  }

  @Get(':key')
  async getCounter(@Param('key') key: string) {
    const value = await this.countersService.getLatestSequence(key);
    return { key, value };
  }

  @Post(':key/next')
  async getNext(
    @Param('key') key: string,
    @Body() options?: NextFormattedIdDto,
  ) {
    if (options && (options.prefix || options.padLength)) {
      const id = await this.countersService.getNextFormattedId(key, options);
      return { key, id };
    }
    const value = await this.countersService.getNextSequence(
      key,
      options?.startValue ?? 0,
    );
    return { key, value };
  }

  @Post(':key/set')
  async setCounter(
    @Param('key') key: string,
    @Body() body: SetCounterDto,
  ) {
    const counter = await this.countersService.setSequence(
      key,
      body.value,
      body.prefix,
      body.description,
    );
    return counter;
  }
}
