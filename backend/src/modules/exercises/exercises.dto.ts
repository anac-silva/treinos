import { IsOptional, IsString, Length } from 'class-validator';
import { SearchDto, Trim } from '../../shared/dto';

export class CreateExerciseDto {
  @Trim() @IsString() @Length(1, 100)
  name!: string;
}

export class ListExercisesDto extends SearchDto {
  @IsOptional() @Trim() @IsString() @Length(1, 100)
  declare q?: string;
}
