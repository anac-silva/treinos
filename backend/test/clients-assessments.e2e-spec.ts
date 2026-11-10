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
    expect(preRegistration.body.clientId).toBeTruthy();
    expect(preRegistration.body.client.status).toBe('PRE_REGISTERED');
    expect(preRegistration.body.guestName).toBeNull();
    expect(preRegistration.body.guestPhone).toBeNull();
    expect((await get('/clients?q=Novo%20contato').expect(200)).body.total).toBe(1);
    await create('/appointments', { guestName: 'Sem telefone', startsAt: '2026-12-03T14:30:00.000Z', type: 'Aula' }).expect(400);
    const converted = await patch(`/appointments/${preRegistration.body.id}`, {
      clientId, guestName: null, guestPhone: null,
    }).expect(200);
    expect(converted.body.client.name).toBe('Marina Silva');
    expect(converted.body.guestName).toBeNull();
    expect(converted.body.guestPhone).toBeNull();
  });
  it('reúne pré-cadastros, filtra e completa sem perder os agendamentos', async () => {
    const body = { guestName: 'Contato comparativo', guestPhone: '(11) 97777-1234', startsAt: '2026-12-04T14:30:00Z', type: 'Experimental' };
    const [first, second] = await Promise.all([
      create('/appointments', body).expect(201),
      create('/appointments', { ...body, guestPhone: '11977771234' }).expect(201),
    ]);
    expect(first.body.clientId).toBe(second.body.clientId);
    const id = first.body.clientId as string;
    const filtered = await get('/clients?status=PRE_REGISTERED&q=Contato%20comparativo').expect(200);
    expect(filtered.body.total).toBe(1);
    await patch(`/clients/${id}`, { status: 'PRE_REGISTERED', phone: null }).expect(400);
    await patch(`/clients/${id}`, { name: body.guestName, status: 'PRE_REGISTERED', goal: 'Condicionamento' }).expect(200);
    expect((await get('/clients?status=PRE_REGISTERED&goal=Condicionamento').expect(200)).body.items.some((row: { id: string }) => row.id === id)).toBe(true);
    await patch(`/clients/${id}`, { name: body.guestName, status: 'ACTIVE', email: 'contato@example.test' }).expect(200);
    expect((await get('/clients?status=PRE_REGISTERED&q=Contato%20comparativo').expect(200)).body.total).toBe(0);
    const appointments = await get(`/appointments?clientId=${id}`).expect(200);
    expect(appointments.body.total).toBe(2);
    expect(appointments.body.items[0].client.status).toBe('ACTIVE');
    await http().delete(`/clients/${id}`).set('Cookie', cookie).set('X-CSRF-Token', csrf).expect(409);
  });
  it('exclui apenas o pré-cadastro e preserva datas e status dos agendamentos', async () => {
    const saved = await create('/appointments', { guestName: 'Contato removível', guestPhone: '11977770000', startsAt: '2026-12-05T14:30:00Z', type: 'Experimental' }).expect(201);
    const id = saved.body.clientId as string;
    await patch(`/appointments/${saved.body.id}`, { status: 'CANCELLED' }).expect(200);
    await http().delete(`/clients/${id}`).set('Cookie', cookie).expect(403);
    await http().delete(`/clients/${id}`).set('Cookie', cookie).set('X-CSRF-Token', csrf).expect(204);
    await get(`/clients/${id}`).expect(404);
    expect((await get('/clients?status=PRE_REGISTERED&q=Contato%20removível').expect(200)).body.total).toBe(0);
    const appointment = await database.appointment.findUniqueOrThrow({ where: { id: saved.body.id as string } });
    expect(appointment.clientId).toBeNull();
    expect(appointment.guestName).toBe('Contato removível');
    expect(appointment.guestPhone).toBe('11977770000');
    expect(appointment.status).toBe('CANCELLED');
    expect(appointment.startsAt.toISOString()).toBe(saved.body.startsAt);
  });
  it('gera previsão no mesmo horário da avaliação e permite alterar, filtrar e confirmar', async () => {
    const client = (await create('/clients', { name: 'Cliente próxima avaliação' }).expect(201)).body;
    await create('/appointments', { clientId: client.id, startsAt: '2026-11-03T09:15:00-03:00', durationMinutes: 45, type: 'Avaliação física' }).expect(201);
    const assessment = (await create(`/clients/${client.id}/assessments`, { assessedOn: '2026-11-03', nextAssessmentOn: '2026-12-03', weightKg: 70 }).expect(201)).body;
    const path = `/appointments?clientId=${client.id}&status=PENDING_CONFIRMATION`;
    const pending = (await get(path).expect(200)).body;
    expect(pending.total).toBe(1);
    const appointment = pending.items[0];
    expect(appointment.sourceAssessmentId).toBe(assessment.id);
    expect(appointment.startsAt).toBe('2026-12-03T12:15:00.000Z');
    expect(appointment.durationMinutes).toBe(45);
    expect((await get(`/appointments?clientId=${client.id}&includePending=false`).expect(200)).body.total).toBe(1);
    await patch(`/appointments/${appointment.id}`, { startsAt: '2026-12-04T10:30:00-03:00' }).expect(200);
    await create(`/clients/${client.id}/assessments/${assessment.id}/corrections`, { notes: 'Somente observações', reason: 'Complemento', expectedVersion: 1 }).expect(201);
    expect((await get(path).expect(200)).body.items[0].startsAt).toBe('2026-12-04T13:30:00.000Z');
    await create(`/clients/${client.id}/assessments/${assessment.id}/corrections`, { nextAssessmentOn: '2026-12-10', reason: 'Alteração da previsão', expectedVersion: 2 }).expect(201);
    const updated = (await get(path).expect(200)).body;
    expect(updated.total).toBe(1);
    expect(updated.items[0].startsAt).toBe('2026-12-10T13:30:00.000Z');
    await patch(`/appointments/${appointment.id}`, { status: 'SCHEDULED' }).expect(200);
    expect((await get(path).expect(200)).body.total).toBe(0);
    expect((await get(`/appointments?clientId=${client.id}&includePending=false`).expect(200)).body.total).toBe(2);
    await create(`/clients/${client.id}/assessments/${assessment.id}/corrections`, { nextAssessmentOn: '2026-12-15', reason: 'Não alterar horário já confirmado', expectedVersion: 3 }).expect(201);
    const confirmed = await database.appointment.findUniqueOrThrow({ where: { id: appointment.id as string } });
    expect(confirmed.status).toBe('SCHEDULED');
    expect(confirmed.startsAt.toISOString()).toBe('2026-12-10T13:30:00.000Z');
  });
  it('usa o horário do registro quando não há atendimento e mantém o cancelamento', async () => {
    const client = (await create('/clients', { name: 'Avaliação sem atendimento' }).expect(201)).body;
    const assessment = (await create(`/clients/${client.id}/assessments`, { assessedOn: '2026-11-03', nextAssessmentOn: '2026-12-03', weightKg: 70 }).expect(201)).body;
    const appointment = (await get(`/appointments?clientId=${client.id}`).expect(200)).body.items[0];
    const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(assessment.createdAt));
    expect(appointment.startsAt).toBe(new Date(`2026-12-03T${time}:00-03:00`).toISOString());
    await patch(`/appointments/${appointment.id}`, { status: 'CANCELLED' }).expect(200);
    await create(`/clients/${client.id}/assessments/${assessment.id}/corrections`, { nextAssessmentOn: '2026-12-20', reason: 'Manter cancelamento da agenda', expectedVersion: 1 }).expect(201);
    expect((await get(`/appointments?clientId=${client.id}&status=PENDING_CONFIRMATION`).expect(200)).body.total).toBe(0);
    expect((await get(`/appointments?clientId=${client.id}&status=CANCELLED`).expect(200)).body.total).toBe(1);
  });
  it('não gera previsão sem próxima data e cancela a previsão ao remover a data', async () => {
    const client = (await create('/clients', { name: 'Avaliação sem previsão' }).expect(201)).body;
    const assessment = (await create(`/clients/${client.id}/assessments`, { assessedOn: '2026-11-03', weightKg: 70 }).expect(201)).body;
    expect((await get(`/appointments?clientId=${client.id}`).expect(200)).body.total).toBe(0);
    await create(`/clients/${client.id}/assessments/${assessment.id}/corrections`, { nextAssessmentOn: '2026-12-03', reason: 'Definir previsão', expectedVersion: 1 }).expect(201);
    expect((await get(`/appointments?clientId=${client.id}&status=PENDING_CONFIRMATION`).expect(200)).body.total).toBe(1);
    await create(`/clients/${client.id}/assessments/${assessment.id}/corrections`, { nextAssessmentOn: null, reason: 'Retirar previsão', expectedVersion: 2 }).expect(201);
    expect((await get(`/appointments?clientId=${client.id}&status=PENDING_CONFIRMATION`).expect(200)).body.total).toBe(0);
    expect((await get(`/appointments?clientId=${client.id}&status=CANCELLED`).expect(200)).body.total).toBe(1);
  });
  it('cadastra exercícios, modelos por nível e versões de treinos por cliente', async () => {
    const exercise = await create('/exercises', { name: 'Agachamento livre' }).expect(201);
    expect(exercise.body.name).toBe('Agachamento livre');
    await create('/exercises', { name: '  agachamento livre ' }).expect(409);
    const listedExercises = await get('/exercises?q=agachamento').expect(200);
    expect(listedExercises.body.total).toBe(1);

    const exerciseRow = { exerciseId: exercise.body.id, sets: 3, repetitions: '8-12', restSeconds: 90 };
    const template = await create('/workouts', {
      clientId: null, title: 'Modelo básico - inferiores', level: 'BASIC',
      exercises: [exerciseRow],
    }).expect(201);
    expect(template.body.clientId).toBeNull();
    expect(template.body.isActive).toBe(false);
    expect(template.body.exercises[0].exercise.name).toBe('Agachamento livre');

    const firstPlan = await create('/workouts', {
      clientId, title: 'Treino A', level: 'BASIC', sourcePlanId: template.body.id,
      exercises: [exerciseRow],
    }).expect(201);
    expect(firstPlan.body.isActive).toBe(true);
    expect(firstPlan.body.sourcePlan.title).toBe('Modelo básico - inferiores');
    const nextPlan = await create('/workouts', {
      clientId, title: 'Treino A atualizado', level: 'INTERMEDIATE',
      exercises: [{ ...exerciseRow, sets: 4 }],
    }).expect(201);
    expect(nextPlan.body.isActive).toBe(true);
    expect((await get(`/workouts?clientId=${clientId}`).expect(200)).body.total).toBe(2);
    expect((await get('/workouts?level=ADVANCED').expect(200)).body.items).toHaveLength(0);
    expect((await get(`/workouts/${firstPlan.body.id}`).expect(200)).body.isActive).toBe(false);
    await create('/workouts', {
      clientId, title: 'Sem exercícios', level: 'BASIC', exercises: [],
    }).expect(400);
    await create('/workouts', {
      clientId: otherId, title: 'Exercício inválido', level: 'BASIC',
      exercises: [{ ...exerciseRow, exerciseId: randomUUID() }],
    }).expect(400);
    await get(`/workouts?clientId=${randomUUID()}`).expect(404);
  });
  it('combina modelos independentes, copia fichas completas e preserva os originais', async () => {
    const exercise = await database.exercise.findFirstOrThrow();
    const exerciseRow = { exerciseId: exercise.id, sets: 3, repetitions: '10', restSeconds: 60 };
    const first = (await create('/workouts', { title: 'Superiores variação 1', level: 'BASIC', focus: 'Superiores', exercises: [exerciseRow] }).expect(201)).body;
    const second = (await create('/workouts', { title: 'Inferiores variação 2', level: 'INTERMEDIATE', focus: 'Inferiores', exercises: [exerciseRow] }).expect(201)).body;
    const client = (await create('/clients', { name: 'Cliente ficha combinada' }).expect(201)).body;
    const sheet = (await create('/workout-sheets', { clientId: client.id, title: 'Ficha A e B', blocks: [
      { title: 'Superiores personalizado', level: 'BASIC', focus: 'Superiores', sourcePlanId: first.id, exercises: [{ ...exerciseRow, sets: 4 }] },
      { title: 'Inferiores', level: 'INTERMEDIATE', focus: 'Inferiores', sourcePlanId: second.id, exercises: [exerciseRow] },
    ] }).expect(201)).body;
    expect(sheet.isActive).toBe(true);
    expect(sheet.blocks.map((block: { position: number }) => block.position)).toEqual([0, 1]);
    expect(sheet.blocks.every((block: { isActive: boolean }) => block.isActive)).toBe(true);
    expect(sheet.blocks[0].exercises[0].sets).toBe(4);
    expect((await get(`/workouts/${first.id}`).expect(200)).body.exercises[0].sets).toBe(3);
    const templates = (await get('/workouts?templatesOnly=true&focus=Superiores').expect(200)).body;
    expect(templates.items.some((block: { id: string }) => block.id === first.id)).toBe(true);
    expect(templates.items.every((block: { sheetId: string | null }) => !block.sheetId)).toBe(true);
    await http().put(`/workouts/${first.id}`).set('Cookie', cookie).set('X-CSRF-Token', csrf).send({ title: 'Modelo atualizado', level: 'BASIC', focus: 'Superiores', exercises: [{ ...exerciseRow, sets: 5 }] }).expect(200);
    expect((await get(`/workout-sheets/${sheet.id}`).expect(200)).body.blocks[0].exercises[0].sets).toBe(4);
    const copy = (await create('/workout-sheets', { title: 'Ficha completa modelo', sourceSheetId: sheet.id, blocks: [
      { title: 'Bloco B como A', level: 'INTERMEDIATE', sourcePlanId: sheet.blocks[1].id, exercises: [exerciseRow] },
      { title: 'Bloco A como B', level: 'BASIC', sourcePlanId: sheet.blocks[0].id, exercises: [{ ...exerciseRow, sets: 6 }] },
    ] }).expect(201)).body;
    expect(copy.clientId).toBeNull();
    expect(copy.isActive).toBe(false);
    expect(copy.blocks.every((block: { isActive: boolean }) => !block.isActive)).toBe(true);
    expect(copy.sourceSheet.id).toBe(sheet.id);
    expect(copy.blocks[1].id).not.toBe(sheet.blocks[0].id);
    expect((await get('/workout-sheets?templatesOnly=true').expect(200)).body.items.some((item: { id: string }) => item.id === copy.id)).toBe(true);
    const replacement = (await create('/workout-sheets', { clientId: client.id, title: 'Ficha revisada', sourceSheetId: copy.id, blocks: [
      { title: 'Novo treino A', level: 'BASIC', sourcePlanId: copy.blocks[0].id, exercises: [exerciseRow] },
      { title: 'Novo treino B', level: 'BASIC', sourcePlanId: copy.blocks[1].id, exercises: [exerciseRow] },
      { title: 'Novo treino C', level: 'BASIC', exercises: [exerciseRow] },
    ] }).expect(201)).body;
    expect(replacement.blocks).toHaveLength(3);
    expect(replacement.blocks.every((block: { isActive: boolean }) => block.isActive)).toBe(true);
    const history = (await get(`/workout-sheets?clientId=${client.id}`).expect(200)).body;
    expect(history.total).toBe(2);
    expect(history.items.filter((item: { isActive: boolean }) => item.isActive)).toHaveLength(1);
    const original = (await get(`/workout-sheets/${sheet.id}`).expect(200)).body;
    expect(original.isActive).toBe(false);
    expect(original.blocks.every((block: { isActive: boolean }) => !block.isActive)).toBe(true);
    expect(original.blocks[0].exercises[0].sets).toBe(4);
  });
  it('valida todos os blocos atomicamente e serializa fichas concorrentes', async () => {
    const client = (await create('/clients', { name: 'Concorrência de fichas' }).expect(201)).body;
    const exercise = await database.exercise.findFirstOrThrow();
    const block = { title: 'Bloco válido', level: 'BASIC', exercises: [{ exerciseId: exercise.id, sets: 3, repetitions: '10' }] };
    const original = (await create('/workout-sheets', { clientId: client.id, title: 'Original', blocks: [block] }).expect(201)).body;
    await create('/workout-sheets', { clientId: client.id, title: 'Inválida', blocks: [block, { ...block, exercises: [] }] }).expect(400);
    await create('/workout-sheets', { clientId: client.id, title: 'Referência inválida', sourceSheetId: randomUUID(), blocks: [block] }).expect(404);
    await create('/workout-sheets', { clientId: client.id, title: 'Exercício inválido', blocks: [{ ...block, exercises: [{ exerciseId: randomUUID(), sets: 3, repetitions: '10' }] }] }).expect(400);
    expect((await get(`/workout-sheets/${original.id}`).expect(200)).body.isActive).toBe(true);
    const results = await Promise.all([
      create('/workout-sheets', { clientId: client.id, title: 'Concorrente 1', blocks: [block, block] }),
      create('/workout-sheets', { clientId: client.id, title: 'Concorrente 2', blocks: [block] }),
    ]);
    expect(results.map((result) => result.status)).toEqual([201, 201]);
    expect(await database.workoutSheet.count({ where: { clientId: client.id, isActive: true } })).toBe(1);
    const active = await database.workoutSheet.findFirstOrThrow({ where: { clientId: client.id, isActive: true }, include: { blocks: true } });
    expect(await database.workoutPlan.count({ where: { clientId: client.id, isActive: true } })).toBe(active.blocks.length);
    await patch(`/clients/${client.id}`, { status: 'INACTIVE' }).expect(200);
    await create('/workout-sheets', { clientId: client.id, title: 'Cliente inativo', blocks: [block] }).expect(400);
    await http().put(`/workouts/${active.blocks[0].id}`).set('Cookie', cookie).set('X-CSRF-Token', csrf).send(block).expect(400);
    await http().post('/workout-sheets').set('Cookie', cookie).send({ title: 'Sem CSRF', blocks: [block] }).expect(403);
  });
  it('pagina resumos de fichas por aluno, situação e busca sem carregar exercícios', async () => {
    const client = (await create('/clients', { name: 'Aluno busca resumo exclusivo' }).expect(201)).body;
    const other = (await create('/clients', { name: 'Outro aluno resumo' }).expect(201)).body;
    const exercise = await database.exercise.findFirstOrThrow();
    const block = { title: 'Bloco resumo', level: 'BASIC', exercises: [{ exerciseId: exercise.id, sets: 3, repetitions: '10' }] };
    const first = (await create('/workout-sheets', { clientId: client.id, title: 'Primeira', blocks: [block] }).expect(201)).body;
    const current = (await create('/workout-sheets', { clientId: client.id, title: 'Atual', blocks: [block, block] }).expect(201)).body;
    await create('/workout-sheets', { clientId: other.id, title: 'Outro', blocks: [block] }).expect(201);
    const summary = (await get(`/workout-sheets?clientId=${client.id}&view=summary&pageSize=1&isActive=true`).expect(200)).body;
    expect(summary.total).toBe(1);
    expect(summary.items[0].id).toBe(current.id);
    expect(summary.items[0]._count.blocks).toBe(2);
    expect(summary.items[0].blocks).toBeUndefined();
    const history = (await get(`/workout-sheets?clientId=${client.id}&view=summary&isActive=false`).expect(200)).body;
    expect(history.items.map((item: { id: string }) => item.id)).toEqual([first.id]);
    const search = (await get('/workout-sheets?view=summary&q=resumo%20exclusivo&pageSize=1').expect(200)).body;
    expect(search.total).toBe(2);
    expect(search.items).toHaveLength(1);
    const secondPage = (await get('/workout-sheets?view=summary&q=resumo%20exclusivo&pageSize=1&page=2').expect(200)).body;
    expect(secondPage.items[0].id).not.toBe(search.items[0].id);
    expect((await get(`/workout-sheets/${current.id}`).expect(200)).body.blocks[0].exercises).toHaveLength(1);
    await get('/workout-sheets?view=invalid').expect(400);
  });

  it('pagina avaliações por dias completos, sem separar registros da mesma data', async () => {
    const client = (await create('/clients', { name: 'Aluno histórico por dia' }).expect(201)).body;
    for (const assessedOn of ['2026-10-01', '2026-11-01', '2026-11-01']) {
      await create(`/clients/${client.id}/assessments`, { assessedOn, weightKg: 70, measurements: [] }).expect(201);
    }
    const first = (await get(`/clients/${client.id}/assessments/days?pageSize=1`).expect(200)).body;
    expect(first.total).toBe(2);
    expect(first.items).toHaveLength(1);
    expect(first.items[0].day).toBe('2026-11-01');
    expect(first.items[0].assessments).toHaveLength(2);
    const second = (await get(`/clients/${client.id}/assessments/days?pageSize=1&page=2`).expect(200)).body;
    expect(second.items[0].day).toBe('2026-10-01');
    expect(second.items[0].assessments).toHaveLength(1);
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
    expect(await database.assessmentCorrection.count({ where: { assessmentId } })).toBe(1);
  });
  it('inativar cliente/tipo preserva histórico e impede novas medidas inativas', async () => {
    await patch(`/clients/${clientId}`, { status: 'INACTIVE' }).expect(200);
    expect((await get(`/clients/${clientId}/assessments`).expect(200)).body.total).toBe(2);
    expect((await get('/clients?status=INACTIVE&q=Marina').expect(200)).body.total).toBe(1);
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
    expect(await database.assessmentCorrection.count({ where: { assessmentId } })).toBe(3);
  });
  it('compensa upload quando falha no banco, preservando foto principal', async () => {
    const png = await sharp({ create: { width: 3, height: 3, channels: 3, background: '#ffffff' } }).png().toBuffer();
    const previous = (await get(`/clients/${clientId}/photo`).expect(200)).body.id as string;
    const objectCount = files.size;
    const originalTransaction = database.$transaction.bind(database);
    const transaction = jest.spyOn(database, '$transaction')
      .mockImplementationOnce(originalTransaction) // Shared rate limiter runs before the upload transaction.
      .mockRejectedValueOnce(new Error('Falha simulada no banco'));
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

