# Treinos

Exercícios, modelos e prescrições de clientes são persistidos no PostgreSQL.
Modelos têm `clientId: null` e um nível (`BASIC`, `INTERMEDIATE` ou
`ADVANCED`). Prescrições pertencem a um cliente; a mais recente fica marcada
como atual e as anteriores permanecem no histórico. Uma cópia registra a
origem sem alterar o treino original.

| Endpoint | Método | Operação |
| --- | --- | --- |
| `/exercises` | POST | Cadastrar exercício |
| `/exercises` | GET | Listar exercícios com busca e paginação |
| `/workouts` | POST | Criar modelo ou prescrição |
| `/workouts` | GET | Listar modelos e treinos; filtrar por cliente ou nível |
| `/workouts/:id` | GET | Consultar treino com exercícios ordenados |

Cadastro de exercício:

```json
{ "name": "Agachamento livre" }
```

Modelo reutilizável:

```json
{
  "clientId": null,
  "title": "Básico - membros inferiores",
  "level": "BASIC",
  "exercises": [
    { "exerciseId": "UUID_DO_EXERCICIO", "sets": 3, "repetitions": "8-12", "restSeconds": 90 }
  ]
}
```

Para criar uma prescrição, envie o UUID do cliente. Para copiar outro treino,
envie também `sourcePlanId` e os exercícios que poderão ser ajustados na cópia.
Uma nova prescrição se torna a atual e arquiva a anterior sem apagá-la.
Repetições aceitam texto como `8-12` ou `AMRAP`; as séries aceitam 1–30 e o
descanso, quando informado, 0–3600 segundos. Um treino precisa ter ao menos um
exercício. As mutações exigem sessão e `X-CSRF-Token`.
