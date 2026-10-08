# Inventário técnico do front-end para integração

Análise de 06/10/2026. Escopo: arquivos de aplicação, rotas, estilos, assets,
manifests e configuração do front existente. Dependências instaladas e saída
gerada em `dist/` não são código de aplicação a integrar. Nenhum código do front
foi alterado nesta fase. Endpoints deste documento são propostas, ainda não implementadas.

**Atualização posterior à análise:** foi implementada a tela `/configuracoes`,
com cadastro e busca de exercícios e de definições de medição (nome/unidade).
Os catálogos são compartilhados por contexto e persistidos no localStorage,
sem API nesta etapa. As rotas `/clientes/medidas`, `/clientes/novaavaliacao` e
`/clientes/treinos` agora disponibilizam os componentes de demonstração;
exercícios podem ser selecionados na avaliação e no treino, e os campos de
medição refletem o catálogo. A navegação de configurações funciona também no
mobile. O diagnóstico abaixo descreve o estado anterior a essa implementação.
O back-end deverá adicionar cadastro/listagem de definições de medição, com
ID e unidade preservados como snapshot nas futuras avaliações; esse catálogo
é distinto dos valores históricos consultados em measurements.

**Fundação do back-end implementada:** `backend/` agora contém NestJS,
TypeScript, Prisma/PostgreSQL, migrations, seed do personal e autenticação
por sessão. Endpoints efetivos desta fase: POST `/auth/login`, POST `/auth/logout`,
GET `/auth/me` e POST `/auth/change-password`. A integração do front ainda
não foi realizada; os endpoints com prefixo `/api` da matriz continuam propostas.
Veja `backend/README.md` para execução, segurança e validação.

**Módulos de domínio implementados:** clients, assessments, measurements e
photos estão disponíveis no back-end. O catálogo usa `/measurement-types`;
correções de avaliações usam POST `.../corrections` com motivo e versão.
Upload de foto usa POST multipart `/clients/:clientId/photo`, com validação
no servidor e object storage, em vez do fluxo de upload direto proposto abaixo.
Contratos efetivos: `backend/docs/clientes-avaliacoes-fotos.md`. As telas e
os catálogos locais continuam aguardando integração com esses endpoints.

## 1. Estrutura e execução

| Arquivo/local | Responsabilidade |
| --- | --- |
| `treinos/index.html` | Documento pt-BR, root, título `treinos`, favicon e entrada JS |
| `treinos/src/main.jsx` | React StrictMode, BrowserRouter e CSS base |
| `treinos/src/App.jsx` | Importa App.css e renderiza Body |
| `treinos/src/components/body.jsx` | Layout com Sidebar e definição das rotas |
| `treinos/src/components/layout/sidebar.jsx` | Único componente visual compartilhado explícito, além do layout |
| `treinos/src/pages/` | Oito componentes de página em JSX |
| `treinos/src/App.css` | Tokens CSS, identidade visual e estilos de todas as telas |
| `treinos/src/index.css` | Import Tailwind e tokens @theme; token `--color-` sem nome descritivo |
| `treinos/vite.config.js` | Plugins React e Tailwind; sem proxy de API |
| `treinos/eslint.config.js` | Regras JS, hooks e refresh; ignora dist |
| `treinos/package.json` | React 19, Router 7, Icons; scripts dev/build/lint/preview |
| `package.json` na raiz | Tailwind, plugin Vite e Router; segundo lockfile |
| `treinos/README.md` | Texto do template, sem documentação dos fluxos reais |

Não há TypeScript no front, SDK de API, fetch/axios, contexto de autenticação,
gerenciador de dados remotos, storage local, testes ou configuração de migrations.
Manter React/JSX e os estilos. Não reorganizar os dois manifests nesta fase;
o plugin Tailwind usado pelo Vite é encontrado nas dependências da raiz.

Assets: `logo-removebg-preview.png` é usado na Sidebar; `favicon.ico` no HTML.
Não foram encontradas referências a `logo.png`, `public/icons.svg` ou
`public/favicon.svg` no código da aplicação. Fontes DM Sans são importadas de
Google Fonts no CSS, com fontes locais de fallback. Logos e ícones da identidade
visual não precisam de endpoint. Fotos de clientes ainda não existem na interface.

## 2. Rotas e telas

| Rota atual | Componente | Navegação e estado |
| --- | --- | --- |
| `/` | Home | Acesso pela Sidebar; link para agenda |
| `/clientes` | Clientes | Acesso pela Sidebar; link Novo cliente |
| `/clientes/novocliente` | NovoCliente | Link de volta para clientes |
| `/agendamentos` | Agendamentos | Sidebar e link do início; criação em modal |
| `/clientes/visaogeral` | VisaoGeralCliente | Renderiza cliente fixo; sem link de entrada nas listas |
| `/agendamentos/novoagendamento` | Nenhum | Rota declarada sem element, não renderiza conteúdo da página |
| Sem rota | MedidasCliente | Componente existente, não importado pelo roteador |
| Sem rota | NovaAvaliacao | Componente existente, não importado pelo roteador |
| Sem rota | TreinosCliente | Componente existente, não importado pelo roteador |

Não existem tela de login, troca de senha, histórico, biblioteca de exercícios,
configurações ou página 404. Sidebar aparece em todas as rotas atuais e não há
proteção de acesso. Configurações é um div sem navegação; nome Leonardo e avatar L
são fixos. As abas de perfil e de agenda são divs sem eventos ou links.

Rotas propostas para a integração, preservando os componentes:
`/login`, `/alterar-senha`, `/clientes/:clientId/visaogeral`,
`/clientes/:clientId/medidas`, `/clientes/:clientId/avaliacoes/nova`,
`/clientes/:clientId/treinos` e `/clientes/:clientId/historico`.
Biblioteca e configurações só receberão rotas quando seus fluxos mínimos forem
definidos. A rota antiga de visão geral não deve selecionar um cliente arbitrário.
A rota vazia de agendamento pode futuramente redirecionar para a agenda e seu modal.

## 3. Formulários e campos

### Novo cliente — novoCliente.jsx

Existe um form visual sem onSubmit. Campos sem name/id e sem estado; inputs
usam o tipo text padrão. Asteriscos indicam obrigatoriedade visual, mas não há
atributo required. Salvar e Cancelar ficam fora do form e não possuem handlers.

| Campo | Controle atual | Contrato de integração sugerido |
| --- | --- | --- |
| Nome completo * | input text vazio | `name`, texto obrigatório |
| Idade * | input text vazio | `age`, inteiro; não substituir por nascimento inventado |
| Peso (kg) * | input text vazio | `initialAssessment.weightKg`; registro histórico inicial |
| Altura (m) * | input text vazio | `heightCm`, conversão explícita de metros |
| E-mail | input text vazio | `email`, opcional; contato do cliente, não login |
| Telefone | input text vazio | `phone`, opcional, string |
| Objetivo principal * | select com opção vazia desabilitada | `goal`; Emagrecimento, Hipertrofia, Condicionamento |
| Nível de experiência | select com opção vazia desabilitada | `experienceLevel`; Iniciante, Intermediário, Avançado |
| Observações | textarea, 4 linhas | `notes`, opcional |
| Adicionar foto | div visual com ícone | Seletor de arquivo e fluxo de photos; não há input file |

O cadastro inicial deve gravar cliente e avaliação inicial em transação. A tela
não pede data dessa avaliação: usar data do cadastro como regra documentada,
sem acrescentar um campo obrigatório silenciosamente. Valores com vírgula
precisam de normalização validada; vazio não deve virar zero. Limites de tamanho
e intervalos numéricos serão compartilhados com o contrato da API.

### Novo agendamento — modal em agendamentos.jsx

Campos dentro de div, sem form, onSubmit, required, onChange ou valores controlados.
São editáveis pelo navegador; o conteúdo não é lido ao salvar.

| Campo | Controle / name atual | Contrato sugerido |
| --- | --- | --- |
| Nome do cliente | text / `cliente` | Busca de clientes e seleção de `clientId`, preservando apresentação |
| Data | date / `data` | Data civil usada para compor início |
| Horário | time / `horario` | Horário local em America/Sao_Paulo |
| Assunto | textarea / `assunto`, 3 linhas | `subject`, texto do atendimento |

Enviar `startsAt` com offset explícito, derivado da data e hora; não converter
uma data civil isolada via UTC. Não há campo de duração, recorrência ou término:
não adicioná-los ao contrato obrigatório. Status inicial e mudanças de status
precisam de regra única no back-end.

### Medidas e avaliação — medidasCliente.jsx / novaAvaliacao.jsx

Ambos apresentam praticamente o mesmo formulário visual, sem form. Data e
todos os inputs de medidas usam value/readOnly. Observações é um details com
texto fixo, não uma textarea. Os botões não salvam. Diferenças atuais: perfil,
abas, ícones e rótulos, não dois contratos de gravação distintos.

| Campo visível | Valor fixo | Chave sugerida / unidade |
| --- | --- | --- |
| Data da avaliação | 15/09/2026 | `assessedOn`, YYYY-MM-DD |
| Peso | 62,0 | `weightKg`, kg |
| Ombro | 110 | `shoulderCm`, cm |
| Peito | 95 | `chestCm`, cm |
| Cintura | 70 | `waistCm`, cm |
| Quadril | 98 | `hipCm`, cm |
| Braço direito / esquerdo | 32 / 32 | `rightArmCm` / `leftArmCm`, cm |
| Coxa direita / esquerda | 58 / 58 | `rightThighCm` / `leftThighCm`, cm |
| Panturrilha direita / esquerda | 36 / 35 | `rightCalfCm` / `leftCalfCm`, cm |
| Observações | Registro de avaliação física. | `notes`, texto opcional |

`assessments` representa o registro datado; `measurements` representa seus
valores e séries históricas. Salvar tudo em um POST de avaliação para garantir
atomicidade. Não criar escrita independente de medidas que possa sobrescrever
histórico. Não exigir todas as medidas para registrar o peso inicial.

### Montar treino — treinosCliente.jsx

Formulário visual em section/div, sem form, estado ou submissão. Não há botão
Salvar treino no componente. Novo treino, Editar e Duplicar não têm handlers.

| Campo | Estado atual | Contrato sugerido |
| --- | --- | --- |
| Nome do treino | Treino A - Inferiores, readOnly | `name` |
| Objetivo | select, única opção Hipertrofia | `goal` |
| Categoria | divs Superior, Inferior selecionado, Full body, Funcional | `category` |
| Exercício | nome fixo, strong | `exerciseId` e snapshot de nome na versão |
| Ordem | 1 a 4, span | `position` |
| Séries | input readOnly | `sets` |
| Repetições | input readOnly | `repetitions`, admitir prescrição textual/faixa se necessária |
| Descanso | input readOnly com sufixo s | `restSeconds`, normalização |

Adicionar/remover exercício modifica o rascunho local; não apaga exercício da
biblioteca. Publicar um ciclo, editar o treino atual ou duplicá-lo cria novo
Workout. As versões anteriores permanecem consultáveis.

## 4. Botões e ações

| Tela | Ações implementadas | Controles sem ação implementada |
| --- | --- | --- |
| Sidebar | NavLinks Início, Clientes, Agendamentos | Configurações; não há Logout |
| Home | Ver agenda completa navega | Cards não são controles |
| Clientes | Novo cliente navega | Busca, Filtros, menu de cada linha, anterior, página 1, próximo; nome não é link |
| NovoCliente | Voltar para Clientes navega | Adicionar foto, Cancelar, Salvar cliente |
| Agendamentos | Novo abre modal; X, Fechar e Escape fecham | Semana atual, anterior/próximo, Filtros, Lista/Semana/Dia, menus por linha, Salvar |
| VisaoGeralCliente | Nenhuma ação com handler | Voltar é span, Editar, abas, Últimos 6 meses |
| MedidasCliente | details abre/fecha nativamente | Editar, abas, Cancelar, Salvar medidas |
| NovaAvaliacao | details abre/fecha nativamente | Editar, abas, Cancelar, Salvar medidas |
| TreinosCliente | Nenhuma ação com handler | Editar perfil, abas, Novo treino, Editar treino, Duplicar, menu, categorias, Adicionar exercício, lixeiras |

Menus de reticências não têm itens definidos. Não inferir exclusão, cancelamento
ou outras operações destrutivas só pela existência do ícone. PDF é exigido pelo
escopo, mas não tem botão atual. Navegar, fechar modal, voltar e cancelar
rascunho não precisam de chamada de API.

## 5. Dados mockados e visualizações

| Local | Conteúdo fixo | Necessidade real |
| --- | --- | --- |
| Sidebar/Home | Leonardo, L, saudação e identidade | Personal autenticado; logo pode continuar asset |
| Home | Segunda-feira, 15 de setembro; cards 32/18/5 | Data local; totais reais de clientes e agenda |
| Home | Seis atendimentos, quatro hoje e dois amanhã | Agenda por intervalo; o número de cards não é calculado pelas linhas |
| Clientes | Oito registros em tuplas, sete ativos e um inativo | Objetos com ID, nome, objetivo, último treino e status |
| Clientes | Mostrando 1 a 8 de 32; página 1 | Total e paginação da API |
| Agenda | Sete tuplas; quatro hoje e três amanhã | Objetos com ID, clientId, início, assunto e status |
| Agenda | 15–21 setembro 2026; 15/09 e 16/09 | Período selecionado e agrupamento por data local |
| Perfil das quatro telas | Marina Silva, MS, 28 anos, 1,65 m, 62 kg | Cliente e última avaliação; meta/status quando exibidos |
| Visão geral | Eixo 90/70/50/30/10; meses Mar–Set; sete pontos em cada linha | Séries reais de peso, cintura e quadril, alinhadas por data |
| Visão geral | Cards -8 kg, -6 cm, -5 cm, +12% massa muscular | Diferenças calculadas; massa muscular sem campo/fórmula de suporte |
| Medidas/Nova avaliação | Arrays measures/fields e data fixa | Avaliação selecionada ou formulário novo |
| Treinos | Resumo A - Membros Inferiores, Hipertrofia, 4 exercícios, 3ª semana, atualizado 08/09/2026 | Versão atual e metadados reais |
| Treinos | Agachamento Hack 4/12/60s; Leg Press 4/12/60s; Cadeira extensora 3/15/45s; Mesa flexora 3/12/45s | Itens da versão e biblioteca |

A lista inclui objetivos Qualidade de vida e Performance ausentes do select de
cadastro. Alinhar as opções sem inventar um catálogo remoto obrigatório. Marina
Costa na agenda e Marina Silva no perfil reforçam que não existe vínculo por ID.
Classes de avatar e status estão misturadas com dados nas tuplas: devem ser
derivadas no front; a API não deve enviar nomes de classes CSS.

Tabelas: Clientes usa table de cinco colunas (Nome, Objetivo, Último treino,
Status, Ações); Agenda usa table de cinco colunas (Horário, Cliente, Tipo de
atendimento, Status, Ações), uma por dia. Exercícios usa grade de divs de seis
colunas (ordem, nome, séries, repetições, descanso, remover).

Cards: três indicadores na Home, quatro métricas no perfil, resumo do treino
atual. Gráfico: construído com divs/i e linhas CSS rotacionadas, sem biblioteca,
escala de dados ou interação. Ao integrar, manter o contêiner e a identidade,
substituindo a geometria fixa por renderização baseada em dados. Peso e medidas
têm unidades diferentes; não tratar o eixo único atual como escala validada.
Legenda de cintura/quadril tem cores trocadas em relação às linhas CSS.

Calendário: somente toolbar, abas e lista agrupada; não há grade semanal,
visão diária ou calendário de seleção implementado. Ícone de calendário não
representa um componente de calendário funcional.

Não há dados para calcular massa muscular ou a 3ª semana do treino. Até existir
regra e fonte, esses indicadores devem exibir indisponibilidade ou ser retirados
na integração; não preencher com estimativas inventadas. “Último treino” precisa
ser definido: a versão mais recente de uma prescrição não prova execução de treino.

## 6. Estado, reutilização e lacunas de UX

Único estado React declarado: `modalAberto` (boolean), em Agendamentos. Há
`modalRef` e useEffect que chama showModal, bloqueia o scroll e restaura overflow
no cleanup. Fechamento usa onCancel e onClick. Campos não controlados e details
mantêm estado nativo do navegador; isso não representa um estado de domínio.

Reutilização existente: Sidebar, Body, React Icons, NavLinks e classes CSS.
Padrões prontos: `.workspace`, `.page-heading`, `.button*`, `.icon-button`,
`.field`, `.form-layout`, `.status*`, `.avatar*`, `.data-table`, `.table-wrap`,
`.profile-tabs`, `.client-profile`, `.form-actions` e modal nativo.
Breakpoints em 1000px e 760px; modal ajusta campos em 400px. Tabelas têm scroll
horizontal; em mobile a Sidebar vira navegação superior e oculta o rodapé.
Configurações/logout exigirão localização acessível também nessa apresentação.

Candidatos a extração incremental: ClientProfileHeader, ClientTabs, AssessmentForm
(reduzir duplicação entre medidas e avaliação), StatusBadge, Avatar, mensagens
de carregamento/erro/vazio e selector de exercícios. Extrair quando o domínio
for integrado, sem refatorar todas as páginas antecipadamente.

Estados a adicionar: sessão em carregamento/autenticada/troca obrigatória,
lista em carregamento/erro/vazia, filtros/página/período selecionados,
rascunho de formulário, erros por campo, submissão em andamento, sucesso e
falha de upload/download. Cancelar não pode disparar submit; salvar deve impedir
envio duplicado e manter o rascunho em caso de erro. Validar também no servidor.

Abas/categorias em divs e Voltar em span precisam virar controles semânticos.
Botões apenas com ícone precisam de nome acessível (a lista de clientes já tem
aria-label por linha; vários outros não). O modal já possui título associado,
botão de fechar nomeado, Escape nativo e estilos de foco. Restante dos campos
precisa de foco visível e mensagens de validação associadas na integração.

## 7. Matriz de integração

Prefixo proposto: `/api`. `:clientId`, `:assessmentId`, `:workoutId` e demais
parâmetros são IDs persistidos, nunca nomes ou posições da lista. “Ausente”
identifica interface ainda não implementada, requerida pelo escopo. “Proposta”
identifica comportamento sugerido para um controle cujo fluxo não foi definido.
“—” indica ação local sem endpoint. Todas as rotas de negócio exigem sessão do personal.

| TELA | AÇÃO DO USUÁRIO | DADOS NECESSÁRIOS | ENDPOINT SUGERIDO | MÉTODO HTTP | ENTIDADE |
| --- | --- | --- | --- | --- | --- |
| Login (ausente) | Entrar | Email, senha; sessão e mustChangePassword na resposta | `/api/auth/login` | POST | auth / Trainer, Session |
| Layout | Restaurar sessão ao abrir | Identidade e flag de troca obrigatória | `/api/auth/session` | GET | auth / Session |
| Troca de senha (ausente) | Alterar senha inicial | Senha atual e nova senha | `/api/auth/password` | PATCH | auth / Trainer, Session |
| Layout (controle ausente) | Sair | Sessão corrente | `/api/auth/logout` | POST | auth / Session |
| Home/Sidebar | Ver personal | Nome do usuário autenticado | `/api/auth/session` | GET | auth / Trainer |
| Home | Ver total de clientes ativos | Contagem de ativos | `/api/clients/summary` | GET | clients / Client |
| Home | Ver totais da semana e de hoje | Intervalos e fuso; contagens | `/api/appointments/summary?from=...&to=...&date=...` | GET | appointments / Appointment |
| Home | Ver agenda resumida | Intervalo; cliente, início, assunto, status | `/api/appointments?from=...&to=...` | GET | appointments / Appointment |
| Home | Ver agenda completa | Nenhum dado adicional para navegar | — | — | appointments |
| Clientes | Listar, buscar, filtrar e paginar | q, goal, status, page, pageSize; items e total | `/api/clients?q=...&goal=...&status=...&page=...&pageSize=...` | GET | clients / Client |
| Clientes | Novo cliente | Navegação ao formulário | — | — | clients |
| Clientes | Abrir perfil (integração da ação) | clientId e dados do cliente | `/api/clients/:clientId` | GET | clients / Client |
| Novo cliente | Salvar | Campos de cadastro e peso inicial | `/api/clients` | POST | clients / Client; assessments / Assessment |
| Novo cliente | Cancelar ou voltar | Rascunho local | — | — | clients |
| Perfil | Editar dados (fluxo a ligar) | clientId e campos modificados | `/api/clients/:clientId` | PATCH | clients / Client |
| Clientes | Alterar ativo/inativo (proposta para menu) | clientId e status | `/api/clients/:clientId` | PATCH | clients / Client |
| Perfil | Abrir aba Medidas | clientId; avaliações paginadas | `/api/clients/:clientId/assessments?page=...&pageSize=...` | GET | assessments / Assessment |
| Medidas | Consultar avaliação selecionada | clientId, assessmentId e valores | `/api/clients/:clientId/assessments/:assessmentId` | GET | assessments, measurements / Assessment |
| Nova avaliação/Medidas | Salvar nova avaliação | Data, peso, medidas e observações | `/api/clients/:clientId/assessments` | POST | assessments, measurements / Assessment |
| Nova avaliação/Medidas | Cancelar rascunho | Estado local | — | — | assessments |
| Visão geral | Consultar evolução / mudar período | from/to, pontos datados, unidades e diferenças | `/api/clients/:clientId/measurements?from=...&to=...` | GET | measurements / projeção de Assessment |
| Histórico (ausente) | Ver avaliações anteriores | clientId, paginação | `/api/clients/:clientId/assessments?page=...&pageSize=...` | GET | assessments / Assessment |
| Histórico (ausente) | Ver treinos anteriores | clientId, paginação e versões | `/api/clients/:clientId/workouts?page=...&pageSize=...` | GET | workouts / Workout |
| Treinos | Ver treino atual | clientId, versão e itens | `/api/clients/:clientId/workouts/current` | GET | workouts / Workout, WorkoutExercise |
| Treinos | Abrir Novo treino | Rascunho vazio e clientId | — | — | workouts |
| Treinos | Abrir edição ou duplicação | clientId, workoutId e itens da origem | `/api/clients/:clientId/workouts/:workoutId` | GET | workouts / Workout |
| Treinos | Escolher/adicionar exercício | Busca, exercício com ID e nome | `/api/exercises?q=...&page=...&pageSize=...` | GET | exercises / Exercise |
| Treinos | Remover item ou mudar categoria | Rascunho local | — | — | workouts / WorkoutExercise |
| Treinos (Salvar ausente) | Publicar novo, editado ou duplicado | Nome, objetivo, categoria, itens e origem opcional | `/api/clients/:clientId/workouts` | POST | workouts / nova versão de Workout |
| Treinos (PDF ausente) | Exportar versão em PDF | clientId, workoutId; resposta application/pdf | `/api/clients/:clientId/workouts/:workoutId/pdf` | GET | workouts / Workout |
| Biblioteca (ausente) | Consultar exercícios | Busca e paginação | `/api/exercises?q=...&page=...&pageSize=...` | GET | exercises / Exercise |
| Biblioteca (ausente) | Cadastrar exercício | Nome; campos adicionais só após definir tela | `/api/exercises` | POST | exercises / Exercise |
| Biblioteca (ausente) | Editar exercício | exerciseId e campos modificados | `/api/exercises/:exerciseId` | PATCH | exercises / Exercise |
| Agenda | Ver lista ou navegar semanas/dias | from/to e filtros; itens por data | `/api/appointments?from=...&to=...&clientId=...&status=...` | GET | appointments / Appointment |
| Agenda | Trocar Lista/Semana/Dia | Modo local; intervalo atualizado se necessário | Mesmo GET da agenda se mudar intervalo | GET ou — | appointments |
| Agenda | Abrir ou fechar modal | Estado modalAberto | — | — | appointments |
| Modal de agenda | Buscar/selecionar cliente | q; ID e nome de clientes | `/api/clients?q=...&page=...&pageSize=...` | GET | clients / Client |
| Modal de agenda | Salvar agendamento | clientId, startsAt e subject | `/api/appointments` | POST | appointments / Appointment |
| Agenda | Consultar atendimento (proposta para menu) | appointmentId e dados | `/api/appointments/:appointmentId` | GET | appointments / Appointment |
| Agenda | Editar/status (proposta para menu) | appointmentId e campos alterados | `/api/appointments/:appointmentId` | PATCH | appointments / Appointment |
| Novo cliente/perfil | Selecionar foto | Arquivo e preview local; cliente criado antes de enviar | — | — | photos |
| Novo cliente/perfil | Preparar envio de foto | clientId, MIME, tamanho; autorização temporária | `/api/clients/:clientId/photo/uploads` | POST | photos / ClientPhoto |
| Novo cliente/perfil | Transferir foto ao storage | Arquivo; URL assinada retornada | URL temporária do object storage | PUT | photos / objeto |
| Novo cliente/perfil | Confirmar upload | clientId, uploadId; arquivo validado no servidor | `/api/clients/:clientId/photo/uploads/:uploadId/complete` | POST | photos / ClientPhoto |
| Perfil/lista | Exibir foto, quando disponível | clientId; metadados e URL assinada curta | `/api/clients/:clientId/photo` | GET | photos / ClientPhoto |
| Sidebar | Abrir Configurações | Navegação; fluxo ainda indefinido | — | — | settings |
| Configurações (ausente) | Consultar configuração mínima | Identidade do personal e fuso de apresentação | `/api/settings` | GET | settings / projeção de Trainer e configuração |

Não há requisitos definidos para salvar preferências ou gerenciar configurações
extras: não propor PUT/PATCH genérico de settings nesta fase. Nome autenticado
vem de auth, não exige criar uma entidade Settings no banco. Não criar CRUD de
measurements separado das avaliações nem usuário para cliente.

O fluxo de foto acima é uma opção de contrato para upload direto a storage.
Não está implementado e não define fornecedor. Cadastro do cliente deve permanecer
salvo se o upload posterior falhar, com opção de repetir envio. Confirmar MIME
real, tamanho, propriedade da chave e existência do objeto antes de gravar
metadados. Não aceitar do navegador uma chave arbitrária como prova de upload.

## 8. Contratos transversais e decisões pendentes

- Listagens retornam objetos identificados e paginação (`items`, `total`,
  `page`, `pageSize`); não retornar tuplas dependentes da ordem da interface.
- Labels em português e classes de status são mapeamento de apresentação.
  Alinhar enum de status: agenda mostra Agendado, Pendente, Em andamento e Concluído.
- Errors devem ter código, mensagem, erros de campo quando aplicável e requestId.
  Diferenciar não autenticado, troca obrigatória, não encontrado, validação e conflito.
- Cliente HTTP central com cookies (`credentials`), proteção CSRF nas mutações
  e tratamento consistente de sessão expirada. Nenhum token no localStorage.
- Guardas no front orientam navegação; autorização e troca obrigatória devem
  ser impostas na API. Sem cadastro público ou login de cliente.
- Datas de avaliação: YYYY-MM-DD. Agenda: instantes com offset, exibidos no
  fuso America/Sao_Paulo. Datas “Hoje/Amanhã” são calculadas, não strings do mock.
- Definir transporte de Decimal e conversão explícita; não misturar strings
  pt-BR com valores de banco. Ausência de medida deve permanecer null/ausente.
- Peso atual deriva da avaliação mais recente; edição de perfil não sobrescreve
  peso histórico. Edição de prescrição cria versão, incluindo snapshot dos exercícios.
- Pendências antes de implementar: significado de Último treino, catálogo de
  objetivos, transições de status, papel de Medidas versus Nova avaliação e
  fonte dos indicadores sem dados. Não bloqueiam a análise nem autorizam inventar requisitos.

## 9. Plano de integração e arquivos das próximas fases

| Fase | Arquivos existentes a alterar | Arquivos sugeridos a criar | Validação principal |
| --- | --- | --- | --- |
| 1. API/auth | `src/components/body.jsx`, `src/components/layout/sidebar.jsx`, `vite.config.js`, estilos pontuais | `src/services/api.js`, `src/services/auth.js`, `src/contexts/AuthContext.jsx`, guarda de rota, páginas Login e AlterarSenha | Login, troca obrigatória, expiração, logout; chamadas não duplicadas indevidamente em StrictMode |
| 2. Clients | `src/pages/clientes/clientes.jsx`, `src/pages/novosClientes/novoCliente.jsx`, `src/pages/detalhesClientes/visaoGeral.jsx`, `src/components/body.jsx` | `src/services/clients.js`, cabeçalho/abas de cliente, helpers de números/datas | Listar, buscar, paginar, salvar com peso inicial, abrir cliente correto, editar |
| 3. Appointments | `src/pages/agendamentos/agendamentos.jsx`, `src/pages/home/home.jsx` | `src/services/appointments.js`; extrair formulário modal apenas se útil | Data/fuso, seleção por ID, criação, filtros, período e atualização após salvar |
| 4. Assessments/measurements | `src/pages/detalhesClientes/medidasCliente.jsx`, `novaAvaliacao.jsx`, `visaoGeral.jsx`, `src/components/body.jsx`, CSS pontual do gráfico | `src/services/assessments.js`, `src/services/measurements.js`, `src/components/AssessmentForm.jsx`, página de histórico | Nova avaliação preserva anterior; gráfico e cards com dados reais e vazios |
| 5. Workouts/exercises | `src/pages/detalhesClientes/treinosCliente.jsx`, `src/components/body.jsx`; histórico criado na fase anterior | `src/services/workouts.js`, `src/services/exercises.js`, seletor/biblioteca e ação Salvar | Composição local, nova versão, duplicação, histórico e snapshot |
| 6. Photos/PDF | `novoCliente.jsx`, cabeçalho compartilhado, `clientes.jsx`, `treinosCliente.jsx` | `src/services/photos.js`, componente de upload; download PDF em workouts.js | Arquivo inválido, falha/repetição de upload, URL expirada, PDF da versão escolhida |
| 7. Settings/resumos | `sidebar.jsx`, `home.jsx`, `src/components/body.jsx`, `treinos/README.md` | Serviço/tela settings somente para escopo definido | Totais reais, navegação mobile e documentação operacional |

Todos os caminhos `src/...` dessa tabela são relativos a `treinos/`.
`src/App.css` e `src/index.css` só recebem ajustes necessários de estados,
acessibilidade e novos controles; manter identidade, layouts e breakpoints.
`src/main.jsx` pode receber o provider de sessão, sem trocar a aplicação ou o roteador.
Back-end será novo em `backend/`, conforme `arquitetura.md`; este inventário
não cria servidor nem dependências.

Validar cada domínio com build/lint, fluxos relevantes e testes proporcionais.
No back-end, incluir tipagem e migrations executadas em PostgreSQL de teste.
Não ampliar testes só por mudanças de texto ou extrações visuais simples.

## 10. Validação desta fase e mudanças

- `npm run build` em `treinos/`: passou.
- `npm run lint` em `treinos/`: passou.
- Revisados os oito componentes de página, layout, entrada, roteador, estilos,
  configuração, manifests e referências dos assets.
- Sem falhas impeditivas de build/lint identificadas. Rota vazia, controles
  inertes e dados fixos são lacunas de integração documentadas, não corrigidas
  com comportamento arbitrário nesta fase.
- Não foi realizada validação visual em navegador; funcionamento de modal e
  links descrito a partir do código, sem alegação de teste ponta a ponta.
- Tipagem independente e migrations não se aplicam ao estado atual: inexistentes.
- Criado apenas `docs/inventario-front-end.md` nesta fase; o documento
  `docs/arquitetura.md` já existia da etapa anterior. Código de aplicação preservado.
