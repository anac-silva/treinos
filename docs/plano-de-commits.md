# Separação dos commits

O trabalho pendente mistura funcionalidades anteriores com a revisão de arquitetura. A separação preserva a mudança de pasta como operação própria, sem sobrescrever o conteúdo de trabalho.

1. **Higiene do repositório:** retirar `node_modules/` do índice, mantendo os arquivos instalados no disco. Dependências passam a ser reproduzidas pelos manifests e lockfiles.
2. **Mudança de pasta:** registrar os blobs da versão anterior de `treinos/` sob `frontend/`. Isso isola a renomeação das alterações funcionais e da remoção posterior de páginas antigas.
3. **API:** incluir módulos de exercícios e fichas, migrations, pré-cadastros e previsões de avaliação, além dos serviços separados, consultas filtradas e testes HTTP correspondentes. Os endpoints anteriores continuam compatíveis.
4. **Infraestrutura do frontend:** consultas identificadas por recurso, transporte, datas de São Paulo, utilitários e testes. Essas adições podem existir antes de seus consumidores.
5. **Interface:** integrar calendário, formulários, treinos, estilos, páginas organizadas, remoção das telas antigas e instalação autossuficiente do frontend.
6. **Documentação e convenções:** instruções atuais, arquitetura, procedimentos de teste e configuração de texto UTF-8.

Depois de registrar todos os grupos, conferir `git status`, executar build/testes e revisar `git log --stat`. A publicação no GitHub é uma etapa separada; não exige juntar os grupos em um único commit.

Arquivos `.env`, perfis do navegador de teste, cache npm, arquivos temporários e dependências instaladas não devem integrar os commits.
