import { BadRequestException, Inject, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { PrismaService } from '../../shared/database/prisma.service';
import { APP_CONFIG, AppConfig } from '../../shared/config';
import { UsersService, publicUser } from '../users/users.service';
import { hashPassword, verifyPassword } from './password';
import { Session, User } from '../../generated/prisma/client';

export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
export const csrfForSession = (token: string) => createHmac('sha256', token).update('personal-csrf-v1').digest('hex');

@Injectable()
export class AuthService implements OnModuleInit {
  private dummyHash!: string;
  constructor(private readonly database: PrismaService, private readonly users: UsersService,
    @Inject(APP_CONFIG) private readonly config: AppConfig) {}

  async onModuleInit() { this.dummyHash = await hashPassword(randomBytes(32).toString('hex')); }

  private newSession(userId: string) {
    const token = randomBytes(32).toString('hex');
    const csrfToken = csrfForSession(token);
    return { token, csrfToken, data: { userId, tokenHash: tokenHash(token), csrfTokenHash: tokenHash(csrfToken),
      expiresAt: new Date(Date.now() + this.config.sessionTtlHours * 3600_000) } };
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    const valid = await verifyPassword(password, user?.passwordHash || this.dummyHash);
    if (!user || !valid || !user.active) throw new UnauthorizedException('Credenciais inválidas.');
    const next = this.newSession(user.id);
    const updated = await this.database.$transaction(async (tx) => {
      const changed = await tx.user.updateMany({ where: { id: user.id, active: true, passwordHash: user.passwordHash }, data: { lastLoginAt: new Date() } });
      if (changed.count !== 1) throw new UnauthorizedException('Credenciais inválidas.');
      const latest = await tx.user.findUniqueOrThrow({ where: { id: user.id } });
      // Rotaciona a sessão anterior: somente um login ativo por personal.
      await tx.session.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
      await tx.session.create({ data: next.data });
      return latest;
    });
    return { user: publicUser(updated), token: next.token, csrfToken: next.csrfToken, expiresAt: next.data.expiresAt };
  }

  async authenticate(token: string) {
    if (!/^[a-f0-9]{64}$/.test(token)) throw new UnauthorizedException('Sessão inválida.');
    const session = await this.database.session.findUnique({ where: { tokenHash: tokenHash(token) }, include: { user: true } });
    if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.user.active) throw new UnauthorizedException('Sessão inválida ou expirada.');
    return { user: session.user, session };
  }

  async logout(sessionId: string) {
    await this.database.session.updateMany({ where: { id: sessionId, revokedAt: null }, data: { revokedAt: new Date() } });
  }

  async changePassword(user: User, session: Session, currentPassword: string, newPassword: string) {
    if (!await verifyPassword(currentPassword, user.passwordHash)) throw new UnauthorizedException('Senha atual inválida.');
    if (currentPassword === newPassword) throw new BadRequestException('A nova senha deve ser diferente da atual.');
    const passwordHash = await hashPassword(newPassword);
    const next = this.newSession(user.id);
    const updated = await this.database.$transaction(async (tx) => {
      const changed = await tx.user.updateMany({ where: { id: user.id, active: true, passwordHash: user.passwordHash,
        sessions: { some: { id: session.id, revokedAt: null, expiresAt: { gt: new Date() } } } }, data: { passwordHash, mustChangePassword: false } });
      if (changed.count !== 1) throw new UnauthorizedException('Sessão inválida. Faça login novamente.');
      await tx.session.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
      await tx.session.create({ data: next.data });
      return tx.user.findUniqueOrThrow({ where: { id: user.id } });
    });
    return { user: publicUser(updated), token: next.token, csrfToken: next.csrfToken, expiresAt: next.data.expiresAt };
  }
}
