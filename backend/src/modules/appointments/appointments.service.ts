import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { CreateAppointmentDto, ListAppointmentsDto, UpdateAppointmentDto } from './appointments.dto';

@Injectable()
export class AppointmentsService {
  constructor(private readonly database: PrismaService, private readonly clients: ClientsService) {}

  async create(dto: CreateAppointmentDto) {
    const hasClient = Boolean(dto.clientId);
    const hasAnyGuestContact = Boolean(dto.guestName || dto.guestPhone);
    if ((hasClient && hasAnyGuestContact) || (!hasClient && (!dto.guestName || !dto.guestPhone))) {
      throw new BadRequestException('Informe um aluno cadastrado ou o nome e telefone do pré-cadastro.');
    }
    if (dto.clientId) await this.clients.require(dto.clientId);
    return this.database.$transaction(async (tx) => {
      const contact = !hasClient ? await this.clients.preRegister(tx, dto.guestName!, dto.guestPhone!) : null;
      return tx.appointment.create({
        data: { ...dto, clientId: contact?.id || dto.clientId, guestName: null, guestPhone: null, startsAt: new Date(dto.startsAt) },
        include: { client: { select: { id: true, name: true, status: true } } },
      });
    });
  }

  async list(query: ListAppointmentsDto) {
    if (query.from && query.to && new Date(query.from) > new Date(query.to)) {
      throw new BadRequestException('O início do período deve ser anterior ao fim.');
    }
    const where: Prisma.AppointmentWhereInput = {
      clientId: query.clientId,
      status: query.status || (query.includePending === 'false' ? { not: 'PENDING_CONFIRMATION' } : undefined),
      startsAt: query.from || query.to ? {
        gte: query.from ? new Date(query.from) : undefined,
        lte: query.to ? new Date(query.to) : undefined,
      } : undefined,
    };
    const [items, total] = await this.database.$transaction([
      this.database.appointment.findMany({
        where, include: { client: { select: { id: true, name: true, status: true } } },
        orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize, take: query.pageSize,
      }),
      this.database.appointment.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async update(id: string, dto: UpdateAppointmentDto) {
    const appointment = await this.database.appointment.findUnique({ where: { id } });
    if (!appointment) throw new NotFoundException('Agendamento não encontrado.');
    const clientId = dto.clientId !== undefined ? dto.clientId : appointment.clientId;
    const guestName = dto.guestName !== undefined ? dto.guestName : appointment.guestName;
    const guestPhone = dto.guestPhone !== undefined ? dto.guestPhone : appointment.guestPhone;
    if (clientId) {
      if (dto.clientId) await this.clients.require(dto.clientId);
      if (guestName || guestPhone) throw new BadRequestException('O agendamento não pode ter aluno cadastrado e pré-cadastro ao mesmo tempo.');
    } else if (!guestName?.trim() || !guestPhone?.trim()) {
      throw new BadRequestException('Informe o nome e telefone do pré-cadastro.');
    }
    const { startsAt, ...fields } = dto;
    return this.database.$transaction(async (tx) => {
      const contact = !clientId ? await this.clients.preRegister(tx, guestName!, guestPhone!) : null;
      return tx.appointment.update({
        where: { id }, data: {
          ...fields,
          clientId: contact?.id || clientId,
          guestName: null,
          guestPhone: null,
          startsAt: startsAt ? new Date(startsAt) : undefined,
        },
        include: { client: { select: { id: true, name: true, status: true } } },
      });
    });
  }
}
