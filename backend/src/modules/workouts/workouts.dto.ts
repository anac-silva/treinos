import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, Length, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { WorkoutLevel } from '../../generated/prisma/client';
import { SearchDto, Trim } from '../../shared/dto';

export class WorkoutExerciseInputDto {
  @IsUUID()
  exerciseId!: string;

  @IsInt() @Min(1) @Max(30)
  sets!: number;

  @Trim() @IsString() @Length(1, 40)
  repetitions!: string;

  @IsOptional() @IsInt() @Min(0) @Max(3600)
  restSeconds?: number | null;

  @IsOptional() @IsString() @MaxLength(1000)
  notes?: string | null;
}

export class WorkoutBlockInputDto {
  @Trim() @IsString() @Length(1, 100)
  title!: string;

  @IsEnum(WorkoutLevel)
  level!: WorkoutLevel;

  @IsOptional() @Trim() @IsString() @MaxLength(100)
  focus?: string | null;

  @IsOptional() @IsString() @MaxLength(5000)
  notes?: string | null;

  @IsOptional() @IsUUID()
  sourcePlanId?: string | null;

  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(100) @ValidateNested({ each: true }) @Type(() => WorkoutExerciseInputDto)
  exercises!: WorkoutExerciseInputDto[];
}

export class CreateWorkoutDto extends WorkoutBlockInputDto {
  @IsOptional() @IsUUID()
  clientId?: string | null;
}

export class CreateWorkoutSheetDto {
  @IsOptional() @IsUUID()
  clientId?: string | null;
  @Trim() @IsString() @Length(1, 100)
  title!: string;
  @IsOptional() @IsString() @MaxLength(5000)
  notes?: string | null;
  @IsOptional() @IsUUID()
  sourceSheetId?: string | null;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(26) @ValidateNested({ each: true }) @Type(() => WorkoutBlockInputDto)
  blocks!: WorkoutBlockInputDto[];
}

export class ListWorkoutsDto extends SearchDto {
  @IsOptional() @IsIn(['summary', 'full'])
  view?: string;

  @IsOptional() @IsIn(['true', 'false'])
  isActive?: string;

  @IsOptional() @IsUUID()
  clientId?: string;

  @IsOptional() @IsEnum(WorkoutLevel)
  level?: WorkoutLevel;
  @IsOptional() @Trim() @IsString() @MaxLength(100)
  focus?: string;
  @IsOptional() @IsIn(['true', 'false'])
  templatesOnly?: string;
}
