import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Procedure, ProcedureSchema } from './schemas/procedure.schema';
import { ProcedureService } from './procedure.service';
import { ProcedureController } from './procedure.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Procedure.name, schema: ProcedureSchema },
    ]),
  ],
  controllers: [ProcedureController],
  providers: [ProcedureService],
  exports: [ProcedureService, MongooseModule],
})
export class ProcedureModule {}
