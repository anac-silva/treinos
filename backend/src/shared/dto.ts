import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateBy, ValidationOptions } from 'class-validator';

export const Trim = () => Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value);

export function IsCivilDate(options?: ValidationOptions) {
  return ValidateBy({ name: 'isCivilDate', validator: { validate(value: unknown) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, defaultMessage: () => 'Informe uma data válida no formato YYYY-MM-DD.' } }, options);
}

export class PaginationDto {
  @Type(() => Number) @IsInt() @Min(1) @Max(1000000)
  page = 1;
  @Type(() => Number) @IsInt() @Min(1) @Max(100)
  pageSize = 20;
}

export class SearchDto extends PaginationDto {
  @IsOptional() @Trim() @IsString() @MaxLength(100)
  q?: string;
}

export class EvolutionQueryDto {
  @IsOptional() @IsCivilDate()
  from?: string;
  @IsOptional() @IsCivilDate()
  to?: string;
}
