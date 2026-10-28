# Treinos — interface React

A interface usa a API NestJS em `../backend`. O PostgreSQL local está
configurado na porta 5433; veja [inicialização e primeiro acesso](../docs/banco-local.md).
Sem API disponível, o login exibe o erro de conexão.
Neste computador, o desenvolvimento local está configurado para entrar sem
senha. Esse modo exige `LOCAL_AUTH_BYPASS=true` no backend e
`VITE_LOCAL_AUTH_BYPASS=true` em `.env.development.local`; a API então aceita
conexões somente de `127.0.0.1`. Não use essa opção em produção ou numa rede compartilhada.

## Executar

Na raiz do repositório, em PowerShell:

```powershell
npm ci
cd treinos
npm ci
npm run dev
```

Abra http://localhost:5173. As dependências da raiz incluem o plugin Tailwind.
O Vite encaminha `/api` para http://localhost:3000 e remove o prefixo:
`/api/auth/login` chega à API como `/auth/login`.
O backend deve permitir a origem exata do navegador em CORS_ORIGINS.

Não é necessário criar um .env do front para desenvolvimento.
Para mudar o destino, configure VITE_API_URL conforme .env.example.
Em produção/preview, o proxy de desenvolvimento do Vite não existe:
o servidor de hospedagem precisa encaminhar /api ao backend ou a variável
de build VITE_API_URL precisa apontar para a origem da API.
Use front e API no mesmo site para o cookie SameSite=Lax funcionar.

## Fluxos conectados

- Login, restauração de sessão, troca obrigatória da senha inicial, troca
  voluntária, logout e saída quando a sessão expira.
- Dashboard com nome do personal e total real de clientes ativos.
- Clientes: listagem paginada, busca por nome/e-mail/telefone, filtros de
  objetivo/status, cadastro, edição, inativação e reativação.
- Perfil selecionado por ID, sem cliente fixo.
- Foto principal: envio multipart e consulta da URL temporária. Exige S3
  configurado no backend; falhas de storage são exibidas.
- Avaliações: data, peso, altura em centímetros, gordura, próxima avaliação,
  observações e medidas opcionais. Após o cadastro do cliente, registre a
  avaliação inicial no perfil (requisições independentes).
- Histórico paginado, correções com motivo e versão e consulta de auditoria.
- Evolução de peso e medidas com filtro de datas.
- Configurações: catálogo de medições vindo do servidor, cadastro, edição,
  arquivamento e reativação. Histórico preserva nome/unidade originais.

Rotas de perfil usam `/clientes/:clientId/...`. Os caminhos antigos sem ID
encaminham à lista para que o usuário selecione um cliente.

A API ainda não tem módulos de agenda, exercícios ou prescrição de treinos.
Agenda/treinos mostram o estado de indisponibilidade. O cadastro de exercícios
em Configurações continua local, com essa limitação informada na tela.
Tipos de medição antigos no localStorage não são enviados automaticamente
ao banco: os novos registros usam exclusivamente os IDs reais da API.

## Segurança e falhas

Cookies HttpOnly são enviados com credentials: include. O token CSRF fica
somente em memória, é recuperado por /auth/me e acompanha as mutações.
Credenciais e tokens de autenticação não são gravados no localStorage.
Botões de envio bloqueiam enquanto a requisição está em andamento.
Listas mostram carregamento, vazio e erro sem substituir dados reais por mocks.
Requisições de leitura são canceladas quando o componente sai da tela.

## Verificar

```powershell
npm run build
npm run lint
npm test
```

Os testes do cliente HTTP verificam cookies/CSRF e rotação de token, upload
multipart, expiração, troca obrigatória, validação, paginação e erros de rede.
Ainda é necessário testar os fluxos completos contra PostgreSQL e S3 quando
essas configurações forem feitas. Consulte [o backend](../backend/README.md).
