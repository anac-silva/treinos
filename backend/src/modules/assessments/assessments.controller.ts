import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req } from '@nestjs/common';
import { AuthRequest } from '../auth/auth-request';
import { EvolutionQueryDto, PaginationDto } from '../../shared/dto';
import { AssessmentsService } from './assessments.service';
import { CorrectAssessmentDto, CreateAssessmentDto } from './assessments.dto';

@Controller('clients/:clientId/assessments')
export class AssessmentsController {
  constructor(private readonly service: AssessmentsService) {}
  @Post() create(@Param('clientId', ParseUUIDPipe) clientId: string, @Body() dto: CreateAssessmentDto) { return this.service.create(clientId, dto); }
  @Get() list(@Param('clientId', ParseUUIDPipe) clientId: string, @Query() query: PaginationDto) { return this.service.list(clientId, query); }
  @Get('weight-evolution') weight(@Param('clientId', ParseUUIDPipe) clientId: string, @Query() query: EvolutionQueryDto) { return this.service.weightEvolution(clientId, query); }
  @Get(':id') get(@Param('clientId', ParseUUIDPipe) clientId: string, @Param('id', ParseUUIDPipe) id: string) { return this.service.get(clientId, id); }
  @Post(':id/corrections') correct(@Param('clientId', ParseUUIDPipe) clientId: string, @Param('id', ParseUUIDPipe) id: string, @Req() request: AuthRequest, @Body() dto: CorrectAssessmentDto) { return this.service.correct(clientId, id, request.auth!.user.id, dto); }
  @Get(':id/corrections') corrections(@Param('clientId', ParseUUIDPipe) clientId: string, @Param('id', ParseUUIDPipe) id: string) { return this.service.corrections(clientId, id); }
}
