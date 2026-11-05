import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { CreateClientDto, ListClientsDto, UpdateClientDto } from './clients.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly database: PrismaService) {}
  create(dto: CreateClientDto) { return this.database.client.create({ data: dto }); }
  async preRegister(tx: Prisma.TransactionClient, name: string, phone: string) {
    const normalizedPhone = phone.replace(/\D/g, '') || phone.trim();
    const normalizedName = name.trim();
    const key = `${normalizedName.toLowerCase()}:${normalizedPhone}`;
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${key}))`;
    const existing = await tx.client.findFirst({ where: {
      status: 'PRE_REGISTERED', name: { equals: normalizedName, mode: 'insensitive' }, phone: normalizedPhone,
    } });
    return existing || tx.client.create({ data: { name: normalizedName, phone: normalizedPhone, status: 'PRE_REGISTERED' } });
  }
  async removePreRegistration(id: string) {
    return this.database.$transaction(async (tx) => {
      // Acquire the row lock through Prisma, respecting the configured schema.
      await tx.client.updateMany({ where: { id }, data: { updatedAt: new Date() } });
      const client = await tx.client.findUnique({ where: { id }, include: { _count: { select: { assessments: true, photos: true, workouts: true } } } });
      if (!client) throw new NotFoundException('Aluno não encontrado.');
      if (client.status !== 'PRE_REGISTERED') throw new ConflictException('A exclusão está disponível apenas para pré-cadastros.');
      if (client._count.assessments || client._count.photos || client._count.workouts) {
        throw new ConflictException('Este contato já possui avaliações, fotos ou treinos. Complete o cadastro para preservar o histórico.');
      }
      await tx.appointment.updateMany({ where: { clientId: id }, data: { clientId: null, guestName: client.name, guestPhone: client.phone! } });
      await tx.client.delete({ where: { id } });
    });
  }
  async require(id: string) {
    const client = await this.database.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Aluno não encontrado.');
    return client;
  }
  async get(id: string) {
    const client = await this.database.client.findUnique({ where: { id }, include: {
      photos: { where: { principal: true }, select: { id: true, mimeType: true, createdAt: true, updatedAt: true } },
      assessments: { orderBy: [{ assessedOn: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }], take: 1 },
    } });
    if (!client) throw new NotFoundException('Aluno não encontrado.');
    return client;
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
    const client = await this.require(id);
    if ((dto.status || client.status) === 'PRE_REGISTERED' && !(dto.phone !== undefined ? dto.phone : client.phone)?.trim()) {
      throw new BadRequestException('Informe um telefone para manter o pré-cadastro.');
    }
    return this.database.client.update({ where: { id }, data: dto });
  }
}
