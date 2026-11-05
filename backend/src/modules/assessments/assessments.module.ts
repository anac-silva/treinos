import { NextAssessmentAppointmentService } from './next-assessment-appointment.service';
import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients/clients.module';
import { AssessmentsService } from './assessments.service';
import { AssessmentsController } from './assessments.controller';
@Module({ imports: [ClientsModule], controllers: [AssessmentsController], providers: [AssessmentsService, NextAssessmentAppointmentService] })
export class AssessmentsModule {}
