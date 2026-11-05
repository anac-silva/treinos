import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { CreateWorkoutDto, ListWorkoutsDto, WorkoutBlockInputDto } from './workouts.dto';
import { WorkoutSheetsService } from './workout-sheets.service';
import { workoutInclude } from './workouts.shared';

@Injectable()
export class WorkoutsService {
  constructor(private readonly database: PrismaService, private readonly clients: ClientsService, private readonly sheets: WorkoutSheetsService) {}

  async create(dto: CreateWorkoutDto) {
    if (dto.clientId) {
      const sheet = await this.sheets.create({ clientId: dto.clientId, title: dto.title, notes: dto.notes, blocks: [dto] });
      return sheet.blocks[0];
    }
    if (dto.sourcePlanId && !await this.database.workoutPlan.findUnique({ where: { id: dto.sourcePlanId }, select: { id: true } })) {
      throw new NotFoundException('O treino usado como modelo não foi encontrado.');
    }
    const exerciseIds = [...new Set(dto.exercises.map(({ exerciseId }) => exerciseId))];
    const foundExercises = await this.database.exercise.count({ where: { id: { in: exerciseIds } } });
    if (foundExercises !== exerciseIds.length) throw new BadRequestException('Um ou mais exercícios não existem no catálogo.');

    return this.database.$transaction(async (transaction) => {
      return transaction.workoutPlan.create({
        data: {
          clientId: dto.clientId ?? null,
          sourcePlanId: dto.sourcePlanId ?? null,
          title: dto.title,
          level: dto.level,
          focus: dto.focus || null,
          notes: dto.notes ?? null,
          isActive: Boolean(dto.clientId),
          exercises: {
            create: dto.exercises.map((exercise, position) => ({
              exerciseId: exercise.exerciseId,
              position,
              sets: exercise.sets,
              repetitions: exercise.repetitions,
              restSeconds: exercise.restSeconds ?? null,
              notes: exercise.notes ?? null,
            })),
          },
        },
        include: workoutInclude,
      });
    });
  }

  async list(query: ListWorkoutsDto) {
    if (query.clientId) await this.clients.require(query.clientId);
    const where: Prisma.WorkoutPlanWhereInput = {
      clientId: query.templatesOnly === 'true' ? null : query.clientId ?? undefined,
      sheetId: query.templatesOnly === 'true' ? null : undefined,
      level: query.level,
      focus: query.focus ? { contains: query.focus, mode: 'insensitive' } : undefined,
      title: query.q ? { contains: query.q, mode: 'insensitive' } : undefined,
    };
    const [items, total] = await this.database.$transaction([
      this.database.workoutPlan.findMany({
        where, include: workoutInclude,
        orderBy: [{ clientId: 'asc' }, { createdAt: 'desc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize, take: query.pageSize,
      }),
      this.database.workoutPlan.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async get(id: string) {
    const workout = await this.database.workoutPlan.findUnique({ where: { id }, include: workoutInclude });
    if (!workout) throw new NotFoundException('Treino não encontrado.');
    return workout;
  }

  async updateTemplate(id: string, dto: WorkoutBlockInputDto) {
    const previous = await this.get(id);
    if (previous.clientId || previous.sheetId) throw new BadRequestException('Para alterar um treino de aluno, salve uma nova versão da ficha.');
    const ids = [...new Set(dto.exercises.map((item) => item.exerciseId))];
    if (await this.database.exercise.count({ where: { id: { in: ids } } }) !== ids.length) throw new BadRequestException('Um ou mais exercícios não existem no catálogo.');
    return this.database.$transaction(async (tx) => {
      await tx.workoutExercise.deleteMany({ where: { workoutPlanId: id } });
      return tx.workoutPlan.update({ where: { id }, data: {
        title: dto.title, level: dto.level, focus: dto.focus || null, notes: dto.notes || null,
        exercises: { create: dto.exercises.map((item, position) => ({
          exerciseId: item.exerciseId, position, sets: item.sets, repetitions: item.repetitions,
          restSeconds: item.restSeconds ?? null, notes: item.notes || null,
        })) },
      }, include: workoutInclude });
    });
  }
}
