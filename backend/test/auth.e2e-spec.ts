import 'reflect-metadata';
import { Controller, Get, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { randomBytes, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/shared/configure-app';
import { PrismaService } from '../src/shared/database/prisma.service';
import { seedAdmin } from '../prisma/seed';
import { verifyPassword } from '../src/modules/auth/password';

// Rota de negócio somente no módulo de testes: prova que o guard é global.
@Controller('protected')
class ProtectedController { @Get() read() { return { ok: true }; } }
@Module({ imports: [AppModule], controllers: [ProtectedController] })
class TestAppModule {}

describe('auth HTTP + PostgreSQL real', () => {
  let app: NestExpressApplication;
  let database: PrismaService;
  let cookie: string;
  let csrf: string;
  let userId: string;
  const initial = randomBytes(24).toString('hex');
  const changed = randomBytes(24).toString('hex');
  const admin = { ADMIN_NAME: 'Personal de teste', ADMIN_EMAIL: 'personal@example.test', ADMIN_INITIAL_PASSWORD: initial };
  const schema = `auth_test_${randomUUID().replaceAll('-', '')}`;

  function login(password = initial, ip = '127.0.0.20') {
    return request(app.getHttpServer()).post('/auth/login').set('X-Forwarded-For', ip).send({ email: admin.ADMIN_EMAIL, password });
  }
  function session(response: request.Response) {
    cookie = (response.headers['set-cookie'] as unknown as string[])[0].split(';')[0];
    csrf = response.body.csrfToken as string;
  }
  beforeAll(async () => {
    if (!process.env.TEST_DATABASE_URL) throw new Error('Configure TEST_DATABASE_URL para um PostgreSQL de teste.');
    const url = new URL(process.env.TEST_DATABASE_URL);
    url.searchParams.set('schema', schema);
    process.env.DATABASE_URL = url.toString();
    process.env.NODE_ENV = 'test';
    process.env.CORS_ORIGINS = 'http://localhost:5173';
    process.env.TRUST_PROXY = 'loopback';
    // Migrations em schema novo isolado; não apaga nem redefine banco existente.
    execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { env: process.env, stdio: 'pipe', timeout: 60_000 });
    const module = await Test.createTestingModule({ imports: [TestAppModule] }).compile();
    app = module.createNestApplication<NestExpressApplication>({ bodyParser: false });
    app.useLogger(false);
    configureApp(app);
    await app.init();
    database = app.get(PrismaService);
    userId = (await seedAdmin(database, admin)).id;
  });
  afterAll(async () => {
    if (database) await database.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
    if (app) await app.close();
  });

  it('seed é idempotente e banco rejeita um segundo personal', async () => {
    const before = await database.user.findUniqueOrThrow({ where: { id: userId } });
    await seedAdmin(database, { ...admin, ADMIN_INITIAL_PASSWORD: changed });
    const after = await database.user.findUniqueOrThrow({ where: { id: userId } });
    expect(after.passwordHash).toBe(before.passwordHash);
    expect(await verifyPassword(initial, after.passwordHash)).toBe(true);
    await expect(database.user.create({ data: { name: 'Outro', email: 'other@example.test', passwordHash: 'not-a-password', singleton: 2 } })).rejects.toThrow();
  });
  it('rejeita acesso anônimo, campos extras, origem indevida e senha incorreta', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
    await request(app.getHttpServer()).post('/auth/login').send({ email: admin.ADMIN_EMAIL, password: initial, active: true }).expect(400);
    await request(app.getHttpServer()).post('/auth/login').set('Origin', 'https://untrusted.example').send({ email: admin.ADMIN_EMAIL, password: initial }).expect(403);
    await login('wrong', '127.0.0.21').expect(401);
  });
  it('login emite cookie seguro, não expõe hash e exige troca de senha', async () => {
    const response = await login().expect(200);
    session(response);
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(response.headers['set-cookie'][0]).toContain('SameSite=Lax');
    expect(response.body.user.passwordHash).toBeUndefined();
    expect(response.body.user.mustChangePassword).toBe(true);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    const me = await request(app.getHttpServer()).get('/auth/me').set('Cookie', cookie).expect(200);
    expect(me.body.csrfToken).toBe(csrf);
    const blocked = await request(app.getHttpServer()).get('/protected').set('Cookie', cookie).expect(403);
    expect(blocked.body.error.code).toBe('PASSWORD_CHANGE_REQUIRED');
  });
  it('troca exige CSRF e senha atual; valida nova senha e rotaciona sessão', async () => {
    const oldCookie = cookie;
    await request(app.getHttpServer()).post('/auth/change-password').set('Cookie', cookie).send({ currentPassword: initial, newPassword: changed }).expect(403);
    await request(app.getHttpServer()).post('/auth/change-password').set('Cookie', cookie).set('X-CSRF-Token', csrf).send({ currentPassword: 'wrong', newPassword: changed }).expect(401);
    await request(app.getHttpServer()).post('/auth/change-password').set('Cookie', cookie).set('X-CSRF-Token', csrf).send({ currentPassword: initial, newPassword: 'short' }).expect(400);
    const response = await request(app.getHttpServer()).post('/auth/change-password').set('Cookie', cookie).set('X-CSRF-Token', csrf).send({ currentPassword: initial, newPassword: changed }).expect(200);
    session(response);
    expect(response.body.user.mustChangePassword).toBe(false);
    expect(cookie).not.toBe(oldCookie);
    await request(app.getHttpServer()).get('/auth/me').set('Cookie', oldCookie).expect(401);
    await request(app.getHttpServer()).get('/protected').set('Cookie', cookie).expect(200);
    await login(initial, '127.0.0.22').expect(401);
    const result = await login(changed, '127.0.0.22').expect(200);
    session(result);
  });
  it('logout revoga sessão; sessão expirada e usuário inativo são rejeitados', async () => {
    const old = cookie;
    await request(app.getHttpServer()).post('/auth/logout').set('Cookie', cookie).set('X-CSRF-Token', csrf).expect(204);
    await request(app.getHttpServer()).get('/auth/me').set('Cookie', old).expect(401);
    session(await login(changed, '127.0.0.23').expect(200));
    await database.session.updateMany({ where: { userId, revokedAt: null }, data: { expiresAt: new Date(Date.now() - 1000) } });
    await request(app.getHttpServer()).get('/auth/me').set('Cookie', cookie).expect(401);
    session(await login(changed, '127.0.0.23').expect(200));
    await database.user.update({ where: { id: userId }, data: { active: false } });
    await request(app.getHttpServer()).get('/auth/me').set('Cookie', cookie).expect(401);
    await login(changed, '127.0.0.24').expect(401);
    await database.user.update({ where: { id: userId }, data: { active: true } });
  });
  it('login limita tentativas por IP', async () => {
    for (let index = 0; index < 5; index++) await login('wrong', '127.0.0.30').expect(401);
    await login('wrong', '127.0.0.30').expect(429);
  });
  it('produção exige HTTPS e emite cookie Secure com prefixo __Host', async () => {
    process.env.NODE_ENV = 'production';
    process.env.CORS_ORIGINS = 'https://personal.example';
    let productionApp: NestExpressApplication | undefined;
    try {
      const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
      productionApp = module.createNestApplication<NestExpressApplication>({ bodyParser: false });
      productionApp.useLogger(false);
      configureApp(productionApp);
      await productionApp.init();
      await request(productionApp.getHttpServer()).post('/auth/login').send({ email: admin.ADMIN_EMAIL, password: changed }).expect(400);
      const response = await request(productionApp.getHttpServer()).post('/auth/login').set('X-Forwarded-Proto', 'https').set('Origin', 'https://personal.example').send({ email: admin.ADMIN_EMAIL, password: changed }).expect(200);
      const secureCookie = response.headers['set-cookie'][0];
      expect(secureCookie).toContain('__Host-personal_session=');
      expect(secureCookie).toContain('Secure');
      expect(secureCookie).toContain('HttpOnly');
      expect(secureCookie).not.toContain('Domain=');
      expect(response.headers['access-control-allow-origin']).toBe('https://personal.example');
    } finally {
      if (productionApp) await productionApp.close();
      process.env.NODE_ENV = 'test';
      process.env.CORS_ORIGINS = 'http://localhost:5173';
    }
  });
});
