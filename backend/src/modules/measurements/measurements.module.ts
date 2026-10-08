import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients/clients.module';
import { MeasurementsService } from './measurements.service';
import { MeasurementsController, MeasurementTypesController } from './measurements.controller';
@Module({ imports: [ClientsModule], controllers: [MeasurementsController, MeasurementTypesController], providers: [MeasurementsService] })
export class MeasurementsModule {}
