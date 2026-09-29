import { FiCalendar, FiCopy, FiEdit2, FiMoreHorizontal, FiPlus, FiTrash2 } from "react-icons/fi";

const exercises = [["1", "Agachamento Hack", "4", "12", "60s"], ["2", "Leg Press", "4", "12", "60s"], ["3", "Cadeira extensora", "3", "15", "45s"], ["4", "Mesa flexora", "3", "12", "45s"]];

function TreinosCliente() {
  return (
    <main className="workspace profile-workspace">
      <header className="client-profile compact-profile"><div className="avatar avatar-profile avatar-rose">MS</div><div><h1>Marina Silva</h1><p>28 anos <span>•</span> 1,65 m <span>•</span> 62 kg</p><div className="profile-tags"><span className="goal-tag">Emagrecimento</span><span className="status status-done">Ativo</span></div></div><button className="button button-outline profile-edit"><FiEdit2 /> Editar</button></header>
      <nav className="profile-tabs"><div className="profile-tab">Visão geral</div><div className="profile-tab">Medidas</div><div className="profile-tab selected">Treinos</div><div className="profile-tab">Histórico</div></nav>
      <div className="section-heading training-heading"><h2>Treino atual</h2><button className="button button-primary button-dark"><FiPlus /> Novo treino</button></div>
      <section className="training-summary"><div className="training-icon"><FiCalendar /></div><div className="training-info"><h3>A - Membros Inferiores</h3><p>Hipertrofia <span>•</span> 4 exercícios <span>•</span> 3ª semana</p><small>Atualizado em 08/09/2026</small></div><div className="training-actions"><button className="button button-outline"><FiEdit2 /> Editar treino</button><button className="button button-outline"><FiCopy /> Duplicar treino</button></div><button className="icon-button"><FiMoreHorizontal /></button></section>
      <div className="notice-banner">Ao criar ou editar um treino, ele será definido como o treino atual do aluno. As versões anteriores ficam salvas no histórico.</div>
      <section className="workout-form"><h2>Montar novo treino</h2><div className="form-layout workout-fields"><label className="field span-two">Nome do treino<input value="Treino A - Inferiores" readOnly /></label><label className="field span-two">Objetivo<select defaultValue="Hipertrofia"><option>Hipertrofia</option></select></label><div className="field full-field"><span className="field-title">Categoria</span><div className="choice-row"><div>Superior</div><div className="choice-selected">Inferior</div><div>Full body</div><div>Funcional</div></div></div></div>
        <div className="exercise-title"><h3>Exercícios</h3><button className="button button-outline"><FiPlus /> Adicionar exercício</button></div><div className="exercise-table"><div className="exercise-row exercise-head"><span>#</span><span>Exercício</span><span>Séries</span><span>Repetições</span><span>Descanso</span><span></span></div>{exercises.map(([number, name, sets, reps, rest]) => <div className="exercise-row" key={number}><span>{number}</span><strong>{name}</strong><input value={sets} readOnly /><input value={reps} readOnly /><input value={rest} readOnly /><button className="icon-button"><FiTrash2 /></button></div>)}</div>
      </section>
    </main>
  );
}

export default TreinosCliente;