import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { EvolutionQueryDto, SearchDto } from '../../shared/dto';
import { CreateMeasurementTypeDto, UpdateMeasurementTypeDto } from './measurements.dto';
import { evolutionRange } from '../../shared/date-range';

@Injectable()
export class MeasurementsService {
  constructor(private readonly database: PrismaService, private readonly clients: ClientsService) {}
  private nameKey(name: string) { return name.normalize('NFKC').toLocaleLowerCase('pt-BR'); }
  async create(dto: CreateMeasurementTypeDto) {
    try { return await this.database.measurementType.create({ data: { ...dto, nameKey: this.nameKey(dto.name) } }); }
    catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('Já existe uma medição com esse nome.');
      throw error;
    }
  }
  async update(id: string, dto: UpdateMeasurementTypeDto) {
    if (!await this.database.measurementType.findUnique({ where: { id } })) throw new NotFoundException('Tipo de medição não encontrado.');
    try { return await this.database.measurementType.update({ where: { id }, data: { ...dto, nameKey: dto.name ? this.nameKey(dto.name) : undefined } }); }
    catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('Já existe uma medição com esse nome.');
      throw error;
    }
  }
  async list(query: SearchDto) {
    const where: Prisma.MeasurementTypeWhereInput = { name: query.q ? { contains: query.q, mode: 'insensitive' } : undefined };
    const [items, total] = await this.database.$transaction([
      this.database.measurementType.findMany({ where, orderBy: [{ name: 'asc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
      this.database.measurementType.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }
  async evolution(clientId: string, query: EvolutionQueryDto, typeId?: string) {
    await this.clients.require(clientId);
    if (typeId && !await this.database.measurementType.findUnique({ where: { id: typeId } })) throw new NotFoundException('Tipo de medição não encontrado.');
    const rows = await this.database.assessmentMeasurement.findMany({ where: { typeId,
      assessment: { clientId, assessedOn: evolutionRange(query) } },
      include: { assessment: { select: { assessedOn: true, version: true, createdAt: true } } },
      orderBy: [{ assessment: { assessedOn: 'asc' } }, { assessment: { createdAt: 'asc' } }, { assessmentId: 'asc' }, { typeId: 'asc' }],
    });
    return { clientId, items: rows.map((row) => ({ assessmentId: row.assessmentId, version: row.assessment.version,
      assessedOn: row.assessment.assessedOn.toISOString().slice(0, 10), typeId: row.typeId, name: row.typeName, unit: row.unit, value: row.value.toString() })) };
  }
}
