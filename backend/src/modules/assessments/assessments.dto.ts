import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, IsNumber, IsOptional, IsString, IsUUID, Length, Max, MaxLength, Min, ValidateIf, ValidateNested } from 'class-validator';
import { IsCivilDate, Trim } from '../../shared/dto';

export class MeasurementInputDto {
  @IsUUID() typeId!: string;
  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0) @Max(9999999.999)
  value!: number;
}

export class CreateAssessmentDto {
  @IsCivilDate() assessedOn!: string;
  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0.001) @Max(9999.999)
  weightKg!: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) @Max(9999.99)
  heightCm?: number | null;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100)
  bodyFatPercent?: number | null;
  @IsOptional() @IsString() @MaxLength(5000)
  notes?: string | null;
  @IsOptional() @IsCivilDate()
  nextAssessmentOn?: string | null;
  @ValidateIf((_object, value: unknown) => value !== undefined) @IsArray() @ArrayMaxSize(100) @ValidateNested({ each: true }) @Type(() => MeasurementInputDto)
  measurements?: MeasurementInputDto[];
}

export class CorrectAssessmentDto extends CreateAssessmentDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  declare assessedOn: string;
  @ValidateIf((_object, value: unknown) => value !== undefined)
  declare weightKg: number;
  @Trim() @IsString() @Length(1, 500)
  reason!: string;
  @IsInt() @Min(1)
  expectedVersion!: number;
}
