# Evolução do sistema de gestão do personal

> Documento historico. Para a estrutura atual e as responsabilidades implementadas, consulte [organizacao-do-projeto.md](organizacao-do-projeto.md).

## Escopo e estado da etapa

Etapa 1: análise do projeto e definição da arquitetura. Este documento descreve
a implementação planejada; o back-end, a autenticação e a persistência ainda não
existem. A interface existente foi preservada integralmente.

O produto atende um único personal. Cliente é um registro de negócio, nunca um
usuário autenticável. Não haverá cadastro público, portal do aluno ou microserviços.

## Diagnóstico do repositório

- `treinos/`: aplicação React 19 com Vite, JavaScript/JSX, React Router,
  React Icons, CSS global e integração com Tailwind.
- `treinos/src/components/body.jsx`: layout e rotas existentes.
- `treinos/src/components/layout/sidebar.jsx`: navegação e identidade visual.
- `treinos/src/App.css`: estilos compartilhados, incluindo formulários,
  tabelas, perfis, modal e regras responsivas.
- `package.json` da raiz: dependências adicionais, incluindo o plugin Tailwind
  usado pelo Vite. Há dois manifests e dois lockfiles; evitar reorganização
  durante a implementação dos domínios.
- Não há API, banco, Prisma, autenticação, cliente HTTP ou persistência local.
- Não foram encontrados arquivos `AGENTS.md` no projeto.

| Tela | Estado observado | Integração necessária |
| --- | --- | --- |
| Início | Indicadores, datas e agenda fixos | Consultas reais e datas calculadas |
| Clientes | Lista fixa; busca, filtros, paginação e ações sem handlers | Listar, pesquisar e abrir cliente por ID |
| Novo cliente | Campos visuais; salvar fora do formulário e sem handler | Validar, cadastrar e enviar foto |
| Agendamentos | Lista e período fixos; modal abre e fecha | Selecionar cliente por ID, validar e persistir |
| Visão geral | Perfil, gráfico e métricas fixos | Perfil e evolução calculados a partir das avaliações |
| Medidas e nova avaliação | Componentes não registrados nas rotas; valores somente leitura | Formulário e histórico de avaliações |
| Treinos | Componente não registrado nas rotas; exercícios fixos | Biblioteca, criação de versões e PDF |

A rota `/agendamentos/novoagendamento` existe sem elemento. O modal atual pode
continuar sendo o fluxo de criação. A rota `/clientes/visaogeral` não identifica
o cliente: integrar detalhes em `/clientes/:id/...`, mantendo o layout e
atualizando os links. Não escolher arbitrariamente um cliente para a rota antiga.

O front pode estar avançado visualmente, mas os fluxos de negócio ainda precisam
de implementação. Build e lint não comprovam persistência ou funcionamento dessas ações.

## Arquitetura proposta

Adicionar `backend/` na raiz, mantendo `treinos/` como front. Back-end em
TypeScript com NestJS, Prisma e PostgreSQL, em um único processo de aplicação.

```text
backend/
  prisma/
    schema.prisma
    migrations/
    seed.ts
  src/
    modules/
      auth/
      clients/
      appointments/
      assessments/
      exercises/
      workouts/
      media/
    infrastructure/
      database/
      storage/
    common/
      errors/
      logging/
    app.module.ts
    main.ts
```

Dentro de cada módulo, separar apresentação (controllers e DTOs), aplicação
(casos de uso), domínio (regras) e infraestrutura (repositórios e adaptadores)
na medida da complexidade. Controllers validam e delegam; casos de uso não
dependem de HTTP. Prisma fica nos adaptadores. Criar interfaces nas fronteiras
que precisam de substituição ou isolamento, evitando abstrações sem necessidade.

API sob `/api`. Em produção, front e API preferencialmente na mesma origem,
com HTTPS no proxy e configuração explícita de proxies confiáveis. Em
desenvolvimento, usar o proxy do Vite para `/api`. Manter JSX e CSS existentes;
adicionar cliente HTTP compartilhado e serviços por domínio. Não converter
todo o front para TypeScript como pré-requisito.

## Modelo de dados e regras

| Entidade | Responsabilidade e invariantes |
| --- | --- |
| Trainer | Único usuário, email único, hash da senha e flag de troca obrigatória; impedir segundo usuário também no banco |
| Session | Hash do token aleatório, usuário, expiração e revogação; token original apenas no cookie |
| Client | Nome, idade informada, altura, contatos, objetivo, experiência, observações e status; sem senha |
| Assessment | Cliente, data da avaliação, peso, medidas e observações; nova avaliação sempre cria registro |
| Appointment | Cliente por chave estrangeira, início, assunto e status; horários persistidos com fuso |
| Exercise | Biblioteca reutilizável de exercícios |
| Workout | Cliente, versão, nome, objetivo, categoria e data; novo ciclo ou edição publicada cria nova versão |
| WorkoutExercise | Ordem, referência ao exercício, nome preservado, séries, repetições e descanso |
| ClientPhoto | Cliente, chave do objeto, MIME, tamanho e metadados; sem conteúdo binário no banco |

Usar UUIDs, timestamps, chaves estrangeiras e índices nas consultas por cliente
e data. Medidas e peso usam Decimal com unidades explícitas: kg, cm e altura
convertida de metros na fronteira do front. Repetições podem admitir faixas
conforme o formulário implementado, sem assumir que toda prescrição é um inteiro.

O formulário atual informa idade, não nascimento: preservar esse contrato;
não inventar uma data de nascimento. O peso inicial deve originar uma avaliação
no cadastro, na mesma transação, e não virar um campo sobrescrito no cliente.

Não apagar clientes em cascata com suas avaliações e treinos. Arquivar clientes
quando necessário. Ordenar avaliações pela data informada e critério de desempate
estável. Definir o treino atual por referência explícita; criar versão e atualizar
essa referência na mesma transação, com controle de concorrência e unicidade da versão.
Alterações na biblioteca não devem modificar o conteúdo de treinos já registrados.

Datas da avaliação são datas civis; horários da agenda são instantes com fuso.
A apresentação usa `America/Sao_Paulo`. Não inventar duração ou regras de choque
de horários sem requisito definido.

## Autenticação e segurança

- Seed lê email e senha inicial de variáveis de ambiente, gera hash Argon2id
  ou scrypt e cria o personal com troca obrigatória. Reexecução não redefine
  a senha existente. Não commitar segredos nem registrar credenciais nos logs.
- Não expor cadastro de usuário. Após login inicial, permitir somente consulta
  da sessão, troca de senha e logout até concluir a troca; impor isso na API.
- Sessão persistida no PostgreSQL. Cookie HttpOnly, Secure em produção,
  SameSite explícito, Path adequado, expiração e invalidação no logout.
  Rotacionar a sessão ao autenticar e ao trocar a senha; revogar sessões antigas.
- Proteger todas as rotas de negócio; não guardar tokens no localStorage.
- Aplicar rate limit no login, respostas genéricas para credenciais inválidas,
  validação global de DTOs e rejeição de campos inesperados.
- Proteger mutações contra CSRF com validação de origem e token de CSRF;
  configurar CORS apenas para origens autorizadas quando necessário.
- Tratar erros centralmente, com formato consistente e ID de requisição.
  Não retornar stack traces em produção. Logs estruturados sem senhas,
  cookies, tokens, fotos ou corpos com informações pessoais e avaliações.

Fotos ficam em bucket privado de object storage por adaptador configurável.
Autorizar uploads e leituras, gerar chaves no servidor e validar tipo real,
tamanho e vínculo com cliente antes de confirmar metadados. Usar URLs assinadas
curtas para leitura e tratar objetos órfãos em falhas. O provedor será configurado
na etapa de mídia, sem acoplar o domínio a um serviço específico.

PDF é gerado para uma versão específica do treino, autenticado, com conteúdo
obtido do banco. Não aceitar URLs arbitrárias para carregar imagens durante a
renderização. Disponibilizar download ao personal, sem criar acesso do cliente.

## Ordem de implementação e critérios de conclusão

1. **Fundação e autenticação:** criar projeto NestJS, configuração validada,
   Prisma, migration de usuário/sessão, seed, login, troca obrigatória, logout,
   erros e logs. Adicionar telas de login e troca usando os estilos existentes.
   Validar que login inicial não libera endpoints de negócio e que logout revoga a sessão.
2. **Clientes:** cadastro/lista/detalhes e arquivamento; conectar os formulários
   existentes e adicionar estados de carregamento, erro e lista vazia.
   Validar cadastro com avaliação inicial atômica e consulta pelo ID correto.
3. **Agenda:** conectar lista, navegação de datas e modal; escolher cliente
   existente mantendo a aparência do campo. Validar criação, atualização e datas.
4. **Avaliações:** habilitar rotas e campos existentes, criar novos registros,
   consultar histórico e alimentar evolução. Validar que uma nova avaliação
   preserva as anteriores e que valores derivados têm dados de suporte.
5. **Exercícios e treinos:** biblioteca, composição, versões e treino atual.
   Validar preservação do histórico, snapshots e concorrência na publicação.
6. **Fotos e PDF:** object storage privado, upload/visualização e exportação
   da versão escolhida. Validar acesso autenticado, arquivos inválidos e falhas.
7. **Integração final:** substituir resumos fixos, validar fluxos ponta a ponta
   e documentar execução, backup, migrations e implantação com HTTPS.

Em cada etapa: build e lint dos projetos afetados, tipagem do back-end, validação
do schema Prisma e migrations em PostgreSQL, além dos fluxos principais do
domínio. Testes devem cobrir regras e falhas relevantes, especialmente autenticação,
preservação de histórico e transações. Não declarar migration validada apenas
porque o schema compila; executar contra banco de teste.

## Validação da análise — 06/10/2026

- `npm run build` em `treinos/`: passou.
- `npm run lint` em `treinos/`: passou.
- Tipagem: não há script ou configuração TypeScript no projeto atual.
- Migrations: não há schema, migrations ou banco configurado.
- Fluxos: inspeção estática das rotas e handlers; sem teste de navegador nesta etapa.

Nenhum arquivo de aplicação ou dependência foi alterado nesta etapa.
