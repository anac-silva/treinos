# Publicação na Vercel com Neon

Configuração: dois projetos Vercel no mesmo repositório, um para `backend/` e
outro para `frontend/`. O navegador acessa somente o domínio do front; `/api`
encaminha as chamadas ao backend. Isso mantém cookies de sessão no mesmo domínio.

## 1. Criar o banco no Neon

Crie um projeto e um banco de produção vazio. Guarde as duas connection strings:
pooled em `DATABASE_URL` e direta em `DIRECT_DATABASE_URL`. Preserve `sslmode=require`
e os demais parâmetros fornecidos pelo Neon. Não coloque essas URLs em variáveis
`VITE_`, commits, capturas de tela ou no chat.

Use um banco/branch separado para previews. Não conecte deploys de preview ao banco
de produção. Os scripts de demonstração não devem rodar nesse banco.

## 2. Preparar o acesso inicial e as tabelas

Configure as variáveis de `backend/.env.production.example` no ambiente da API.
Defina um e-mail próprio e uma senha inicial aleatória de pelo menos 12 caracteres.
Não substitua o `.env` local: ele continua sendo a configuração de desenvolvimento.

Em um terminal seguro com `DATABASE_URL`, `DIRECT_DATABASE_URL` e `ADMIN_*`
apontando para o Neon, execute na pasta `backend`:

```powershell
npm ci
npm run prisma:generate
npm run migrate:deploy
npm run seed
```

O seed cria apenas o personal, sem clientes de exemplo. No primeiro login, a troca
da senha inicial é obrigatória. Remova `ADMIN_INITIAL_PASSWORD` depois do seed.
Não execute `reset-demo-clients.ts` nem os seeds de demonstração em produção.

## 3. Publicar a API

Importe o repositório na Vercel com Root Directory `backend`, detecção NestJS e
Node 24.x. `backend/vercel.json` gera o Prisma Client e compila o backend.
Não use `start:dev`, que inicia o PostgreSQL do Windows.

Defina `NODE_ENV=production`, `LOCAL_AUTH_BYPASS=false`, `PHOTO_STORAGE=disabled`,
`DATABASE_URL`, `DIRECT_DATABASE_URL`, `SESSION_TTL_HOURS=12`, `TRUST_PROXY=false`
e `CORS_ORIGINS` com a origem HTTPS exata do front. A variável de sistema
`VERCEL=1` permite confiar somente no primeiro salto do proxy da plataforma.

As migrations são aplicadas como etapa explícita de release antes do deploy da API;
não rodam automaticamente a cada build/preview.

## 4. Publicar o front

Depois de conhecer a URL estável da API, execute na raiz:

```powershell
node scripts/configure-hosting.mjs https://SUA-API.vercel.app
```

Isso gera `frontend/vercel.json` com proxy `/api`, fallback das rotas React e
headers de segurança. Revise e versionne o arquivo gerado.
Importe um segundo projeto com Root Directory `frontend` e framework Vite.
O arquivo `.env.production` exige login e oculta fotos. Não defina uma URL direta
da API em `VITE_API_URL`: preserve `/api`. Cadastre a URL final do front em
`CORS_ORIGINS` na API e faça novo deploy dela.

Os domínios Vercel são servidos por HTTPS. Para domínio próprio, configure-o no
projeto do front, aguarde o certificado e atualize `CORS_ORIGINS`.

## 5. Conferência no ambiente publicado

- Acesso sem sessão a `/api/clients` deve retornar 401.
- `/api/auth/local` deve retornar 403, inclusive acessado diretamente na API.
- Login incorreto repetido deve retornar 429. Os contadores são compartilhados
  no PostgreSQL, inclusive entre instâncias da API.
- A primeira senha exige troca; o novo login deve funcionar após recarregar.
- Cookies usam `__Host-`, `Secure`, `HttpOnly` e `SameSite=Lax`.
- Alterações sem token CSRF e requisições de origem não autorizada devem retornar 403.
- Verifique salvar/editar/excluir aluno, avaliações e exportação PDF no navegador.
- Fotos devem permanecer ocultas e `PHOTO_STORAGE` desativado.
- Configure recuperação/backups no provedor do banco antes de cadastrar dados reais.

A preparação local não cria contas, banco externo, certificado próprio ou deploy.
Essas etapas dependem da conexão às contas Neon e Vercel e das URLs reais.

Referências: [NestJS na Vercel](https://vercel.com/docs/frameworks/backend/nestjs),
[proxy por rewrites](https://vercel.com/docs/routing/rewrites),
[Prisma com Neon](https://neon.com/docs/guides/prisma).
