import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateExerciseDto, ListExercisesDto } from './exercises.dto';
import { ExercisesService } from './exercises.service';

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercises: ExercisesService) {}

  @Post()
  create(@Body() dto: CreateExerciseDto) { return this.exercises.create(dto); }

  @Get()
  list(@Query() query: ListExercisesDto) { return this.exercises.list(query); }
}
