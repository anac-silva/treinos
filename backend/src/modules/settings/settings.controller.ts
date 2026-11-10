import { Body, Controller, Get, Patch } from '@nestjs/common';
import { IsInt, Max, Min } from 'class-validator';
import { PrismaService } from '../../shared/database/prisma.service';

export class UpdateSettingsDto {
  @IsInt() @Min(1) @Max(3650)
  declare assessmentIntervalDays: number;
}

@Controller('settings')
export class SettingsController {
  constructor(private readonly database: PrismaService) {}
  @Get()
  async get() {
    return await this.database.appSettings.findUnique({ where: { id: 1 } }) || { id: 1, assessmentIntervalDays: 90 };
  }
  @Patch()
  update(@Body() dto: UpdateSettingsDto) {
    return this.database.appSettings.upsert({ where: { id: 1 }, create: { id: 1, assessmentIntervalDays: dto.assessmentIntervalDays }, update: { assessmentIntervalDays: dto.assessmentIntervalDays } });
  }
}
