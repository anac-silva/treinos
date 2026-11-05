import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto, ListClientsDto, UpdateClientDto } from './clients.dto';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}
  @Post() create(@Body() dto: CreateClientDto) { return this.clients.create(dto); }
  @Get() list(@Query() query: ListClientsDto) { return this.clients.list(query); }
  @Get(':id') get(@Param('id', ParseUUIDPipe) id: string) { return this.clients.get(id); }
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateClientDto) { return this.clients.update(id, dto); }
  @Delete(':id') @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string) { await this.clients.removePreRegistration(id); }
}
