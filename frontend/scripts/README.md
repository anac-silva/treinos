# Verificação das telas no navegador

Os scripts usam Chrome instalado, uma instância de teste isolada na porta 9239 e Vite na porta 5189. Não instalam navegador. As APIs são simuladas nos testes de telas, sem alterar alunos reais.

Inicie o frontend com `npm run dev -- --host 127.0.0.1 --port 5189`. Abra o Chrome em um perfil temporário com `--remote-debugging-port=9239` e uma aba vazia; não use seu perfil pessoal.

Execute a partir da raiz do repositório, um de cada vez:

```powershell
node frontend/scripts/review-workout-ui.mjs
node frontend/scripts/review-resource-ui.mjs
node frontend/scripts/review-agenda-ui.mjs
```

- Treinos: montar, copiar, substituir bloco, preservar modelos, salvar ficha como modelo e verificar largura em desktop e celular.
- Consultas: mudar recurso, ignorar resposta antiga, recarregar e exibir erros. `resourceHarness.html` e `resourceHarness.jsx` são entradas exclusivas do servidor de desenvolvimento e não integram o build da aplicação.
- Agenda: meses com quatro, cinco e seis semanas em desktop, tela baixa e celular; erro dentro do modal; edição em navegador com fuso de Tóquio preservando o horário de São Paulo.

Os scripts imprimem o resultado e, quando aplicável, os caminhos das capturas na pasta temporária. Encerre a instância de Chrome e o Vite criados para teste após a execução.
