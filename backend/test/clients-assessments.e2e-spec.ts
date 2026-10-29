import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import sharp from 'sharp';
import { randomBytes, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/shared/configure-app';
import { PrismaService } from '../src/shared/database/prisma.service';
import { seedAdmin } from '../prisma/seed';
import { OBJECT_STORAGE } from '../src/modules/photos/object-storage';

describe('clients, assessments, measurements e photos HTTP + PostgreSQL', () => {
  let app: NestExpressApplication;
  let database: PrismaService;
  let cookie: string;
  let csrf: string;
  let actorId: string;
  let clientId: string;
  let otherId: string;
  let appointmentId: string;
  let typeId: string;
  let assessmentId: string;
  const schema = `domains_test_${randomUUID().replaceAll('-', '')}`;
  const initial = randomBytes(24).toString('hex');
  const changed = randomBytes(24).toString('hex');
  const files = new Map<string, Buffer>();
  const storage = {
    put: jest.fn(async (key: string, body: Buffer) => { files.set(key, body); }),
    remove: jest.fn(async (key: string) => { files.delete(key); }),
    read: jest.fn(async (key: string) => {
      const body = files.get(key);
      if (!body) throw new Error('Missing photo');
      return body;
    }),
    readUrl: jest.fn(async (key: string) => `https://storage.example/${key}?temporary=test`),
  };
  const http = () => request(app.getHttpServer());
  const create = (path: string, body: object) => http().post(path).set('Cookie', cookie).set('X-CSRF-Token', csrf).send(body);
  const patch = (path: string, body: object) => http().patch(path).set('Cookie', cookie).set('X-CSRF-Token', csrf).send(body);
  const get = (path: string) => http().get(path).set('Cookie', cookie);
  const upload = (buffer: Buffer, contentType = 'image/png') => http().post(`/clients/${clientId}/photo`).set('Cookie', cookie).set('X-CSRF-Token', csrf).attach('file', buffer, { filename: 'photo.png', contentType });

  beforeAll(async () => {
    if (!process.env.TEST_DATABASE_URL) throw new Error('Configure TEST_DATABASE_URL para PostgreSQL de teste.');
    const url = new URL(process.env.TEST_DATABASE_URL);
    url.searchParams.set('schema', schema);
    process.env.DATABASE_URL = url.toString();
    process.env.NODE_ENV = 'test';
    process.env.LOCAL_AUTH_BYPASS = 'false';
    process.env.PHOTO_STORAGE = 'disabled';
    process.env.CORS_ORIGINS = 'http://localhost:5173';
    process.env.TRUST_PROXY = 'false';
    execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { env: process.env, stdio: 'pipe', timeout: 60_000 });
    const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(OBJECT_STORAGE).useValue(storage).compile();
    app = module.createNestApplication<NestExpressApplication>({ bodyParser: false });
    app.useLogger(false);
    configureApp(app);
    await app.init();
    database = app.get(PrismaService);
    actorId = (await seedAdmin(database, { ADMIN_NAME: 'Personal de teste', ADMIN_EMAIL: 'domains@example.test', ADMIN_INITIAL_PASSWORD: initial })).id;
    const login = await http().post('/auth/login').send({ email: 'domains@example.test', password: initial }).expect(200);
    cookie = login.headers['set-cookie'][0].split(';')[0]; csrf = login.body.csrfToken as string;
  });
  afterAll(async () => {
    if (database) await database.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
    if (app) await app.close();
  });

  it('protege os novos módulos e exige a troca inicial', async () => {
    await http().get('/clients').expect(401);
    await get('/clients').expect(403);
    const response = await create('/auth/change-password', { currentPassword: initial, newPassword: changed }).expect(200);
    cookie = response.headers['set-cookie'][0].split(';')[0]; csrf = response.body.csrfToken as string;
    await http().post('/clients').set('Cookie', cookie).send({ name: 'Sem CSRF' }).expect(403);
  });
  it('cria, pesquisa, pagina, consulta e edita contatos; valida entradas', async () => {
    const response = await create('/clients', { name: 'Marina Silva', age: 28, email: 'MARINA@example.test', phone: '11999999999', notes: 'Observação', goal: 'Hipertrofia' }).expect(201);
    clientId = response.body.id as string;
    expect(response.body.email).toBe('marina@example.test');
    otherId = (await create('/clients', { name: 'Outro aluno' }).expect(201)).body.id as string;
    const result = await get('/clients?q=marina&pageSize=1').expect(200);
    expect(result.body.total).toBe(1); expect(result.body.items[0].id).toBe(clientId);
    await patch(`/clients/${clientId}`, { phone: null, notes: 'Contato atualizado' }).expect(200);
    expect((await get(`/clients/${clientId}`).expect(200)).body.phone).toBeNull();
    await patch(`/clients/${clientId}`, { name: null }).expect(400);
    await create('/clients', { name: '   ' }).expect(400);
    await create('/clients', { name: 'Teste', password: 'extra' }).expect(400);
    await get('/clients?page=0').expect(400);
    await get(`/clients/${randomUUID()}`).expect(404);
  });
  it('cria, filtra, edita e cancela agendamentos', async () => {
    const appointment = await create('/appointments', {
      clientId, startsAt: '2026-12-01T14:30:00.000Z', durationMinutes: 60,
      type: 'Treino', notes: 'Levar avaliação anterior',
    }).expect(201);
    appointmentId = appointment.body.id as string;
    expect(appointment.body.client.name).toBe('Marina Silva');
    expect(appointment.body.status).toBe('SCHEDULED');

    const filtered = await get(`/appointments?clientId=${clientId}&from=2026-12-01T00:00:00.000Z&to=2026-12-01T23:59:59.999Z`).expect(200);
    expect(filtered.body.total).toBe(1);
    expect(filtered.body.items[0].id).toBe(appointmentId);
    expect((await get('/appointments?status=CANCELLED').expect(200)).body.total).toBe(0);

    const updated = await patch(`/appointments/${appointmentId}`, {
      startsAt: '2026-12-02T15:00:00.000Z', durationMinutes: 90, notes: null,
    }).expect(200);
    expect(updated.body.startsAt).toBe('2026-12-02T15:00:00.000Z');
    expect(updated.body.durationMinutes).toBe(90);
    expect(updated.body.notes).toBeNull();

    const cancelled = await patch(`/appointments/${appointmentId}`, { status: 'CANCELLED' }).expect(200);
    expect(cancelled.body.status).toBe('CANCELLED');
    await patch(`/appointments/${randomUUID()}`, { status: 'CANCELLED' }).expect(404);
    await create('/appointments', { clientId, startsAt: 'invalid', type: 'Treino' }).expect(400);
    await create('/appointments', { clientId, startsAt: '2026-12-01', type: 'Treino' }).expect(400);
    await create('/appointments', { clientId, startsAt: '2026-12-01T14:30:00.000Z', durationMinutes: 999, type: 'Treino' }).expect(400);
    await create('/appointments', { clientId: randomUUID(), startsAt: '2026-12-01T14:30:00.000Z', type: 'Treino' }).expect(404);
    const preRegistration = await create('/appointments', {
      guestName: 'Novo contato', guestPhone: '11988887777',
      startsAt: '2026-12-03T14:30:00.000Z', type: 'Aula experimental',
    }).expect(201);
    expect(preRegistration.body.clientId).toBeNull();
    expect(preRegistration.body.client).toBeNull();
    expect(preRegistration.body.guestName).toBe('Novo contato');
    expect(preRegistration.body.guestPhone).toBe('11988887777');
    expect((await get('/clients?q=Novo%20contato').expect(200)).body.total).toBe(0);
    await create('/appointments', { guestName: 'Sem telefone', startsAt: '2026-12-03T14:30:00.000Z', type: 'Aula' }).expect(400);
    const converted = await patch(`/appointments/${preRegistration.body.id}`, {
      clientId, guestName: null, guestPhone: null,
    }).expect(200);
    expect(converted.body.client.name).toBe('Marina Silva');
    expect(converted.body.guestName).toBeNull();
    expect(converted.body.guestPhone).toBeNull();
  });
  it('cadastra tipos com nome/unidade e rejeita duplicação', async () => {
    typeId = (await create('/measurement-types', { name: 'Cintura', unit: 'cm' }).expect(201)).body.id as string;
    await create('/measurement-types', { name: 'cintura', unit: 'cm' }).expect(409);
    await create('/measurement-types', { name: 'Braço', unit: ' ' }).expect(400);
    expect((await get('/measurement-types?q=cintura').expect(200)).body.total).toBe(1);
  });
  it('avaliações são independentes e evolução é cronológica', async () => {
    assessmentId = (await create(`/clients/${clientId}/assessments`, { assessedOn: '2026-10-06', weightKg: 70.5, heightCm: 165, bodyFatPercent: 20.5, nextAssessmentOn: '2026-11-06', measurements: [{ typeId, value: 75 }] }).expect(201)).body.id as string;
    const earlier = await create(`/clients/${clientId}/assessments`, { assessedOn: '2026-09-01', weightKg: 72, measurements: [{ typeId, value: 78 }] }).expect(201);
    expect(earlier.body.id).not.toBe(assessmentId);
    const evolution = await get(`/clients/${clientId}/assessments/weight-evolution`).expect(200);
    expect(evolution.body.items.map((item: { value: string }) => item.value)).toEqual(['72', '70.5']);
    const series = await get(`/clients/${clientId}/measurements/${typeId}/evolution`).expect(200);
    expect(series.body.items.map((item: { value: string }) => item.value)).toEqual(['78', '75']);
    expect((await get(`/clients/${clientId}/measurements?from=2026-10-01`).expect(200)).body.items).toHaveLength(1);
    await get(`/clients/${otherId}/assessments/${assessmentId}`).expect(404);
    await get(`/clients/${clientId}/assessments/weight-evolution?from=2026-10-06&to=2026-09-01`).expect(400);
  });
  it('rejeita datas impossíveis, medidas duplicadas e valores inválidos atomicamente', async () => {
    const count = await database.assessment.count();
    await create(`/clients/${clientId}/assessments`, { assessedOn: '2026-02-30', weightKg: 70 }).expect(400);
    await create(`/clients/${clientId}/assessments`, { assessedOn: '2026-10-06', weightKg: null }).expect(400);
    await create(`/clients/${clientId}/assessments`, { assessedOn: '2026-10-06', weightKg: 70, bodyFatPercent: 101 }).expect(400);
    await create(`/clients/${clientId}/assessments`, { assessedOn: '2026-10-06', weightKg: 70, nextAssessmentOn: '2026-10-01' }).expect(400);
    await create(`/clients/${clientId}/assessments`, { assessedOn: '2026-10-06', weightKg: 70, measurements: [{ typeId, value: 1 }, { typeId, value: 2 }] }).expect(400);
    await create(`/clients/${clientId}/assessments`, { assessedOn: '2026-10-06', weightKg: 70, measurements: [{ typeId: randomUUID(), value: 1 }] }).expect(400);
    expect(await database.assessment.count()).toBe(count);
  });
  it('correção exige motivo/version; preserva original e snapshot da unidade', async () => {
    await patch(`/measurement-types/${typeId}`, { name: 'Circunferência da cintura', unit: 'mm' }).expect(200);
    const previous = await get(`/clients/${clientId}/assessments/${assessmentId}`).expect(200);
    expect(previous.body.measurements[0].unit).toBe('cm');
    await create(`/clients/${clientId}/assessments/${assessmentId}/corrections`, { expectedVersion: 1, weightKg: 70 }).expect(400);
    await patch(`/clients/${clientId}/assessments/${assessmentId}`, { weightKg: 60 }).expect(404);
    const corrected = await create(`/clients/${clientId}/assessments/${assessmentId}/corrections`, { expectedVersion: 1, reason: 'Erro de digitação', weightKg: 70, measurements: [{ typeId, value: 74.5 }] }).expect(201);
    expect(corrected.body.version).toBe(2); expect(corrected.body.measurements[0].unit).toBe('cm');
    expect(new Date(corrected.body.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(previous.body.updatedAt).getTime());
    const history = await get(`/clients/${clientId}/assessments/${assessmentId}/corrections`).expect(200);
    expect(history.body[0].before.weightKg).toBe('70.5');
    expect(history.body[0].after.weightKg).toBe('70'); expect(history.body[0].actorId).toBe(actorId);
    await create(`/clients/${clientId}/assessments/${assessmentId}/corrections`, { expectedVersion: 1, reason: 'Versão antiga', weightKg: 69 }).expect(409);
    expect(await database.assessmentCorrection.count()).toBe(1);
  });
  it('inativar cliente/tipo preserva histórico e impede novas medidas inativas', async () => {
    await patch(`/clients/${clientId}`, { status: 'INACTIVE' }).expect(200);
    expect((await get(`/clients/${clientId}/assessments`).expect(200)).body.total).toBe(2);
    expect((await get('/clients?status=INACTIVE').expect(200)).body.total).toBe(1);
    await patch(`/measurement-types/${typeId}`, { active: false }).expect(200);
    await create(`/clients/${clientId}/assessments`, { assessedOn: '2026-10-07', weightKg: 70, measurements: [{ typeId, value: 1 }] }).expect(400);
    await create(`/clients/${clientId}/assessments/${assessmentId}/corrections`, { expectedVersion: 2, reason: 'Corrigir medição antiga', measurements: [{ typeId, value: 74 }] }).expect(201);
    await expect(database.client.delete({ where: { id: clientId } })).rejects.toThrow();
  });
  it('fotos validam conteúdo e tamanho; storage recebe bytes e banco só metadados', async () => {
    const png = await sharp({ create: { width: 3, height: 3, channels: 3, background: '#ffffff' } }).png().toBuffer();
    await get(`/clients/${clientId}/photo`).expect(404);
    await upload(Buffer.from('fake png')).expect(400);
    await upload(png, 'image/jpeg').expect(400);
    await upload(Buffer.alloc(5 * 1024 * 1024 + 1)).expect(413);
    await upload(png).expect(201);
    await upload(png).expect(201);
    expect(await database.clientPhoto.count({ where: { clientId, principal: true } })).toBe(1);
    expect(await database.clientPhoto.count({ where: { clientId } })).toBe(2);
    expect(storage.put).toHaveBeenCalledTimes(2);
    const result = await get(`/clients/${clientId}/photo`).expect(200);
    expect(result.body.url).toContain('https://storage.example/'); expect(result.body.expiresIn).toBe(300);
    expect(result.body.storageKey).toBeUndefined();
    const principal = await database.clientPhoto.findFirstOrThrow({ where: { clientId, principal: true } });
    const content = await get(`/clients/${clientId}/photo/content?key=${encodeURIComponent(principal.storageKey)}`)
      .buffer(true)
      .parse((response, callback) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => callback(null, Buffer.concat(chunks)));
      })
      .expect(200);
    expect(content.headers['content-type']).toContain('image/png');
    expect(content.headers['cache-control']).toBe('private, no-store');
    expect(content.body).toEqual(files.get(principal.storageKey));
    await get(`/clients/${otherId}/photo/content?key=${encodeURIComponent(principal.storageKey)}`).expect(404);
    storage.put.mockRejectedValueOnce(new Error('Unavailable'));
    await upload(png).expect(503);
    expect(await database.clientPhoto.count({ where: { clientId, principal: true } })).toBe(1);
  });
  it('correções concorrentes não sobrescrevem a mesma versão', async () => {
    const responses = await Promise.all([
      create(`/clients/${clientId}/assessments/${assessmentId}/corrections`, { expectedVersion: 3, reason: 'Primeira correção concorrente', notes: 'Correção A' }),
      create(`/clients/${clientId}/assessments/${assessmentId}/corrections`, { expectedVersion: 3, reason: 'Segunda correção concorrente', notes: 'Correção B' }),
    ]);
    expect(responses.map((result) => result.status).sort()).toEqual([201, 409]);
    expect((await get(`/clients/${clientId}/assessments/${assessmentId}`).expect(200)).body.version).toBe(4);
    expect(await database.assessmentCorrection.count()).toBe(3);
  });
  it('compensa upload quando falha no banco, preservando foto principal', async () => {
    const png = await sharp({ create: { width: 3, height: 3, channels: 3, background: '#ffffff' } }).png().toBuffer();
    const previous = (await get(`/clients/${clientId}/photo`).expect(200)).body.id as string;
    const objectCount = files.size;
    const transaction = jest.spyOn(database, '$transaction').mockRejectedValueOnce(new Error('Falha simulada no banco'));
    try { await upload(png).expect(500); }
    finally { transaction.mockRestore(); }
    expect(storage.remove).toHaveBeenCalledTimes(1);
    expect(files.size).toBe(objectCount);
    expect((await get(`/clients/${clientId}/photo`).expect(200)).body.id).toBe(previous);
  });
  it('salva altura no cadastro e avaliação somente com peso', async () => {
    const client = (await create('/clients', { name: 'Cliente altura e peso', heightCm: 175 }).expect(201)).body;
    const saved = await create(`/clients/${client.id}/assessments`, {
      assessedOn: '2026-10-28', weightKg: 70, nextAssessmentOn: null, notes: null, measurements: [],
    }).expect(201);
    expect(saved.body.weightKg).toBe('70');
    expect(saved.body.measurements).toEqual([]);
    expect(saved.body.heightCm).toBeNull();
    expect(saved.body.bodyFatPercent).toBeNull();
    await patch(`/clients/${client.id}`, { name: client.name, heightCm: 176 }).expect(200);
    expect((await get(`/clients/${client.id}`).expect(200)).body.heightCm).toBe('176');
    const history = (await get(`/clients/${client.id}/assessments`).expect(200)).body;
    expect(history.total).toBe(1);
    expect(history.items[0].id).toBe(saved.body.id);
  });
  it('persiste a seleção feminino ou masculino e rejeita valores inválidos', async () => {
    const client = (await create('/clients', { name: 'Cliente ilustração', sex: 'FEMALE' }).expect(201)).body;
    expect((await get(`/clients/${client.id}`).expect(200)).body.sex).toBe('FEMALE');
    await patch(`/clients/${client.id}`, { name: client.name, sex: 'MALE' }).expect(200);
    expect((await get(`/clients/${client.id}`).expect(200)).body.sex).toBe('MALE');
    await patch(`/clients/${client.id}`, { name: client.name, sex: 'INVALID' }).expect(400);
    await patch(`/clients/${client.id}`, { name: client.name, sex: null }).expect(200);
    expect((await get(`/clients/${client.id}`).expect(200)).body.sex).toBeNull();
  });
});


