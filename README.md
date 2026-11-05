# Treinos

Sistema de gestão de alunos, avaliações, agenda e fichas de treino.

## Estrutura

- `frontend/`: interface React/Vite, com dependências próprias.
- `backend/`: API NestJS, Prisma, PostgreSQL e migrations.
- `docs/`: instalação, arquitetura e regras dos fluxos.

As rotas e endpoints existentes foram preservados. O nome apresentado no sistema é aluno; identificadores internos `client` e URLs `/clients` e `/clientes` continuam compatíveis.

## Desenvolvimento

Use Node.js compatível com os requisitos dos pacotes. Instale cada aplicação:

```powershell
npm ci --prefix frontend
npm ci --prefix backend
```

Configure banco e variáveis conforme [banco-local.md](docs/banco-local.md) e [backend/README.md](backend/README.md). Para iniciar, use dois terminais na raiz:

```powershell
npm run dev:backend
```

```powershell
npm run dev:frontend
```

A interface abre em http://localhost:5173 e encaminha `/api` para a API local na porta 3000.

## Verificação

```powershell
npm test
npm run build
npm run typecheck --prefix backend
```

Os testes HTTP/PostgreSQL usam `npm run test:e2e --prefix backend` com `TEST_DATABASE_URL` configurada; criam e removem schemas próprios. Nunca use um usuário de produção para testes.

Veja [organização e responsabilidades](docs/organizacao-do-projeto.md), [teste das telas](frontend/scripts/README.md) e [separação dos commits](docs/plano-de-commits.md).
