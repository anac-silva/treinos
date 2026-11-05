import { Injectable } from '@nestjs/common';
import { Assessment, Prisma } from '../../generated/prisma/client';

@Injectable()
export class NextAssessmentAppointmentService {
  async sync(tx: Prisma.TransactionClient, assessment: Assessment) {
    const existing = await tx.appointment.findUnique({ where: { sourceAssessmentId: assessment.id } });
    // Changes made in the agenda remain authoritative after confirmation/cancellation.
    if (existing && existing.status !== 'PENDING_CONFIRMATION') return;
    if (!assessment.nextAssessmentOn) {
      if (existing) await tx.appointment.updateMany({ where: { id: existing.id, status: 'PENDING_CONFIRMATION' }, data: { status: 'CANCELLED' } });
      return;
    }
    const assessedDay = assessment.assessedOn.toISOString().slice(0, 10);
    const appointments = existing ? [] : await tx.appointment.findMany({ where: {
      clientId: assessment.clientId, status: { in: ['SCHEDULED', 'COMPLETED'] },
      startsAt: { gte: new Date(`${assessedDay}T00:00:00-03:00`), lte: new Date(`${assessedDay}T23:59:59.999-03:00`) },
    }, orderBy: [{ startsAt: 'asc' }, { id: 'asc' }] });
    const source = appointments.find((item) => /avalia/i.test(item.type)) || appointments[0];
    const reference = existing?.startsAt || source?.startsAt || assessment.createdAt;
    const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(reference);
    const startsAt = new Date(`${assessment.nextAssessmentOn.toISOString().slice(0, 10)}T${time}:00-03:00`);
    if (existing) {
      await tx.appointment.updateMany({ where: { id: existing.id, status: 'PENDING_CONFIRMATION' }, data: { startsAt } });
    } else {
      await tx.appointment.create({ data: {
        clientId: assessment.clientId, sourceAssessmentId: assessment.id, startsAt,
        durationMinutes: source?.durationMinutes || 60, type: 'Avaliação física', status: 'PENDING_CONFIRMATION',
      } });
    }
  }

}
