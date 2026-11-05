import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { CreateExerciseDto, ListExercisesDto } from './exercises.dto';

@Injectable()
export class ExercisesService {
  constructor(private readonly database: PrismaService) {}

  private nameKey(name: string) { return name.normalize('NFKC').toLocaleLowerCase('pt-BR'); }

  async create(dto: CreateExerciseDto) {
    try {
      return await this.database.exercise.create({ data: { name: dto.name, nameKey: this.nameKey(dto.name) } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe um exercício com esse nome.');
      }
      throw error;
    }
  }

  async list(query: ListExercisesDto) {
    const where: Prisma.ExerciseWhereInput = {
      name: query.q ? { contains: query.q, mode: 'insensitive' } : undefined,
    };
    const [items, total] = await this.database.$transaction([
      this.database.exercise.findMany({
        where, orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize, take: query.pageSize,
      }),
      this.database.exercise.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }
}
