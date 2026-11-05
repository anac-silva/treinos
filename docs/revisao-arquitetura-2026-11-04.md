# Revisão de arquitetura e organização — 04/11/2026

> Diagnóstico histórico, anterior à implementação das correções. O estado atual está descrito em [organização do projeto](organizacao-do-projeto.md); a divisão final está em [plano de commits](plano-de-commits.md).

Revisão do estado local, incluindo alterações ainda não commitadas. Nenhum arquivo de aplicação foi alterado nesta revisão. Não foram feitos stage, commit ou push.

## Situação do Git

O Git compara o diretório de trabalho com o último commit. `D` significa caminho rastreado removido; `M`, arquivo modificado; `??`, arquivo ainda não rastreado. Esses estados locais não significam que as mudanças já foram enviadas ao GitHub.

Os 56 arquivos rastreados em `treinos/` têm correspondentes em `frontend/`: 22 são idênticos byte a byte e 34 diferem. Não há arquivo antigo sem correspondente nesse conjunto. Portanto, a lista de exclusões é principalmente uma mudança de pasta misturada com alterações de implementação. Isso não prova que o comportamento de todas as telas foi preservado.

O índice está vazio: nada está preparado para commit. Ao preparar os caminhos antigos e novos juntos, o Git pode apresentar pares como renomeações conforme a similaridade. Renomeação é detectada por comparação, não armazenada como operação especial. Um commit de mudança de pasta sem alterações funcionais facilita muito a revisão.

Há ainda módulos novos de exercícios/treinos, seis diretórios novos de migrations, funcionalidades de pré-cadastro e alterações visuais. São assuntos distintos.

## Achados por prioridade

### 1. Alta — o formulário usa um fuso diferente da agenda

Em `frontend/src/pages/agendamentos/agendamentos.jsx:15`, o formulário extrai horas com `getHours()`, usando o fuso do navegador. Na linha 59, converte data/hora sem indicar fuso. Já a agenda e o dashboard exibem em `America/Sao_Paulo`.

Ao abrir em outro fuso, o mesmo horário digitado pode ser salvo como outro instante. A edição também pode apresentar hora diferente da listagem.

Recomendação: definir o fuso do negócio em um utilitário único e usá-lo tanto na leitura quanto na gravação do formulário. Centralizar também formatação, limites do dia e cálculo de períodos. Testar navegador em São Paulo e em outro fuso.

### 2. Média — erro de confirmação fica atrás do modal

Em `frontend/src/pages/agendamentos/agendamentos.jsx:220`, `confirmError` é renderizado na página. A confirmação é iniciada dentro do `DayDialog`, em `appointmentCalendar.jsx`, que continua aberto via `showModal()`.

Se a confirmação falhar, o usuário permanece no modal e a mensagem fica no conteúdo de fundo, inacessível enquanto o diálogo está aberto.

Recomendação: manter erro e progresso da ação no diálogo que a iniciou. Usar uma responsabilidade clara para coordenar as ações e repassar o resultado à tabela.

### 3. Média — tela de aluno baixa fichas de todos os alunos

`frontend/src/pages/workouts/workoutWorkspace.jsx:21` usa `allPages('/workout-sheets')` inclusive ao abrir um aluno específico. Depois filtra tudo no navegador. A resposta do backend inclui blocos e exercícios completos. O histórico de avaliações também baixa todas as páginas antes de paginar visualmente (`clientDetail.jsx:46`).

O custo de abrir uma ficha cresce com o volume total de dados, não apenas com o aluno selecionado.

Recomendação: consultar fichas com `clientId`, buscar resumos paginados e carregar detalhes ao selecionar. Para copiar outra ficha, carregar o seletor sob demanda. Para avaliações agrupadas por dia, manter a regra de agrupamento ao desenhar paginação no servidor; não trocar simplesmente por páginas arbitrárias de registros.

### 4. Média — `useRemote` mantém o resultado do recurso anterior

`frontend/src/lib/useRemote.js:5` inicia outra consulta quando `path` ou `revision` muda, mas não identifica o estado pela chave da consulta nem volta a indicar carregamento. O comentário exige que cada chamador faça remount para evitar dados de outro aluno.

Os chamadores que usam `key` reduzem o risco, mas o contrato do hook permite dados antigos com `loading: false` durante uma nova leitura. É uma fragilidade de reutilização, não evidência de vazamento entre usuários autenticados.

Recomendação: associar o estado à chave do recurso, impedir que resultado antigo seja apresentado como atual e definir uma política explícita para revalidação. Testar mudança de recurso e respostas fora de ordem.

### 5. Média — CSS global acumula definições concorrentes

`frontend/src/App.css` reúne layout, componentes e páginas. `frontend/src/layout.css`, importado depois em `main.jsx:5`, redefine vários dos mesmos seletores. Por exemplo, `.workspace .field input` volta a aplicar altura e tipografia que regras específicas do calendário tentam reduzir em telas baixas.

Isso torna o resultado dependente de ordem e especificidade. O uso de `overflow: hidden` também exige verificar que conteúdo não foi apenas cortado em telas pequenas ou com zoom.

Recomendação: tokens e estrutura em um arquivo de layout; componentes compartilhados com estilos próprios; regras do calendário junto da funcionalidade. Consolidar definições existentes antes de acrescentar novas sobrescritas. Verificar calendário com quatro, cinco e seis semanas, telas baixas, celular e zoom. A inspeção estática não confirma todos esses cenários visuais.

### 6. Média — instruções de execução apontam para pasta removida

`frontend/README.md` ainda manda executar `cd treinos`. `backend/README.md:12` e documentos operacionais também apontam para `../treinos/README.md`. A mudança de pasta deixa instruções de instalação e links inválidos.

O frontend ainda importa o plugin Tailwind instalado na raiz. Essa dependência é documentada, mas a divisão de instalação entre raiz e frontend dificulta manutenção e CI.

Recomendação: atualizar documentos operacionais no commit da mudança de pasta. Depois escolher dependências autossuficientes no frontend ou workspaces declarados. Não alterar documentação histórica como se descrevesse o estado atual; identificá-la como histórica quando necessário.

### 7. Baixa — componentes concentram fluxos diferentes

`workoutWorkspace.jsx` contém carregamento da biblioteca, edição de bloco, montagem de ficha, seleção, cartões, histórico e telas de biblioteca/aluno. `agendamentos.jsx` reúne formulário, diálogos, carregamento de alunos e ações remotas. `CatalogProvider.jsx` carrega catálogos, importa dados legados e grava registros.

Recomendação: extrair componentes e hooks pelas responsabilidades reais, preservando a coordenação na página. Separar importação legada do carregamento comum e tornar sua execução explícita e idempotente. Evitar dividir apenas por número de linhas.

### 8. Baixa — páginas antigas continuam junto das páginas ativas

As rotas atuais em `components/body.jsx` não usam as páginas de `pages/home`, `pages/novosClientes`, `pages/detalhesClientes` e `pages/unsupported.jsx`. Há um fluxo antigo de seleção de exercícios ligado a essas páginas. `pages/workouts/workouts.jsx` é um reexport, enquanto a rota importa diretamente `workoutWorkspace`.

Recomendação: conferir entradas e referências externas antes de remover os arquivos sem uso. Fazer essa limpeza em commit próprio para reduzir dúvidas sobre qual implementação editar.

### 9. Baixa — regras entre avaliações e agenda estão concentradas no serviço de avaliações

`backend/src/modules/assessments/assessments.service.ts:40` cria e sincroniza agendamentos, além de validar e persistir avaliações. A regra de previsão tem motivo próprio para mudar.

Recomendação: extrair a sincronização para um colaborador pequeno, recebendo a mesma transação Prisma. Não substituir por eventos assíncronos sem necessidade: avaliação e previsão precisam continuar consistentes atomicamente. Regras simples de CRUD podem continuar nos serviços existentes.

## O que preservar

- Backend como monólito modular NestJS: controllers HTTP, DTOs de entrada, services de aplicação e Prisma/PostgreSQL.
- Injeção de dependências existente. `ObjectStorage` é uma boa abstração porque há implementações diferentes e testes que a substituem.
- Transações, restrições do banco, proteção contra concorrência nas fichas e controle de versão nas correções de avaliações.
- Validação no servidor e snapshots das medidas nas avaliações.

Não há justificativa, nesta revisão, para microserviços, CQRS ou uma interface/repository genérico para cada tabela. Acesso direto ao Prisma nos serviços é aceitável neste tamanho. Extrair abstrações apenas quando isolarem regras, integrações variáveis ou consultas realmente compartilhadas.

Uma organização incremental suficiente para o frontend seria `app/` para rotas e providers, pastas por funcionalidade com página/componentes/hooks/API e `shared/` para UI e utilitários usados em mais de uma funcionalidade. Evitar outra mudança geral de pastas antes de concluir e registrar a atual.

## Separação recomendada dos commits

1. `chore: mover frontend de treinos para frontend` — somente a movimentação do conteúdo da base e atualização dos caminhos operacionais. Para obter separação exata, preparar uma versão intermediária ou índice temporário preservando uma cópia integral do trabalho atual; não sobrescrever a pasta atual para reconstruir o estado antigo.
2. `feat: adicionar exercícios e treinos versionados` — migrations iniciais de treinos, módulos, telas e testes correspondentes.
3. `feat: adicionar pré-cadastro de alunos` — status, importação dos contatos, integração com agenda, exclusão preservando agendamentos e testes.
4. `feat: gerar agendamento pendente de próxima avaliação` — migration, sincronização e fluxo de confirmação.
5. `feat: organizar treinos em fichas com múltiplos blocos` — migration de fichas, serviços, interface, testes e documentação.
6. `feat: adicionar calendário mensal e padronizar agenda` — calendário, modal, cabeçalhos, terminologia e contagem semanal.
7. `fix: recuperar leituras após indisponibilidade temporária da API` — tentativas limitadas, cancelamento e testes. Essa alteração trata falhas temporárias; não comprova que a causa do 502 foi corrigida.
8. Correções e refatorações desta revisão, separadas por problema: fuso, mensagens no modal, estado de consulta, carregamento, CSS e remoção de código sem uso.

Arquivos compartilhados como schema, registro de módulos e a suíte de integração exigem seleção de trechos por assunto. Cada commit precisa compilar e ter suas dependências anteriores. Separar apenas por frontend/backend deixaria algumas funcionalidades incompletas entre commits.

## Verificação executada

- Frontend: 17 testes aprovados.
- Backend: TypeScript sem erros e 10 testes unitários aprovados.
- Integração HTTP/PostgreSQL: 28 testes aprovados em schemas temporários isolados, com migrations aplicadas pelos próprios testes.
- A execução de integração emitiu aviso de depreciação do `pg` sobre consultas simultâneas no mesmo cliente. A origem exata não foi rastreada; não é possível atribuí-la a um serviço específico nesta revisão.
- Não foi feita nova validação visual em navegador nem simulação de produção. Os testes aprovados não cobrem todos os achados acima.
