import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { EvolutionQueryDto, PaginationDto } from '../../shared/dto';
import { evolutionRange } from '../../shared/date-range';
import { CorrectAssessmentDto, CreateAssessmentDto, MeasurementInputDto } from './assessments.dto';

type AssessmentWithMeasures = Prisma.AssessmentGetPayload<{ include: { measurements: true } }>;
export function assessmentView(assessment: AssessmentWithMeasures) {
  return { ...assessment, assessedOn: assessment.assessedOn.toISOString().slice(0, 10),
    nextAssessmentOn: assessment.nextAssessmentOn?.toISOString().slice(0, 10) || null,
    weightKg: assessment.weightKg.toString(), heightCm: assessment.heightCm?.toString() || null,
    bodyFatPercent: assessment.bodyFatPercent?.toString() ?? null,
    measurements: assessment.measurements.map((item) => ({ ...item, value: item.value.toString() })),
  };
}
const dateValue = (value: string | null | undefined) => value === undefined ? undefined : value === null ? null : new Date(`${value}T00:00:00Z`);

@Injectable()
export class AssessmentsService {
  constructor(private readonly database: PrismaService, private readonly clients: ClientsService) {}

  private async measures(tx: Prisma.TransactionClient, inputs: MeasurementInputDto[], previous: AssessmentWithMeasures['measurements'] = []) {
    const ids = inputs.map((input) => input.typeId);
    if (new Set(ids).size !== ids.length) throw new BadRequestException('Não repita o tipo de medição na avaliação.');
    const types = await tx.measurementType.findMany({ where: { id: { in: ids } } });
    return inputs.map((input) => {
      const type = types.find((entry) => entry.id === input.typeId);
      const old = previous.find((entry) => entry.typeId === input.typeId);
      if (!type || (!type.active && !old)) throw new BadRequestException('Tipo de medição inexistente ou inativo.');
      return { typeId: input.typeId, value: input.value, typeName: old?.typeName || type.name, unit: old?.unit || type.unit };
    });
  }

  private validateNextDate(assessedOn: string, nextAssessmentOn?: string | null) {
    if (nextAssessmentOn && nextAssessmentOn < assessedOn) throw new BadRequestException('A próxima avaliação não pode ser anterior à avaliação.');
  }

  async create(clientId: string, dto: CreateAssessmentDto) {
    await this.clients.require(clientId);
    this.validateNextDate(dto.assessedOn, dto.nextAssessmentOn);
    return this.database.$transaction(async (tx) => {
      const measures = await this.measures(tx, dto.measurements || []);
      return assessmentView(await tx.assessment.create({ data: {
        clientId, assessedOn: dateValue(dto.assessedOn)!, weightKg: dto.weightKg,
        heightCm: dto.heightCm, bodyFatPercent: dto.bodyFatPercent, notes: dto.notes,
        nextAssessmentOn: dateValue(dto.nextAssessmentOn), measurements: { create: measures },
      }, include: { measurements: true } }));
    });
  }

  async get(clientId: string, id: string) {
    const assessment = await this.database.assessment.findFirst({ where: { id, clientId }, include: { measurements: true } });
    if (!assessment) throw new NotFoundException('Avaliação não encontrada para este cliente.');
    return assessmentView(assessment);
  }

  async list(clientId: string, query: PaginationDto) {
    await this.clients.require(clientId);
    const [items, total] = await this.database.$transaction([
      this.database.assessment.findMany({ where: { clientId }, include: { measurements: true },
        orderBy: [{ assessedOn: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
      this.database.assessment.count({ where: { clientId } }),
    ]);
    return { items: items.map(assessmentView), total, page: query.page, pageSize: query.pageSize };
  }

  async correct(clientId: string, id: string, actorId: string, dto: CorrectAssessmentDto) {
    const fields = ['assessedOn', 'weightKg', 'heightCm', 'bodyFatPercent', 'notes', 'nextAssessmentOn', 'measurements'] as const;
    if (!fields.some((field) => dto[field] !== undefined)) throw new BadRequestException('Informe ao menos um campo para corrigir.');
    return this.database.$transaction(async (tx) => {
      const before = await tx.assessment.findFirst({ where: { id, clientId }, include: { measurements: true } });
      if (!before) throw new NotFoundException('Avaliação não encontrada para este cliente.');
      if (before.version !== dto.expectedVersion) throw new ConflictException('Avaliação já corrigida. Recarregue antes de continuar.');
      const assessedOn = dto.assessedOn ?? before.assessedOn.toISOString().slice(0, 10);
      const next = dto.nextAssessmentOn === undefined ? before.nextAssessmentOn?.toISOString().slice(0, 10) : dto.nextAssessmentOn;
      this.validateNextDate(assessedOn, next);
      const measures = dto.measurements === undefined ? undefined : await this.measures(tx, dto.measurements, before.measurements);
      const changed = await tx.assessment.updateMany({ where: { id, clientId, version: dto.expectedVersion }, data: {
        assessedOn: dateValue(dto.assessedOn) ?? undefined, weightKg: dto.weightKg, heightCm: dto.heightCm,
        bodyFatPercent: dto.bodyFatPercent, notes: dto.notes, nextAssessmentOn: dateValue(dto.nextAssessmentOn),
        version: { increment: 1 },
      } });
      if (changed.count !== 1) throw new ConflictException('Avaliação já corrigida. Recarregue antes de continuar.');
      if (measures !== undefined) {
        await tx.assessmentMeasurement.deleteMany({ where: { assessmentId: id } });
        await tx.assessmentMeasurement.createMany({ data: measures.map((item) => ({ ...item, assessmentId: id })) });
      }
      const after = await tx.assessment.findUniqueOrThrow({ where: { id }, include: { measurements: true } });
      await tx.assessmentCorrection.create({ data: { assessmentId: id, actorId, reason: dto.reason, version: after.version,
        before: JSON.parse(JSON.stringify(assessmentView(before))) as Prisma.InputJsonObject,
        after: JSON.parse(JSON.stringify(assessmentView(after))) as Prisma.InputJsonObject,
      } });
      return assessmentView(after);
    });
  }

  async corrections(clientId: string, id: string) {
    await this.get(clientId, id);
    return this.database.assessmentCorrection.findMany({ where: { assessmentId: id }, orderBy: { version: 'asc' } });
  }

  async weightEvolution(clientId: string, query: EvolutionQueryDto) {
    await this.clients.require(clientId);
    const items = await this.database.assessment.findMany({ where: { clientId, assessedOn: evolutionRange(query) },
      orderBy: [{ assessedOn: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      select: { id: true, version: true, assessedOn: true, weightKg: true },
    });
    return { clientId, unit: 'kg', items: items.map((item) => ({ assessmentId: item.id, version: item.version,
      assessedOn: item.assessedOn.toISOString().slice(0, 10), value: item.weightKg.toString() })) };
  }
}
