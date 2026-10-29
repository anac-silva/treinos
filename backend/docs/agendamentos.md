# Agendamentos

Agendamentos são protegidos pela sessão do personal e podem estar associados
a um cliente existente ou ser um pré-cadastro com nome e telefone, sem criar um
registro de cliente. Datas são instantes ISO-8601 com fuso horário; o
frontend converte o horário local do navegador antes de enviar.

| Endpoint | Método | Operação |
| --- | --- | --- |
| `/appointments` | POST | Criar um agendamento |
| `/appointments` | GET | Listar por período, cliente e status |
| `/appointments/:id` | PATCH | Editar dados ou status; `CANCELLED` cancela |

Exemplo de criação:

```json
{
  "clientId": "UUID_DO_CLIENTE",
  "startsAt": "2026-12-01T14:30:00.000Z",
  "durationMinutes": 60,
  "type": "Treino",
  "notes": "Levar avaliação anterior"
}
```

Para um pré-cadastro, envie `guestName` e `guestPhone` no lugar de `clientId`.
Não é criado um cliente até que o cadastro completo seja feito. Ao completar o
cadastro, o agendamento pode ser associado ao cliente enviando `clientId` e
`guestName: null`, `guestPhone: null` em uma atualização.

Informe `clientId` ou o par `guestName`/`guestPhone`, nunca os dois. `startsAt`
e `type` são obrigatórios. A duração padrão é 60
minutos e aceita valores entre 5 e 480. Tipo aceita até 100 caracteres e
observações até 5000. O status inicial é `SCHEDULED`; os estados disponíveis
são `SCHEDULED`, `COMPLETED` e `CANCELLED`. Não há exclusão física: cancelar
preserva o histórico.

A listagem aceita `from` e `to` (timestamps ISO inclusivos), `clientId`,
`status`, `page` e `pageSize` (máximo 100). A resposta é
`{ items, total, page, pageSize }`, ordenada por início e ID. Cada item inclui
o nome e o status atual do cliente, ou os dados de contato do pré-cadastro.
Cliente inexistente, UUID inválido, datas
inválidas, período invertido ou valores fora dos limites são rejeitados.

As mutações exigem cookie de sessão e `X-CSRF-Token`. A versão inicial não
impede sobreposição de horários; conflitos devem ser conferidos pelo personal.
