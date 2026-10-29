# Contratos de clientes, avaliações, medições e fotos

Todos os endpoints usam a sessão do personal e o guard global já existente.
Mutações exigem X-CSRF-Token e ficam bloqueadas até a troca da senha inicial.
Não há login de clientes, exclusão de clientes ou exclusão de avaliações.
Os caminhos não têm prefixo `/api` nesta fase; o front ainda não foi integrado.

## Clientes

| Endpoint | Método | Operação |
| --- | --- | --- |
| `/clients` | POST | Criar cliente |
| `/clients` | GET | Listar, buscar e filtrar |
| `/clients/:id` | GET | Consultar cadastro, metadados da foto principal e avaliação mais recente |
| `/clients/:id` | PATCH | Corrigir dados de cadastro ou mudar status |

Exemplo de cadastro:

```json
{
  "name": "Nome do cliente",
  "age": 28,
  "email": "cliente@example.test",
  "phone": "11999999999",
  "goal": "Hipertrofia",
  "experienceLevel": "Iniciante",
  "notes": "Observações do personal"
}
```

Apenas name é obrigatório. Contatos e observações aceitam null para limpeza
em uma edição. Email é normalizado em minúsculas e não precisa ser único entre
clientes. Nome: até 100 caracteres; telefone: 40; observações: 5000. Age é a
idade informada (0–150), não uma data de nascimento calculada.

Listagem: `q`, `status=ACTIVE|INACTIVE`, `goal`, `page` e `pageSize` (1–100).
Busca q em nome, email e telefone, sem diferenciar maiúsculas. Retorno
`{ items, total, page, pageSize }`, com ordenação estável por nome/ID.

Inativação: PATCH com `{ "status": "INACTIVE" }`. Nenhuma avaliação, correção
ou foto é removida. Reativação usa ACTIVE. Inatividade não cria uma regra nova
de bloqueio de correções ou de registro de avaliações.

Peso, altura e gordura pertencem às avaliações, não a campos sobrescritos do
cliente. Para registrar o peso inicial, crie a avaliação após obter o clientId;
nesta fase os dois endpoints são independentes, sem promessa de transação
entre requisições. Foto é opcional e pode ser enviada posteriormente.

## Catálogo de medições

| Endpoint | Método | Operação |
| --- | --- | --- |
| `/measurement-types` | POST | Criar definição por nome/unidade |
| `/measurement-types` | GET | Listar e buscar (q/page/pageSize) |
| `/measurement-types/:id` | PATCH | Alterar nome/unidade ou active |

Exemplo: `{ "name": "Cintura", "unit": "cm" }`. Nome até 100 e unidade até 20
caracteres, sem strings vazias. Unidade é explícita e flexível, não um enum
fechado. Nome duplicado normalizado retorna 409. Active=false arquiva a
definição para novos registros, mantendo referências e valores históricos.

Cada AssessmentMeasurement armazena typeId, typeName, value e unit. Nome e
unidade são copiados do catálogo ao criar a avaliação. Alterações futuras no
catálogo não mudam avaliações existentes. Uma correção de valor mantém o
snapshot antigo do tipo que já estava na avaliação, mesmo que o tipo tenha
sido renomeado, mudado de unidade ou inativado.

## Avaliações e evolução

| Endpoint | Método | Operação |
| --- | --- | --- |
| `/clients/:clientId/assessments` | POST | Nova avaliação independente |
| `/clients/:clientId/assessments` | GET | Histórico paginado |
| `/clients/:clientId/assessments/:id` | GET | Avaliação atual, versão e medições |
| `/clients/:clientId/assessments/weight-evolution` | GET | Série cronológica do peso |
| `/clients/:clientId/assessments/:id/corrections` | POST | Correção controlada |
| `/clients/:clientId/assessments/:id/corrections` | GET | Auditoria antes/depois das correções |
| `/clients/:clientId/measurements` | GET | Séries de todas as medições do cliente |
| `/clients/:clientId/measurements/:typeId/evolution` | GET | Série de um tipo específico |

Exemplo de criação (substitua typeId por um ID real do catálogo):

```json
{
  "assessedOn": "2026-10-06",
  "weightKg": 70.5,
  "heightCm": 165,
  "bodyFatPercent": 20.5,
  "nextAssessmentOn": "2026-11-06",
  "notes": "Observações desta avaliação",
  "measurements": [{ "typeId": "UUID_DO_TIPO", "value": 75 }]
}
```

Data e peso são obrigatórios; demais campos são opcionais. Peso permite três
casas decimais; altura e gordura, duas; valores das medições, três. Números são
enviados como números JSON, sem vírgula decimal, e devolvidos como strings
decimais para evitar perda de precisão. Peso/altura devem ser positivos;
gordura entre 0 e 100; medições não negativas. Os limites superiores de peso,
altura e medidas são os limites técnicos das colunas Decimal, não critérios médicos.

Datas civis usam YYYY-MM-DD, com validação de dias reais. Próxima avaliação
não pode ser anterior à avaliação atual. Medições são opcionais (máximo 100)
e não podem repetir typeId. Tipo inexistente/inativo é rejeitado. A avaliação
e seus valores são criados na mesma transação. UUIDs de avaliação são sempre
consultados junto com clientId para evitar associação ao cliente incorreto.

Evoluções aceitam `from` e `to`, inclusivos. Ordenação: data da avaliação,
createdAt e ID. Avaliações inseridas fora de ordem aparecem cronologicamente;
várias avaliações no mesmo dia não são agregadas nem descartadas. Retorno de
peso: `{ clientId, unit: "kg", items: [{ assessmentId, version, assessedOn, value }] }`.
Medições: `{ clientId, items: [{ assessmentId, version, assessedOn, typeId, name, unit, value }] }`.

Se a unidade de um tipo mudou entre avaliações, cada ponto mantém sua própria
unidade. A interface deverá separar séries por unidade ou implementar conversão
explícita; a API não soma nem compara valores de unidades diferentes.

## Correção histórica

Cada POST de avaliação cria um novo registro e nunca sobrescreve o anterior.
Não existe PATCH genérico de avaliação. Uma correção usa:

```json
{
  "expectedVersion": 1,
  "reason": "Correção de erro de digitação",
  "weightKg": 70
}
```

Informe ao menos um campo corrigido. Motivo é obrigatório (até 500 caracteres).
A correção incrementa version e updatedAt, preserva createdAt e grava um registro
de auditoria com ator da sessão, motivo e snapshots completos before/after.
Versão antiga retorna 409; correções concorrentes sobre a mesma versão permitem
somente uma gravação. Atualização, medidas e auditoria são atômicas.

Campos omitidos ficam preservados. Null limpa altura, gordura, notas e próxima
avaliação; não é aceito para data/peso. Se measurements for informado, substitui
o conjunto inteiro como correção auditada (lista vazia remove o conjunto atual,
mantendo os valores anteriores na auditoria). O tipo antigo arquivado pode
continuar em uma correção; um novo tipo arquivado não pode ser acrescentado.
Os endpoints de evolução usam a versão corrigida; originais permanecem nos
snapshots da auditoria. Não há endpoint para alterar/apagar essa auditoria.

## Fotos e object storage

| Endpoint | Método | Operação |
| --- | --- | --- |
| `/clients/:clientId/photo` | POST | Multipart com um arquivo no campo file; define foto principal |
| `/clients/:clientId/photo` | GET | Metadados da foto principal e URL assinada por 300 segundos |

Envie multipart/form-data; não envie URL, storageKey ou outros campos. São
aceitos JPEG, PNG e WebP até 5 MB e 20 milhões de pixels. A validação verifica
formato real e correspondência do MIME, rejeita conteúdo corrompido/animado,
decodifica/reencoda a imagem e remove metadados EXIF. A imagem processada também
precisa caber em 5 MB. Nome original do arquivo não determina a chave no storage.

O banco contém somente storageKey, MIME, tamanho, associação ao cliente,
flag principal e timestamps. Chaves são geradas pelo servidor. Não há blob,
base64 ou URL arbitrária recebida do usuário no banco. URLs assinadas são
produzidas pelo adaptador ao consultar, não persistidas. O retorno público
não expõe storageKey. Cliente sem foto retorna 404.

Para desenvolvimento neste computador, configure `PHOTO_STORAGE=local`. As
imagens ficam em `backend/.local-photos/`, fora da pasta pública, e são servidas
somente pela API autenticada. Esse modo só inicia com `NODE_ENV=development`;
não use armazenamento local em produção. Para produção, configure S3:

```dotenv
PHOTO_STORAGE=s3
S3_BUCKET=SEU_BUCKET_PRIVADO
S3_REGION=SUA_REGIAO
S3_FORCE_PATH_STYLE=false
```

Use roles/permissões do ambiente ou AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY
fornecidas no ambiente real, nunca no repositório. O bucket deve bloquear acesso
público. S3_ENDPOINT é opcional para provedores compatíveis; use HTTPS em
produção e PATH_STYLE conforme o provedor. O adaptador não cria buckets ou
altera policies. Requer PutObject/GetObject/DeleteObject no prefixo usado.

Com PHOTO_STORAGE=disabled, upload retorna 503, mantendo os demais módulos
operacionais. Não há fallback automático entre S3 e disco local.

Novo upload só passa a principal após sucesso no storage e banco. Os uploads
do mesmo cliente são serializados por lock do registro Client e protegidos
por índice único parcial. Foto anterior permanece armazenada, marcada como
não principal. Falha no banco tenta remover o objeto recém-enviado e preserva
a foto anterior; falha no storage não cria metadados. Uma falha na compensação
gera evento `photo.cleanup.failed` para reconciliação operacional de objetos
sem metadados. Banco e storage não compartilham uma transação distribuída.

## Arquivos e validação

Criados os módulos `src/modules/clients`, `assessments`, `measurements` e
`photos` com services, controllers, DTOs/validação e módulos NestJS.
Alterados schema, AppModule, CORS, tipos TS, dependências/lockfile e ambiente
de exemplo. Nova migration: `20261006000200_client_assessment_photos`.

Referências do adaptador e validação:
[AWS SDK S3](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html)
e [limites de imagens Sharp](https://sharp.pixelplumbing.com/api-constructor/).

Validação desta entrega: migrations aplicadas em PostgreSQL 18 isolado, sem
divergência no schema; build, tipagem, lint, 6 testes unitários e 17 testes HTTP
passaram. Os testes HTTP usam PostgreSQL real e um adaptador de storage em memória
injetado somente em testes. O adaptador S3 teve seus comandos verificados sem
enviar arquivos a um bucket externo; nenhum bucket real foi fornecido.
