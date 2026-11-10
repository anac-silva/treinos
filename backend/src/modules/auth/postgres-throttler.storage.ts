import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { ThrottlerStorage } from '@nestjs/throttler';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class PostgresThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly database: PrismaService) {}

  async increment(rawKey: string, ttl: number, limit: number, blockDuration: number) {
    const key = createHash('sha256').update(rawKey).digest('hex');
    return this.database.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${key}))`;
      const now = Date.now();
      const previous = await tx.throttleBucket.findUnique({ where: { key } });
      const blocked = previous?.blockedUntil && previous.blockedUntil.getTime() > now;
      const reset = !previous || previous.expiresAt.getTime() <= now || (previous.blockedUntil && !blocked);
      const hits = blocked ? previous.hits : reset ? 1 : previous.hits + 1;
      const expiresAt = reset ? new Date(now + ttl) : previous.expiresAt;
      const blockedUntil = blocked ? previous.blockedUntil : hits > limit ? new Date(now + blockDuration) : null;
      await tx.throttleBucket.upsert({ where: { key }, create: { key, hits, expiresAt, blockedUntil }, update: { hits, expiresAt, blockedUntil } });
      // Bound stale tracking data; raw IP addresses are never persisted.
      await tx.throttleBucket.deleteMany({ where: { expiresAt: { lt: new Date(now - 86400000) }, OR: [{ blockedUntil: null }, { blockedUntil: { lt: new Date(now) } }] } });
      return { totalHits: hits, timeToExpire: Math.max(0, Math.ceil((expiresAt.getTime() - now) / 1000)), isBlocked: Boolean(blockedUntil), timeToBlockExpire: blockedUntil ? Math.max(0, Math.ceil((blockedUntil.getTime() - now) / 1000)) : 0 };
    });
  }
}
