import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { CreateClientDto, ListClientsDto, UpdateClientDto } from './clients.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly database: PrismaService) {}
  create(dto: CreateClientDto) { return this.database.client.create({ data: dto }); }
  async require(id: string) {
    const client = await this.database.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Cliente não encontrado.');
    return client;
  }
  async get(id: string) {
    await this.require(id);
    return this.database.client.findUniqueOrThrow({ where: { id }, include: {
      photos: { where: { principal: true }, select: { id: true, mimeType: true, createdAt: true, updatedAt: true } },
      assessments: { orderBy: [{ assessedOn: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }], take: 1 },
    } });
  }
  async list(query: ListClientsDto) {
    const { page, pageSize, q, status, goal } = query;
    const where: Prisma.ClientWhereInput = { status, goal: goal ? { contains: goal, mode: 'insensitive' } : undefined,
      OR: q ? ['name', 'email', 'phone'].map((key) => ({ [key]: { contains: q, mode: 'insensitive' } })) : undefined };
    const [items, total] = await this.database.$transaction([
      this.database.client.findMany({ where, orderBy: [{ name: 'asc' }, { id: 'asc' }], skip: (page - 1) * pageSize, take: pageSize,
        include: { photos: { where: { principal: true }, select: { id: true, mimeType: true } } } }),
      this.database.client.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }
  async update(id: string, dto: UpdateClientDto) {
    await this.require(id);
    return this.database.client.update({ where: { id }, data: dto });
  }
}
