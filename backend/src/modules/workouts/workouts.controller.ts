import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { CreateWorkoutDto, CreateWorkoutSheetDto, ListWorkoutsDto, WorkoutBlockInputDto } from './workouts.dto';
import { WorkoutSheetsService } from './workout-sheets.service';
import { WorkoutsService } from './workouts.service';

@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workouts: WorkoutsService) {}

  @Post()
  create(@Body() dto: CreateWorkoutDto) { return this.workouts.create(dto); }

  @Get()
  list(@Query() query: ListWorkoutsDto) { return this.workouts.list(query); }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) { return this.workouts.get(id); }
  @Put(':id')
  updateTemplate(@Param('id', ParseUUIDPipe) id: string, @Body() dto: WorkoutBlockInputDto) { return this.workouts.updateTemplate(id, dto); }
}

@Controller('workout-sheets')
export class WorkoutSheetsController {
  constructor(private readonly sheets: WorkoutSheetsService) {}
  @Post() create(@Body() dto: CreateWorkoutSheetDto) { return this.sheets.create(dto); }
  @Get() list(@Query() query: ListWorkoutsDto) { return this.sheets.list(query); }
  @Get(':id') get(@Param('id', ParseUUIDPipe) id: string) { return this.sheets.get(id); }
}
