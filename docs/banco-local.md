# Banco local do Treinos

Configurado em 13/10/2026 com PostgreSQL 18 instalado em
`C:/Program Files/PostgreSQL/18`. A instalação existente na porta 5432 foi
preservada. O Treinos usa uma instância própria, somente em localhost:5433.

| Item | Configuração |
| --- | --- |
| Dados persistentes | `backend/.local-postgres/` |
| Banco da aplicação | `treinos` |
| Banco separado de testes | `treinos_test` |
| Usuário da aplicação | `personal`, sem privilégios de superusuário |
| Configuração da API e testes | `backend/.env` |
| Credenciais administrativas da instância | `backend/.env.local-postgres-admin` |
| Acesso inicial ao aplicativo | `backend/.env.initial-access` |

As senhas foram geradas aleatoriamente. Esses arquivos e os dados do banco
estão ignorados pelo Git. Não compartilhe os arquivos de credenciais.
A senha inicial foi removida do `.env` da API após o seed; o arquivo de acesso
inicial fica disponível para o primeiro login. O nome inicial é Personal e
o e-mail é `personal@treinos.local`.

## Acesso local sem login

Para este ambiente de desenvolvimento, o login foi dispensado apenas no
computador local. `backend/.env` usa `LOCAL_AUTH_BYPASS=true` e
`treinos/.env.local` usa `VITE_LOCAL_AUTH_BYPASS=true`. A API fica limitada
a `127.0.0.1`; não use esse modo em produção, numa rede compartilhada ou num
computador acessível a outras pessoas. Para voltar a exigir login, defina
ambas as opções como `false` e reinicie a API e o Vite. A opção do Vite fica
em `treinos/.env.development.local` e só se aplica ao servidor de desenvolvimento.

O acesso inicial com e-mail e senha continua disponível quando o modo local
está desligado: use `personal@treinos.local` e `INITIAL_PASSWORD` em
`backend/.env.initial-access`. O sistema exige trocar essa senha no primeiro
login. O seed não redefine senhas de usuários existentes.

## Iniciar nas próximas sessões

No PowerShell, a partir da raiz:

```powershell
cd backend
npm run db:start
npm run start:dev
```

Em outro terminal, a partir da raiz:

```powershell
cd treinos
npm run dev
```

A configuração não instala um serviço do Windows: o banco deve ser iniciado
novamente após reiniciar a máquina. `db:start` reconhece uma instância já
disponível. API já iniciada na porta 3000 não precisa de uma segunda execução.

Na pasta backend:

```powershell
npm run db:status
# Ao encerrar o uso da API:
npm run db:stop
```

Não remova `.local-postgres`: essa pasta contém os cadastros persistidos.
Os logs da instância ficam em `.local-postgres/server.log`.

## Verificação realizada

- Cliente Prisma gerado e schema validado.
- As duas migrations versionadas aplicadas ao banco `treinos`.
- Personal inicial criado com senha hash e troca obrigatória.
- Backend compilado.
- Duas suítes HTTP, 17 testes, passaram em PostgreSQL real no banco separado.
- Login/sessão/logout verificados na API iniciada na porta 3000.
- Proxy do Vite verificado: `/api/auth/me` chega à API e retorna 401 sem sessão.

Para repetir os testes HTTP, dentro de backend:

```powershell
npm run test:e2e
```

TEST_DATABASE_URL já está configurada em `.env`. A suíte utiliza schemas
aleatórios em `treinos_test`, sem apagar o banco da aplicação. Fotos usam
storage simulado nos testes: upload real ainda exige configurar S3. Em uso
normal PHOTO_STORAGE permanece disabled.
