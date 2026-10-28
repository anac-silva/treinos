# API do personal trainer

> Banco local configurado: instância exclusiva em localhost:5433, banco
> `treinos` e banco de testes `treinos_test`. Migrations e seed aplicados;
> 17 testes HTTP com PostgreSQL real passaram. Consulte
> [banco local](../docs/banco-local.md) para iniciar e acessar o sistema.

> Atualização de integração: o front agora usa esta API para sessão,
> clientes, catálogo de medições, avaliações, correções, evolução e fotos.
> A configuração local está descrita no guia de banco acima.
> Veja [o README do front](../treinos/README.md) para executar e testar as telas.
> As observações antigas abaixo sobre ausência de integração descrevem a fase
> anterior. Os contratos HTTP continuam sem prefixo `/api`; o Vite faz o proxy.

Monólito modular em NestJS 11, TypeScript e Prisma 7 com PostgreSQL. Implementa
autenticação, clientes, avaliações, medições e fotos; não modifica o front.
Não há cadastro público, contas de clientes ou endpoint de criação de usuários.

## Estrutura

```text
src/modules/auth/        DTOs, controller, serviço, guards e hashing
src/modules/users/       Consulta do personal e projeção pública
src/modules/clients/     Cadastro, edição, busca e status dos clientes
src/modules/assessments/ Avaliações, correções auditadas e evolução de peso
src/modules/measurements/ Catálogo de tipos/unidades e evolução corporal
src/modules/photos/      Validação de imagens e adaptador de object storage
src/shared/database/    PrismaService e ciclo de conexão
src/shared/             Configuração, logs HTTP e tratamento de erros
prisma/                 Schema, migrations e seed
test/                   Testes HTTP contra PostgreSQL real
```

Controllers cuidam de HTTP; AuthService concentra os casos de uso de sessão.
UsersService e PrismaService isolam o acesso ao banco. Novos domínios podem
introduzir repositórios conforme necessário, sem criar microserviços.

## Instalação e banco

Requer Node >= 22.12 e PostgreSQL 17+ (local ou Docker Compose).
No PowerShell, a partir da raiz do repositório:

```powershell
cd backend
npm ci
Copy-Item .env.example .env
```

Edite `.env` antes de iniciar:

- Defina POSTGRES_USER, POSTGRES_DB e uma senha própria em POSTGRES_PASSWORD.
- Ajuste DATABASE_URL com os mesmos dados. Faça URL-encode de caracteres
  especiais da senha. `CHANGE_ME` é um placeholder, não uma credencial utilizável.
- Defina ADMIN_NAME, ADMIN_EMAIL e ADMIN_INITIAL_PASSWORD. A senha inicial deve
  ter de 12 a 128 caracteres e não ser composta apenas por espaços.
- CORS_ORIGINS é a lista separada por vírgula das origens exatas do front, sem
  barra final. Em desenvolvimento, normalmente `http://localhost:5173`.
- SESSION_TTL_HOURS define expiração absoluta, entre 1 e 168 horas (padrão 12).

Nunca versione `.env` nem envie senhas em código. Os arquivos de ambiente reais
estão ignorados pelo Git. Variáveis fornecidas pelo processo também são aceitas.

Para um banco novo com Docker:

```powershell
docker compose up -d postgres
docker compose ps
npm run prisma:generate
npm run prisma:validate
npm run migrate:deploy
npm run seed
npm run start:dev
```

Se PostgreSQL já estiver instalado, crie um banco dedicado e configure
DATABASE_URL para ele; os comandos Prisma são os mesmos. Não execute Compose
na porta 5432 se outro serviço já a ocupar: ajuste o mapeamento e DATABASE_URL.

`migrate:deploy` aplica a migration versionada. Para futuras alterações do
schema em desenvolvimento: `npm run migrate:dev -- --name nome_da_alteracao`;
revise o SQL e gere novamente o cliente. Não use db push ou migrate reset em produção.

O seed cria exclusivamente o primeiro User. Reexecutar não altera nome, email,
senha ou flag de troca de um usuário existente. A coluna singleton, sua chave
única e um CHECK SQL impedem um segundo personal, inclusive fora da aplicação.
Após o primeiro seed, remova ADMIN_INITIAL_PASSWORD do ambiente de execução.

Para executar a compilação:

```powershell
npm run build
npm start
```

A API escuta na PORT configurada (padrão 3000). Endpoints nesta fase ficam na
raiz, como `/auth/login`, conforme o pedido; ainda não há integração ou proxy
`/api` no front.
Em desenvolvimento local, `LOCAL_AUTH_BYPASS=true` habilita acesso sem senha
e limita a API a `127.0.0.1`; mantenha esse modo desligado em produção e em
qualquer ambiente acessível por outras pessoas.

## Contrato de autenticação

| Endpoint | Método | Corpo / resultado |
| --- | --- | --- |
| `/auth/login` | POST | `{ "email": "...", "password": "..." }`; retorna user e csrfToken, cria cookie |
| `/auth/me` | GET | Retorna user e csrfToken da sessão atual, inclusive após recarregar o front |
| `/auth/change-password` | POST | `{ "currentPassword": "...", "newPassword": "..." }`; retorna user/csrfToken e rotaciona cookie |
| `/auth/logout` | POST | Sem corpo; revoga sessão e remove cookie; resposta 204 |

Nas mutações autenticadas, envie `X-CSRF-Token` com o valor obtido em login,
me ou troca de senha. O cookie é enviado pelo navegador com `credentials: include`.
O front nunca precisa ler o cookie HttpOnly, nem guardar credenciais/tokens
de autenticação no localStorage. A senha nova precisa ser diferente da atual.

Enquanto mustChangePassword=true, somente me, change-password e logout são
liberados para a sessão. Novos endpoints são protegidos automaticamente pelo
guard global, sem precisar lembrar de adicioná-lo a cada controller. A anotação
Public deve ser reservada a endpoints intencionalmente públicos.

Um novo login revoga sessões anteriores do personal. A troca de senha também
revoga todas as sessões e emite uma nova. Sessões expiradas, revogadas ou de
usuário inativo retornam 401. A flag da senha inicial bloqueia operações com
403 e código PASSWORD_CHANGE_REQUIRED.

Senhas usam scrypt com salt aleatório de 16 bytes, N=32768, r=8, p=3, chave de
64 bytes e comparação constante. Nunca são armazenadas em texto puro. Token
de sessão: 32 bytes aleatórios, armazenado somente como SHA-256 no banco.
CSRF é derivado da sessão por HMAC; somente seu hash fica persistido.

Login e troca de senha: 5 tentativas por IP/minuto. Demais endpoints: limite
global de 120 requisições por IP/minuto. O contador do Throttler é em memória
e reinicia junto do processo; esta fundação assume uma instância do monólito.
Antes de escalar horizontalmente, substituir o storage do limiter por armazenamento
compartilhado. Sessões já são persistidas no PostgreSQL.

DTOs rejeitam campos extras; corpos JSON são limitados a 16 KB. Erros retornam
`{ "error": { "code": "...", "message": "...", "requestId": "..." } }`.
Há headers Helmet, Cache-Control: no-store, ID de requisição e logs de método,
rota, status e duração. Não são registrados corpos, senhas, cookies ou tokens.

## Produção

Use NODE_ENV=production e um proxy HTTPS. O cookie passa a usar Secure,
HttpOnly, SameSite=Lax, Path=/ e prefixo `__Host-`, sem Domain. CORS_ORIGINS
aceita somente HTTPS em produção. Use front/API no mesmo site para funcionar
com SameSite=Lax; essa configuração não atende front e API em sites distintos.

TRUST_PROXY permanece false por padrão. Se TLS termina no proxy, configure
somente seus IPs/sub-redes confiáveis (por exemplo `loopback` quando o proxy
está na mesma máquina). A API rejeita HTTP em produção. O proxy deve sobrescrever
X-Forwarded-For e X-Forwarded-Proto; não exponha a porta da API diretamente.
Não configure TRUST_PROXY=true nem confie em cabeçalhos enviados por qualquer cliente.

Configure TLS validado também para PostgreSQL remoto, banco com usuário de
privilégios mínimos, backup e retenção operacional. Execute migrations antes
de iniciar a nova versão. Sessões expiradas permanecem para limpeza posterior;
podem ser removidas periodicamente após expiração/revogação conforme retenção
definida, sem afetar dados de negócio.

## Validação e testes

```powershell
npm run build
npm run typecheck
npm run lint
npm test
$env:TEST_DATABASE_URL = 'postgresql://USUARIO:SENHA@localhost:5432/BANCO_DE_TESTE'
npm run test:e2e
```

Use PostgreSQL destinado a testes. A suíte cria um schema aleatório próprio,
aplica migrations, testa as rotas e remove somente esse schema ao concluir.
Ela não limpa nem redefine o banco inteiro. O usuário de teste precisa poder
criar/remover schemas; essas permissões não são necessárias ao usuário da API
em produção. TEST_DATABASE_URL é obrigatório; não há fallback para o banco da aplicação.

Cobertura crítica: seed idempotente, senha hash, restrição de usuário único,
DTOs, origem, acesso anônimo, cookie/headers, troca obrigatória, CSRF, troca e
rotação de sessão, senha antiga inválida, logout, expiração, inatividade,
rate limit e Secure/HTTPS em produção. Senhas de teste são geradas aleatoriamente.

Referências da integração: [Prisma com NestJS](https://www.prisma.io/docs/guides/v7/frameworks/nestjs)
e [rate limiting do NestJS](https://docs.nestjs.com/security/rate-limiting).

## Verificação da fundação de autenticação — 06/10/2026

Build, tipagem, lint, 3 testes unitários e 7 testes HTTP passaram. As migrations
foram aplicadas em uma instância PostgreSQL 18 isolada e o Prisma migrate diff
não detectou divergências. Também foram verificados o seed pela CLI, sua
reexecução e o startup/login da API compilada. Build/lint do front passaram.
O Compose está documentado, mas não foi executado nesta máquina (Docker não disponível).

## Clientes, avaliações, medições e fotos

Os contratos, exemplos e regras desses módulos estão em
[docs/clientes-avaliacoes-fotos.md](docs/clientes-avaliacoes-fotos.md).
Após atualizar o projeto, execute `npm ci`, `npm run prisma:generate` e
`npm run migrate:deploy`. Os cadastros locais do front ainda não estão sincronizados
com esses endpoints. Para fotos, configure o bucket privado e PHOTO_STORAGE;
a configuração padrão disabled permite usar os demais módulos sem storage.
