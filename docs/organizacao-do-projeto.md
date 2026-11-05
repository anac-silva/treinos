# Organização e responsabilidades

## Escolha de arquitetura

O sistema continua um monólito modular: frontend React e API NestJS com PostgreSQL. Não há necessidade de microserviços, CQRS ou repositories genéricos. A separação segue as responsabilidades que mudam por motivos distintos.

## Frontend

- `src/app/routes.jsx`: rotas e limites de autenticação.
- `src/pages/`: páginas organizadas por funcionalidade. As áreas de agenda e treinos têm componentes locais, sem expor detalhes de implementação às outras páginas.
- `src/components/`: UI reutilizada entre funcionalidades, incluindo paginação e ciclo de vida dos diálogos.
- `src/contexts/`: sessão e catálogos compartilhados. Carregar um provider não importa nem grava dados legados.
- `src/lib/api.js`: transporte HTTP, CSRF, erros, tentativas limitadas e paginação de coleções delimitadas.
- `src/lib/useAsyncResource.js`: ciclo de vida de consultas. Cada resultado pertence à sua requisição; trocar o recurso ou a revisão oculta o resultado anterior e cancela a leitura antiga.
- `src/lib/useRemote.js`: consulta de um recurso ou página; `useCollection.js`: coleção completa apenas quando necessária, como catálogo ou mês da agenda.
- `src/lib/businessDate.js`: datas e horas de São Paulo. A entrada do formulário e sua exibição usam o mesmo fuso, independentemente do dispositivo.

Agenda: formulário, confirmação de cancelamento, diálogo do dia e calendário estão separados. Erros de confirmação são apresentados no diálogo do dia.

Treinos: edição de bloco, edição de ficha, seleção de modelo, visualização e coordenação das páginas ficam em arquivos próprios. `useWorkoutLibrary` carrega a ficha atual e resumos paginados apenas do aluno selecionado. O seletor de cópia consulta outras fichas somente quando aberto e carrega seus blocos após a seleção. O histórico de avaliações é paginado por dia no servidor, sem separar registros da mesma data.

## Estilos

- `App.css`: tokens visuais e componentes básicos, incluindo controles de formulário.
- `layout.css`: estrutura, espaçamento compartilhado e composição das páginas. Não redefine os controles básicos.
- CSS de funcionalidades: comportamento específico da tela. `appointments.css` é carregado após o layout para dar ao calendário a responsabilidade sobre sua área disponível.

Evite acrescentar sobrescritas genéricas em arquivos de páginas. Regras específicas devem usar classes da funcionalidade. Os nomes dos alunos são exibidos em maiúsculas; textos, títulos e motivos não recebem essa transformação global.

## Backend

- Controller: traduz HTTP para uma operação da aplicação.
- DTO: valida e normaliza a entrada.
- Service: executa a operação e coordena regras e transações.
- Prisma: persistência, relacionamentos e consultas.
- Banco: restrições estruturais e de unicidade, inclusive ficha atual por aluno.

`NextAssessmentAppointmentService` cuida somente da previsão da próxima avaliação. Recebe a transação da avaliação, preservando atomicidade e alterações manuais já confirmadas ou canceladas na agenda.

`ObjectStorage` continua como interface para armazenamento de fotos porque existem implementações reais diferentes. Novas interfaces devem representar uma variação concreta ou um limite útil, não apenas duplicar métodos do Prisma.

## Contratos de consulta

- `GET /workout-sheets?view=summary`: metadados e `_count.blocks`, sem exercícios.
- Filtros `clientId`, `isActive`, `templatesOnly`, `q`, `page` e `pageSize` limitam a consulta. A busca considera título e nome do aluno.
- `GET /workout-sheets/:id`: ficha completa para visualizar, copiar ou ajustar.
- `GET /clients/:clientId/assessments/days`: páginas de dias completos com suas avaliações; `total` conta dias, não registros.
- As respostas anteriores continuam disponíveis: o modo padrão de fichas ainda é completo e a listagem original de avaliações foi mantida.

## Migração de dados do navegador

Configurações oferece a importação explícita de exercícios antigos quando há dados locais. A operação normaliza nomes, ignora registros existentes e pode ser repetida sem duplicar os cadastros. Os dados locais não são apagados automaticamente.

## Mudanças futuras

Preserve contratos existentes, restrições e histórico. Extraia regras compartilhadas quando houver uso real. Faça consultas filtradas e paginadas para dados que crescem continuamente; carregue detalhes sob demanda. Valide mudanças com testes de comportamento, incluindo falhas, concorrência e navegação entre recursos.

## Validação desta reorganização

- Instalação limpa do frontend com `npm ci`, usando seu próprio manifest e lockfile.
- Build do frontend e do backend, TypeScript e lint dos dois pacotes aprovados.
- 23 testes de frontend, 10 unitários de backend e 30 de integração HTTP/PostgreSQL aprovados.
- Verificações reais no Chrome com APIs simuladas: montagem/cópia de fichas, isolamento de consultas, respostas antigas, erros, horários em outro fuso e calendário com quatro, cinco e seis semanas em três tamanhos de tela.
- Migrations verificadas pelos testes em schemas temporários; nenhum dado de aluno foi usado pelos testes de interface.
- Dependências instaladas deixam de ser versionadas; os arquivos no disco são preservados. A mudança de pasta é registrada separadamente das mudanças de código.
