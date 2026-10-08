import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { EvolutionQueryDto, SearchDto } from '../../shared/dto';
import { MeasurementsService } from './measurements.service';
import { CreateMeasurementTypeDto, UpdateMeasurementTypeDto } from './measurements.dto';

@Controller('measurement-types')
export class MeasurementTypesController {
  constructor(private readonly service: MeasurementsService) {}
  @Get() list(@Query() query: SearchDto) { return this.service.list(query); }
  @Post() create(@Body() dto: CreateMeasurementTypeDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMeasurementTypeDto) { return this.service.update(id, dto); }
}
@Controller('clients/:clientId/measurements')
export class MeasurementsController {
  constructor(private readonly service: MeasurementsService) {}
  @Get() evolution(@Param('clientId', ParseUUIDPipe) clientId: string, @Query() query: EvolutionQueryDto) { return this.service.evolution(clientId, query); }
  @Get(':typeId/evolution') typeEvolution(@Param('clientId', ParseUUIDPipe) clientId: string, @Param('typeId', ParseUUIDPipe) typeId: string, @Query() query: EvolutionQueryDto) { return this.service.evolution(clientId, query, typeId); }
}
