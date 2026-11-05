import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { CreateWorkoutSheetDto, ListWorkoutsDto } from './workouts.dto';
import { workoutInclude } from './workouts.shared';

const sheetInclude = {
  client: { select: { id: true, name: true, status: true } },
  sourceSheet: { select: { id: true, title: true } },
  blocks: { include: workoutInclude, orderBy: { position: 'asc' as const } },
};

@Injectable()
export class WorkoutSheetsService {
  constructor(private readonly database: PrismaService) {}

  async create(dto: CreateWorkoutSheetDto) {
    return this.database.$transaction(async (tx) => {
      if (dto.clientId) {
        // Serialize saves for one client, keeping exactly one current sheet.
        await tx.client.updateMany({ where: { id: dto.clientId }, data: { updatedAt: new Date() } });
        const client = await tx.client.findUnique({ where: { id: dto.clientId } });
        if (!client) throw new NotFoundException('Aluno não encontrado.');
        if (client.status !== 'ACTIVE') throw new BadRequestException('Complete ou ative o cadastro antes de prescrever uma ficha.');
      }
      if (dto.sourceSheetId && !await tx.workoutSheet.findUnique({ where: { id: dto.sourceSheetId } })) {
        throw new NotFoundException('Ficha de referência não encontrada.');
      }
      const sources = [...new Set(dto.blocks.flatMap((block) => block.sourcePlanId ? [block.sourcePlanId] : []))];
      if (await tx.workoutPlan.count({ where: { id: { in: sources } } }) !== sources.length) {
        throw new NotFoundException('Um dos modelos de referência não foi encontrado.');
      }
      const exerciseIds = [...new Set(dto.blocks.flatMap((block) => block.exercises.map((item) => item.exerciseId)))];
      if (await tx.exercise.count({ where: { id: { in: exerciseIds } } }) !== exerciseIds.length) {
        throw new BadRequestException('Um ou mais exercícios não existem no catálogo.');
      }
      if (dto.clientId) {
        await tx.workoutSheet.updateMany({ where: { clientId: dto.clientId, isActive: true }, data: { isActive: false } });
        await tx.workoutPlan.updateMany({ where: { clientId: dto.clientId, isActive: true }, data: { isActive: false } });
      }
      return tx.workoutSheet.create({ data: {
        clientId: dto.clientId || null, title: dto.title, notes: dto.notes || null,
        sourceSheetId: dto.sourceSheetId || null, isActive: Boolean(dto.clientId),
        blocks: { create: dto.blocks.map((block, position) => ({
          title: block.title, level: block.level, focus: block.focus || null, notes: block.notes || null,
          clientId: dto.clientId || null, sourcePlanId: block.sourcePlanId || null, position,
          isActive: Boolean(dto.clientId),
          exercises: { create: block.exercises.map((item, index) => ({
            exerciseId: item.exerciseId, position: index, sets: item.sets, repetitions: item.repetitions,
            restSeconds: item.restSeconds ?? null, notes: item.notes || null,
          })) },
        })) },
      }, include: sheetInclude });
    });
  }

  async list(query: ListWorkoutsDto) {
    if (query.clientId && !await this.database.client.findUnique({ where: { id: query.clientId } })) throw new NotFoundException('Aluno não encontrado.');
    const where: Prisma.WorkoutSheetWhereInput = {
      clientId: query.templatesOnly === 'true' ? null : query.clientId,
      isActive: query.isActive === undefined ? undefined : query.isActive === 'true',
      OR: query.q ? [
        { title: { contains: query.q, mode: 'insensitive' } },
        { client: { name: { contains: query.q, mode: 'insensitive' } } },
      ] : undefined,
      blocks: query.focus || query.level ? { some: { level: query.level, focus: query.focus ? { contains: query.focus, mode: 'insensitive' } : undefined } } : undefined,
    };
    const args = { where, orderBy: [{ createdAt: 'desc' as const }, { id: 'asc' as const }], skip: (query.page - 1) * query.pageSize, take: query.pageSize };
    const itemsQuery = query.view === 'summary'
      ? this.database.workoutSheet.findMany({ ...args, select: {
        id: true, title: true, clientId: true, isActive: true, createdAt: true,
        client: sheetInclude.client, _count: { select: { blocks: true } },
      } })
      : this.database.workoutSheet.findMany({ ...args, include: sheetInclude });
    const [items, total] = await this.database.$transaction([
      itemsQuery,
      this.database.workoutSheet.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async get(id: string) {
    const sheet = await this.database.workoutSheet.findUnique({ where: { id }, include: sheetInclude });
    if (!sheet) throw new NotFoundException('Ficha não encontrada.');
    return sheet;
  }
}
