import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, Matches, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { AppointmentStatus } from '../../generated/prisma/client';
import { PaginationDto, Trim } from '../../shared/dto';

const zonedDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;

export class CreateAppointmentDto {
  @IsOptional() @IsUUID()
  clientId?: string;

  @IsOptional() @Trim() @IsString() @Length(1, 100)
  guestName?: string;

  @IsOptional() @Trim() @IsString() @Length(1, 40)
  guestPhone?: string;

  @IsDateString() @Matches(zonedDateTime)
  startsAt!: string;

  @IsOptional() @IsInt() @Min(5) @Max(480)
  durationMinutes?: number;

  @Trim() @IsString() @Length(1, 100)
  type!: string;

  @IsOptional() @IsString() @MaxLength(5000)
  notes?: string | null;
}

export class UpdateAppointmentDto {
  @IsOptional() @ValidateIf((_object, value: unknown) => value !== null) @IsUUID()
  clientId?: string | null;

  @IsOptional() @Trim() @IsString() @Length(1, 100)
  guestName?: string | null;

  @IsOptional() @Trim() @IsString() @Length(1, 40)
  guestPhone?: string | null;

  @ValidateIf((_object, value: unknown) => value !== undefined) @IsDateString() @Matches(zonedDateTime)
  startsAt?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined) @IsInt() @Min(5) @Max(480)
  durationMinutes?: number;

  @ValidateIf((_object, value: unknown) => value !== undefined) @Trim() @IsString() @Length(1, 100)
  type?: string;

  @IsOptional() @IsString() @MaxLength(5000)
  notes?: string | null;

  @IsOptional() @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}

export class ListAppointmentsDto extends PaginationDto {
  @IsOptional() @IsDateString() @Matches(zonedDateTime)
  from?: string;

  @IsOptional() @IsDateString() @Matches(zonedDateTime)
  to?: string;

  @IsOptional() @IsUUID()
  clientId?: string;

  @IsOptional() @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}
