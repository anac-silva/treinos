# Como executar e testar o Treinos

> Atualização: as telas agora estão conectadas à API para autenticação,
> clientes, medições, avaliações, histórico, correções, evolução e fotos.
> O diagnóstico e a tabela abaixo registram o estado anterior à integração.
> Para execução e teste do estado atual, use o [README do front](../treinos/README.md).
> O banco local agora está configurado; consulte [o guia](banco-local.md).
> Agendamentos agora têm API e persistência; exercícios e prescrição de treinos
> ainda não têm módulo no servidor.

Diagnóstico em 13/10/2026: PostgreSQL ouvindo na porta 5432; sem
`backend/.env`. Front e API não estavam ouvindo nas portas padrão antes da
verificação. Build/lint do front e build/typecheck/lint do backend passaram;
os 6 testes unitários do backend passaram. Testes HTTP com banco real não
foram executados nesta verificação, pois não há conexão de teste configurada.

## Interface

Na raiz do repositório:

```powershell
cd treinos
npm run dev
```

Abra a URL informada pelo Vite, normalmente http://localhost:5173.

| Tela / caminho | Como testar | Resultado atual |
| --- | --- | --- |
| Início `/` | Abrir e seguir o link da agenda | Conteúdo demonstrativo, sem totais reais |
| Clientes `/clientes` | Abrir a lista e clicar em Novo cliente | Lista fixa; busca/filtros/paginação sem implementação |
| Novo cliente `/clientes/novocliente` | Preencher campos | Salvar, cancelar e adicionar foto sem implementação |
| Configurações `/configuracoes` | Cadastrar exercício e medição com unidade; pesquisar; recarregar | Catálogos persistem no localStorage deste navegador; duplicados são rejeitados |
| Nova avaliação `/clientes/novaavaliacao` | Conferir a medição cadastrada e selecionar exercícios | Campos/seleção demonstrativos; Salvar medidas não grava avaliação |
| Medidas `/clientes/medidas` | Conferir catálogo e preencher valores | Valores não são persistidos |
| Treinos `/clientes/treinos` | Adicionar/remover exercícios e alterar prescrição | Rascunho em memória; não salva treino do cliente |
| Visão geral `/clientes/visaogeral` | Abrir e navegar pelas abas | Perfil e evolução ilustrativos |
| Agenda `/agendamentos` | Abrir Novo agendamento; fechar por botão ou Escape | Modal funciona; Salvar não cria agendamento |

O front não contém chamadas fetch/axios à API nem telas de login/troca de
senha. Os cadastros locais não são sincronizados com o banco. Agenda, treinos,
exercícios e PDF ainda não têm módulos correspondentes no backend.

## Banco e API

PostgreSQL já está ouvindo na porta 5432. Isso não confirma a existência do
banco do projeto, usuário, senha ou migrations. Docker e psql não foram
encontrados no PATH; não inicie outro banco na mesma porta.

Na raiz, em outro terminal:

```powershell
cd backend
Copy-Item .env.example .env
```

Edite `.env`: configure DATABASE_URL com usuário, senha e um banco dedicado
existente; CORS_ORIGINS=http://localhost:5173; ADMIN_NAME, ADMIN_EMAIL e
ADMIN_INITIAL_PASSWORD (12 a 128 caracteres). Não use CHANGE_ME como senha.
Se abrir o front por 127.0.0.1, inclua também essa origem em CORS_ORIGINS,
separada por vírgula. Não versione o arquivo real.

Após criar o banco dedicado e preencher os dados:

```powershell
npm run prisma:generate
npm run prisma:validate
npm run migrate:deploy
npm run seed
npm run start:dev
```

O seed cria o único personal e exige troca da senha inicial. Reexecutá-lo
não redefine a senha de uma conta existente. Remova ADMIN_INITIAL_PASSWORD
do ambiente após o primeiro seed.

Teste a API em um cliente HTTP com cookies habilitados:

1. POST http://localhost:3000/auth/login com email e password do seed.
2. Guarde o csrfToken da resposta e envie X-CSRF-Token nas mutações seguintes.
3. POST /auth/change-password com currentPassword e newPassword; use o novo csrfToken.
4. GET /auth/me para conferir a sessão.
5. POST /clients com { "name": "Cliente de teste" }; guarde o id retornado.
6. GET /clients e GET /clients/:id para conferir o cadastro.
7. POST /measurement-types com { "name": "Cintura", "unit": "cm" }.
8. POST /clients/:id/assessments com assessedOn (YYYY-MM-DD), weightKg e,
   opcionalmente, measurements com typeId do catálogo e value numérico.
9. Consulte o histórico e a evolução; teste correções com motivo/versão.
10. POST /auth/logout e confirme que GET /auth/me passa a retornar 401.

Essas operações criam dados: use um banco de desenvolvimento. Contratos e
exemplos completos: [clientes, avaliações e fotos](../backend/docs/clientes-avaliacoes-fotos.md).
Fotos exigem bucket privado S3 e PHOTO_STORAGE=s3; com disabled, os outros
módulos podem funcionar, mas o armazenamento de fotos fica desabilitado.

## Verificações automatizadas

Front, dentro de `treinos/`:

```powershell
npm run build
npm run lint
```

Backend, dentro de `backend/`:

```powershell
npm run build
npm run typecheck
npm run lint
npm test
$env:TEST_DATABASE_URL = 'postgresql://USUARIO:SENHA@localhost:5432/BANCO_DE_TESTE'
npm run test:e2e
```

Não copie os placeholders literalmente. A suíte HTTP exige banco destinado
a testes e permissões para criar/remover schemas: cria um schema aleatório,
aplica migrations e remove esse schema ao concluir. Não usa DATABASE_URL
como fallback. Sem esses testes, os módulos de banco estão implementados,
mas seu funcionamento neste ambiente ainda não está verificado.
