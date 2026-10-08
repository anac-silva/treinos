import { IsEmail, IsEnum, IsInt, IsOptional, IsString, Length, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
import { ClientStatus } from '../../generated/prisma/client';
import { SearchDto, Trim } from '../../shared/dto';

export class CreateClientDto {
  @Trim() @IsString() @Length(1, 100)
  name!: string;
  @IsOptional() @IsInt() @Min(0) @Max(150)
  age?: number | null;
  @IsOptional() @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toLowerCase() : value) @IsEmail() @MaxLength(254)
  email?: string | null;
  @IsOptional() @Trim() @IsString() @MaxLength(40)
  phone?: string | null;
  @IsOptional() @Trim() @IsString() @MaxLength(100)
  goal?: string | null;
  @IsOptional() @Trim() @IsString() @MaxLength(50)
  experienceLevel?: string | null;
  @IsOptional() @IsString() @MaxLength(5000)
  notes?: string | null;
}

export class UpdateClientDto extends CreateClientDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  declare name: string;
  @ValidateIf((_object, value: unknown) => value !== undefined) @IsEnum(ClientStatus)
  status?: ClientStatus;
}

export class ListClientsDto extends SearchDto {
  @IsOptional() @IsEnum(ClientStatus)
  status?: ClientStatus;
  @IsOptional() @Trim() @IsString() @MaxLength(100)
  goal?: string;
}
