# Configurações de exercícios e medições

## Uso

Abra **Configurações** pela navegação (`/configuracoes`).

- Exercícios: informe o nome, clique Cadastrar e use a busca para consultar a lista.
- Medições: informe nome e unidade (por exemplo, Cintura / cm ou Peso / kg).
  Campos em branco e nomes duplicados, desconsiderando maiúsculas, são rejeitados.
- Os cadastros iniciais reutilizam os quatro exercícios e onze medições do front anterior.
- Na avaliação (`/clientes/novaavaliacao`) e em Medidas (`/clientes/medidas`),
  as medições cadastradas aparecem com a respectiva unidade, sem valores mockados.
- Na avaliação e na montagem (`/clientes/treinos`), comece a digitar o nome do
  exercício: o campo sugere os itens cadastrados em Configurações. Escolha uma
  sugestão e clique Adicionar exercício. Se o nome ainda não estiver cadastrado,
  use Cadastrar exercício ali mesmo; o novo item fica no catálogo compartilhado
  e disponível para adicionar. Remover retira apenas da seleção atual.
  No treino, séries, repetições e descanso também são editáveis.
- As abas do perfil permitem navegar entre visão geral, medidas, avaliação e treino.

## Persistência e integração futura

O catálogo é salvo no localStorage sob `personal-trainer.catalog.v1`, com IDs.
Recarregar mantém os cadastros no mesmo navegador/origem. Não há sincronização
entre dispositivos. Falhas ao salvar geram mensagem e não indicam sucesso.

A seleção de exercícios e os valores de avaliação são rascunhos locais de tela,
descartados ao sair. O perfil continua ilustrativo; salvar avaliação/treino,
histórico, login e autorização dependem de fases posteriores. Não se criou
autenticação simulada. O front não armazena credenciais.

`CatalogProvider` concentra o armazenamento temporário. A futura integração
trocará essa camada por endpoints de exercises e definições de measurements,
preservando os componentes de seleção. As avaliações deverão salvar snapshots
do nome/unidade da definição, além dos valores, para manter o histórico.

## Arquivos

Criados: `contexts/catalogContext.js`, `contexts/CatalogProvider.jsx`,
`pages/configuracoes/configuracoes.jsx`, `components/catalogMeasurements.jsx`,
`components/exerciseSelection.jsx` e `components/clientTabs.jsx` (todos em `treinos/src`).

Alterados: roteador Body, Sidebar, App.css e as quatro páginas em detalhesClientes.
Atualizada a nota do inventário para distinguir o diagnóstico anterior do estado atual.

## Validação

- Build e lint do front passaram.
- Verificação executada com Vite e renderização React em Node: cadastro,
  rejeição de nome vazio/duplicado, unidade obrigatória, persistência ao remontar
  o provider, disponibilidade dos novos itens nos seletores/campos e falha de storage.
- Sem validação visual em navegador nesta execução. Não há tipagem independente
  nem migrations no front atual.
