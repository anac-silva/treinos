import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { timingSafeEqual } from 'node:crypto';
import { APP_CONFIG, AppConfig } from '../../shared/config';
import { ALLOW_PASSWORD_CHANGE, PUBLIC } from './auth.metadata';
import { AuthRequest } from './auth-request';
import { AuthService, tokenHash } from './auth.service';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly auth: AuthService,
    @Inject(APP_CONFIG) private readonly config: AppConfig) {}

  async canActivate(context: ExecutionContext) {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC, targets)) return true;
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const cookies = request.cookies as Record<string, unknown> | undefined;
    const token = cookies?.[this.config.cookieName];
    if (typeof token !== 'string') throw new UnauthorizedException('Autenticação necessária.');
    request.auth = await this.auth.authenticate(token);
    if (request.auth.user.mustChangePassword && !this.config.localAuthBypass && !this.reflector.getAllAndOverride<boolean>(ALLOW_PASSWORD_CHANGE, targets)) {
      throw new ForbiddenException({ code: 'PASSWORD_CHANGE_REQUIRED', message: 'Altere a senha inicial antes de continuar.' });
    }
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      const csrf = request.get('x-csrf-token');
      if (!csrf || !/^[a-f0-9]{64}$/.test(csrf) || !timingSafeEqual(Buffer.from(tokenHash(csrf), 'hex'), Buffer.from(request.auth.session.csrfTokenHash, 'hex'))) {
        throw new ForbiddenException({ code: 'CSRF_INVALID', message: 'Token CSRF inválido.' });
      }
    }
    return true;
  }
}
