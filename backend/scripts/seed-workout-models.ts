import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

if (process.env.NODE_ENV === 'production' || !['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname)) throw new Error('Use somente no banco local.');
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const models = [
  { title: 'Feminino', blocks: [
    ['Superiores', ['PUXADA FRONTAL', 'REMADA BAIXA', 'DESENVOLVIMENTO COM HALTERES']],
    ['Quadríceps', ['AGACHAMENTO', 'LEG PRESS', 'CADEIRA EXTENSORA']],
    ['Superiores', ['SUPINO COM HALTERES', 'ELEVAÇÃO LATERAL', 'TRÍCEPS NA POLIA']],
    ['Posterior', ['STIFF', 'MESA FLEXORA', 'CADEIRA FLEXORA']],
    ['Glúteo', ['ELEVAÇÃO PÉLVICA', 'CADEIRA ABDUTORA', 'GLÚTEO NA POLIA']],
  ] },
  { title: 'Masculino', blocks: [
    ['Peito + ombro + bíceps', ['SUPINO RETO', 'DESENVOLVIMENTO COM HALTERES', 'ROSCA DIRETA']],
    ['Costas + tríceps', ['PUXADA FRONTAL', 'REMADA BAIXA', 'TRÍCEPS NA POLIA']],
    ['Ombros', ['DESENVOLVIMENTO COM HALTERES', 'ELEVAÇÃO LATERAL', 'CRUCIFIXO INVERSO']],
    ['Quadríceps', ['AGACHAMENTO', 'LEG PRESS', 'CADEIRA EXTENSORA']],
    ['Posteriores', ['STIFF', 'MESA FLEXORA', 'CADEIRA FLEXORA']],
  ] },
] as const;

async function main() {
  await db.$transaction(async (tx) => {
    for (const model of models) {
      if (await tx.workoutSheet.findFirst({ where: { clientId: null, title: model.title } })) { console.log(`Modelo ${model.title} já existe; preservado.`); continue; }
      const blocks = [];
      for (const [index, [title, names]] of model.blocks.entries()) {
        const exercises = [];
        for (const [position, name] of names.entries()) {
          const exercise = await tx.exercise.upsert({ where: { nameKey: name.normalize('NFKC').toLocaleLowerCase('pt-BR') }, update: {}, create: { name, nameKey: name.normalize('NFKC').toLocaleLowerCase('pt-BR') } });
          exercises.push({ exerciseId: exercise.id, position, sets: 3, repetitions: '10–12', restSeconds: 60 });
        }
        const block = { title, level: 'BASIC' as const, focus: title, position: index, exercises: { create: exercises } };
        blocks.push(block);
        // Standalone blocks are also available in “Adicionar modelo de bloco”.
        await tx.workoutPlan.create({ data: { ...block, title: `${model.title} — ${title}${model.title === 'Feminino' && index === 2 ? ' B' : ''}` } });
      }
      await tx.workoutSheet.create({ data: { title: model.title, notes: 'Modelo de referência. Ajuste a prescrição para cada aluno.', blocks: { create: blocks } } });
      console.log(`${model.title}: 5 blocos, 15 exercícios.`);
    }
  }, { timeout: 30000 });
}
main().catch(() => { console.error('Falha ao criar modelos; transação revertida.'); process.exitCode = 1; }).finally(() => db.$disconnect());
