import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DatabaseModule } from './shared/database/database.module';
import { ClientsModule } from './modules/clients/clients.module';
import { AssessmentsModule } from './modules/assessments/assessments.module';
import { MeasurementsModule } from './modules/measurements/measurements.module';
import { PhotosModule } from './modules/photos/photos.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { WorkoutsModule } from './modules/workouts/workouts.module';

@Module({ imports: [DatabaseModule, UsersModule, AuthModule, ClientsModule, AssessmentsModule, MeasurementsModule, PhotosModule, AppointmentsModule, ExercisesModule, WorkoutsModule] })
export class AppModule {}
