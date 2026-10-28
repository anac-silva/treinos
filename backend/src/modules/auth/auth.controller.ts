import { Body, Controller, ForbiddenException, Get, HttpCode, Inject, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { APP_CONFIG, AppConfig } from '../../shared/config';
import { publicUser } from '../users/users.service';
import { AuthRequest } from './auth-request';
import { AllowPasswordChange, Public } from './auth.metadata';
import { ChangePasswordDto, LoginDto } from './auth.dto';
import { AuthService, csrfForSession } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, @Inject(APP_CONFIG) private readonly config: AppConfig) {}

  private cookieOptions() { return { httpOnly: true, secure: this.config.production, sameSite: 'lax' as const, path: '/' }; }
  private respond(response: Response, result: Awaited<ReturnType<AuthService['login']>>) {
    response.cookie(this.config.cookieName, result.token, { ...this.cookieOptions(), expires: result.expiresAt });
    return { user: result.user, csrfToken: result.csrfToken };
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) response: Response) {
    return this.respond(response, await this.auth.login(body.email, body.password));
  }

  @Public()
  @Post('local')
  @HttpCode(200)
  async localLogin(@Req() request: AuthRequest, @Res({ passthrough: true }) response: Response) {
    if (!this.config.localAuthBypass || !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(request.socket.remoteAddress || '')) {
      throw new ForbiddenException('O acesso sem senha só está disponível no computador local.');
    }
    const cookies = request.cookies as Record<string, string> | undefined;
    return this.respond(response, await this.auth.localLogin(cookies?.[this.config.cookieName]));
  }

  @AllowPasswordChange()
  @Get('me')
  me(@Req() request: AuthRequest) {
    const cookies = request.cookies as Record<string, string>;
    return { user: publicUser(request.auth!.user), csrfToken: csrfForSession(cookies[this.config.cookieName]) };
  }

  @AllowPasswordChange()
  @Post('logout')
  @HttpCode(204)
  async logout(@Req() request: AuthRequest, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout(request.auth!.session.id);
    response.clearCookie(this.config.cookieName, this.cookieOptions());
  }

  @AllowPasswordChange()
  @Post('change-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async changePassword(@Req() request: AuthRequest, @Body() body: ChangePasswordDto, @Res({ passthrough: true }) response: Response) {
    return this.respond(response, await this.auth.changePassword(request.auth!.user, request.auth!.session, body.currentPassword, body.newPassword));
  }
}
