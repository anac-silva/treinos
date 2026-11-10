import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionGuard } from './session.guard';
import { DatabaseModule } from '../../shared/database/database.module';
import { PostgresThrottlerStorage } from './postgres-throttler.storage';
import { PrismaService } from '../../shared/database/prisma.service';

@Module({
  imports: [UsersModule, ThrottlerModule.forRootAsync({
    imports: [DatabaseModule],
    inject: [PrismaService],
    useFactory: (database: PrismaService) => ({ storage: new PostgresThrottlerStorage(database), throttlers: [{ name: 'default', ttl: 60_000, limit: 120 }] }),
  })],
  controllers: [AuthController],
  providers: [AuthService, { provide: APP_GUARD, useClass: ThrottlerGuard }, { provide: APP_GUARD, useClass: SessionGuard }],
})
export class AuthModule {}
