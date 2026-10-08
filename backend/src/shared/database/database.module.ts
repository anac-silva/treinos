import { Global, Module } from '@nestjs/common';
import { APP_CONFIG, readConfig } from '../config';
import { PrismaService } from './prisma.service';

@Global()
@Module({ providers: [{ provide: APP_CONFIG, useFactory: () => readConfig() }, PrismaService], exports: [APP_CONFIG, PrismaService] })
export class DatabaseModule {}
