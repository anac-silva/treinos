# Fichas e modelos de treino

A ficha reúne os treinos A, B, C… de um cliente. A letra é definida pela ordem
do bloco na ficha, independentemente do nome do modelo de referência.

## Biblioteca

Em **Modelos de treino → Modelos de blocos**, cadastre nome, nível, foco livre
e exercícios. A busca combina nome, foco e nível. É possível editar um modelo
ou duplicá-lo para criar variações. Os ajustes no modelo não alteram fichas
já prescritas.

Em **Fichas completas**, crie um modelo combinando vários blocos ou copie uma
ficha existente. Também é possível salvar uma ficha de cliente como modelo.

## Cliente

Na aba **Treinos**, clique em **Nova ficha** para começar do zero ou em
**Copiar ficha completa** para usar um modelo, uma ficha de outro cliente ou
uma versão anterior. Ao copiar, todos os blocos e exercícios são independentes.

Adicione blocos vazios ou escolha modelos diferentes para cada bloco. Nas abas
A, B, C…, ajuste nome, foco, nível, orientações, exercícios, séries, repetições,
descanso e observações. As setas reordenam os blocos e exercícios. **Substituir
por modelo** troca somente o bloco aberto. Cada ficha admite de 1 a 26 blocos,
com pelo menos um exercício em cada bloco.

**Salvar ficha e definir como atual** ativa a ficha inteira e arquiva a ficha
anterior. **Ajustar ficha** parte da ficha atual e salva uma nova versão; o
histórico conserva os dados originais. O histórico fica recolhido para reduzir
a altura da tela.

## Dados existentes e validação

A migração transforma cada treino antigo de cliente em uma ficha de um bloco,
preservando exercícios, datas e estado atual/histórico. Os modelos antigos
continuam disponíveis como modelos de blocos.

Os endpoints de fichas são `GET/POST /workout-sheets` e
`GET /workout-sheets/:id`. O endpoint anterior de criação de treino de cliente
continua compatível e cria uma ficha com um bloco. A exclusividade da ficha
atual é protegida no PostgreSQL; o salvamento de blocos é transacional.

Os testes HTTP verificam cópias independentes, edição de modelos, histórico,
validação de todos os blocos e salvamentos concorrentes. Os testes do front
verificam cópia, reordenação e filtros. O script manual
`frontend/scripts/review-workout-ui.mjs` testa o fluxo no Chrome com respostas
de API simuladas, sem alterar dados reais.
