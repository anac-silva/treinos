import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients/clients.module';
import { WorkoutsController, WorkoutSheetsController } from './workouts.controller';
import { WorkoutSheetsService } from './workout-sheets.service';
import { WorkoutsService } from './workouts.service';

@Module({ imports: [ClientsModule], controllers: [WorkoutsController, WorkoutSheetsController], providers: [WorkoutsService, WorkoutSheetsService] })
export class WorkoutsModule {}
