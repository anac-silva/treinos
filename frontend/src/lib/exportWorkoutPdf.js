const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const date = (value) => value ? value.slice(0, 10).split('-').reverse().join('/') : 'Não agendada';

export function exportWorkoutPdf(sheet) {
  const frame = document.createElement('iframe');
  frame.title = 'Exportar ficha de treino em PDF';
  frame.style.cssText = 'position:fixed;width:0;height:0;border:0;';
  frame.onload = () => {
    frame.contentWindow.addEventListener('afterprint', () => frame.remove(), { once: true });
    frame.contentWindow.focus();
    frame.contentWindow.print();
  };
  frame.srcdoc = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escape(sheet.title)}</title><style>
    @page{size:A4;margin:16mm}body{font:12px Arial,sans-serif;color:#292029}h1{color:#650e28;font-size:24px;margin-bottom:6px}h2{font-size:16px;color:#650e28;margin:20px 0 8px}p{line-height:1.5}table{width:100%;border-collapse:collapse}th,td{padding:8px 6px;text-align:left;border-bottom:1px solid #ddd}th{background:#f6edf0}tr{break-inside:avoid}thead{display:table-header-group}.notes{white-space:pre-wrap}footer{margin-top:20px;color:#777;font-size:10px}
    </style></head><body><h1>${escape(sheet.title)}</h1>${sheet.client ? `<p><strong>Aluno:</strong> ${escape(sheet.client.name)}</p>` : '<p>Modelo de treino</p>'}<p><strong>Criado em:</strong> ${date(sheet.createdAt)} · <strong>Válido até:</strong> ${sheet.client ? date(sheet.client.assessments?.[0]?.nextAssessmentOn) : 'Definido ao atribuir ao aluno'}</p>${sheet.notes ? `<p class="notes">${escape(sheet.notes)}</p>` : ''}
    ${sheet.blocks.map((block, index) => `<section><h2>Treino ${String.fromCharCode(65 + index)} — ${escape(block.title)}</h2>${block.notes ? `<p class="notes">${escape(block.notes)}</p>` : ''}<table><thead><tr><th>Exercício</th><th>Séries</th><th>Repetições</th><th>Descanso</th><th>Observações</th></tr></thead><tbody>${block.exercises.map((item) => `<tr><td>${escape(item.exercise.name)}</td><td>${escape(item.sets)}</td><td>${escape(item.repetitions)}</td><td>${item.restSeconds == null ? '—' : escape(item.restSeconds) + ' s'}</td><td>${escape(item.notes)}</td></tr>`).join('')}</tbody></table></section>`).join('')}<footer>Ficha de treino · Treinos</footer></body></html>`;
  document.body.appendChild(frame);
}
