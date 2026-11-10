import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const url = process.env.DATABASE_URL!;
if (process.env.NODE_ENV === 'production' || !['localhost', '127.0.0.1'].includes(new URL(url).hostname) || !process.argv.includes('--reset-clients')) {
  throw new Error('Use --reset-clients somente no banco local de desenvolvimento.');
}
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date());
const day = (offset: number) => new Date(Date.parse(today) + offset * 86400000);
const names = ['ANA SILVA', 'BRUNO COSTA', 'CAMILA SANTOS', 'DANIEL OLIVEIRA', 'ELISA LIMA', 'FELIPE SOUZA', 'GABRIELA ROCHA', 'HENRIQUE ALVES', 'ISABELA MARTINS', 'JOÃO PEREIRA'];

async function main() {
  await db.$transaction(async (tx) => {
    const plans = await tx.workoutPlan.findMany({ where: { OR: [{ clientId: { not: null } }, { sheet: { clientId: { not: null } } }] }, select: { id: true } });
    await tx.workoutExercise.deleteMany({ where: { workoutPlanId: { in: plans.map((p) => p.id) } } });
    await tx.workoutPlan.deleteMany({ where: { id: { in: plans.map((p) => p.id) } } });
    await tx.workoutSheet.deleteMany({ where: { clientId: { not: null } } });
    await tx.appointment.deleteMany({ where: { OR: [{ clientId: { not: null } }, { sourceAssessmentId: { not: null } }] } });
    await tx.assessmentCorrection.deleteMany({});
    await tx.assessmentMeasurement.deleteMany({});
    await tx.assessment.deleteMany({});
    await tx.clientPhoto.deleteMany({});
    await tx.client.deleteMany({});
    const types = [];
    for (const name of ['Cintura', 'Quadril', 'Braço', 'Coxa']) {
      types.push(await tx.measurementType.upsert({ where: { nameKey: name.toLocaleLowerCase('pt-BR') }, update: { active: true, unit: 'cm' }, create: { name, nameKey: name.toLocaleLowerCase('pt-BR'), unit: 'cm' } }));
    }
    for (const [i, name] of names.entries()) {
      const client = await tx.client.create({ data: { name, age: 22 + i * 3, sex: i % 2 ? 'MALE' : 'FEMALE', heightCm: 158 + i * 3, goal: i % 3 === 1 ? 'Hipertrofia' : 'Emagrecimento', experienceLevel: i % 2 ? 'Intermediário' : 'Iniciante', email: `aluno${i + 1}@example.com`, phone: `1199000${String(i + 1).padStart(4, '0')}` } });
      const latestAge = i < 3 ? 95 + i * 10 : i * 2;
      const gain = i % 3 === 1;
      for (let visit = 0; visit < 2; visit++) {
        const assessedOn = day(-latestAge - (visit === 0 ? 45 : 0));
        await tx.assessment.create({ data: { clientId: client.id, assessedOn, weightKg: 66 + i * 3 + (visit ? (gain ? 1.8 : -2.5 - i * .2) : 0), heightCm: 158 + i * 3, nextAssessmentOn: visit ? day(90 - latestAge) : null, notes: 'Avaliação de demonstração.', measurements: { create: types.map((type, index) => ({ typeId: type.id, typeName: type.name, unit: type.unit, value: [78 + i * 2, 96 + i, 27 + i * .7, 49 + i][index] + (visit ? (gain ? .8 : -1.5 - index * .3) : 0) })) } } });
      }
      await tx.workoutSheet.create({ data: { clientId: client.id, title: gain ? 'Hipertrofia A/B' : 'Condicionamento A/B', isActive: true, blocks: { create: [{ clientId: client.id, title: 'Membros superiores', level: 'BASIC', position: 0 }, { clientId: client.id, title: 'Membros inferiores', level: 'BASIC', position: 1 }] } } });
    }
  }, { timeout: 30000 });
  console.log(`Clientes: ${await db.client.count()} · Avaliações: ${await db.assessment.count()} · Medidas: ${await db.assessmentMeasurement.count()}`);
}
main().catch(() => { console.error('Falha ao recriar clientes; transação revertida.'); process.exitCode = 1; }).finally(() => db.$disconnect());
