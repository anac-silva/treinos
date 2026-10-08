import { IsBoolean, IsString, Length, ValidateIf } from 'class-validator';
import { Trim } from '../../shared/dto';
export class CreateMeasurementTypeDto {
  @Trim() @IsString() @Length(1, 100)
  name!: string;
  @Trim() @IsString() @Length(1, 20)
  unit!: string;
}
export class UpdateMeasurementTypeDto extends CreateMeasurementTypeDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  declare name: string;
  @ValidateIf((_object, value: unknown) => value !== undefined)
  declare unit: string;
  @ValidateIf((_object, value: unknown) => value !== undefined) @IsBoolean()
  active?: boolean;
}
