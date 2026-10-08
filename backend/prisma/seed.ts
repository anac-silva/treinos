import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { hashPassword } from '../src/modules/auth/password';
import { isEmail } from 'class-validator';

export async function seedAdmin(database: PrismaClient, env: NodeJS.ProcessEnv = process.env) {
  const name = env.ADMIN_NAME?.trim();
  const email = env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = env.ADMIN_INITIAL_PASSWORD;
  if (!name || name.length > 100 || !email || email.length > 254 || !isEmail(email) || !password || password.length < 12 || password.length > 128 || password.trim().length < 12) {
    throw new Error('Configure ADMIN_NAME, ADMIN_EMAIL e ADMIN_INITIAL_PASSWORD (12–128 caracteres).');
  }
  const existing = await database.user.findUnique({ where: { singleton: 1 } });
  if (existing) return { created: false, id: existing.id };
  const passwordHash = await hashPassword(password);
  // A constraint singleton impede criação duplicada mesmo com seeds concorrentes.
  const user = await database.user.upsert({ where: { singleton: 1 }, update: {},
    create: { name, email, passwordHash, mustChangePassword: true, active: true } });
  return { created: true, id: user.id };
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('Configure DATABASE_URL.');
  const database = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }, { schema: new URL(process.env.DATABASE_URL).searchParams.get('schema') || 'public' }) });
  try {
    const result = await seedAdmin(database);
    console.log(result.created ? 'Personal inicial criado; troca de senha obrigatória.' : 'Personal já existe; credenciais preservadas.');
  } finally { await database.$disconnect(); }
}
if (require.main === module) main().catch(() => { console.error('Seed falhou. Verifique as variáveis ADMIN_* e a conexão PostgreSQL.'); process.exitCode = 1; });
