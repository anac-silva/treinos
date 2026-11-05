import ClientTabs from "../../components/clientTabs";
import ExerciseSelection from "../../components/exerciseSelection";
import { FiCalendar, FiCopy, FiEdit2, FiMoreHorizontal, FiPlus } from "react-icons/fi";


function TreinosCliente() {
  return (
    <main className="workspace profile-workspace">
      <header className="client-profile compact-profile"><div className="avatar avatar-profile avatar-rose">MS</div><div><h1>Marina Silva</h1><p>28 anos <span>•</span> 1,65 m <span>•</span> 62 kg</p><div className="profile-tags"><span className="goal-tag">Emagrecimento</span><span className="status status-done">Ativo</span></div></div><button className="button button-outline profile-edit"><FiEdit2 /> Editar</button></header>
      <ClientTabs />
      <div className="section-heading training-heading"><h2>Treino atual</h2><button className="button button-primary button-dark"><FiPlus /> Novo treino</button></div>
      <section className="training-summary"><div className="training-icon"><FiCalendar /></div><div className="training-info"><h3>A - Membros Inferiores</h3><p>Hipertrofia <span>•</span> 4 exercícios <span>•</span> 3ª semana</p><small>Atualizado em 08/09/2026</small></div><div className="training-actions"><button className="button button-outline"><FiEdit2 /> Editar treino</button><button className="button button-outline"><FiCopy /> Duplicar treino</button></div><button className="icon-button"><FiMoreHorizontal /></button></section>
      <div className="notice-banner">Ao criar ou editar um treino, ele será definido como o treino atual do aluno. As versões anteriores ficam salvas no histórico.</div>
      <p className="notice-banner">Demonstração de montagem: a seleção de exercícios ainda não é salva como treino do cliente.</p>
      <section className="workout-form"><h2>Montar novo treino</h2><div className="form-layout workout-fields"><label className="field span-two">Nome do treino<input value="Treino A - Inferiores" readOnly /></label><label className="field span-two">Objetivo<select defaultValue="Hipertrofia"><option>Hipertrofia</option></select></label><div className="field full-field"><span className="field-title">Categoria</span><div className="choice-row"><div>Superior</div><div className="choice-selected">Inferior</div><div>Full body</div><div>Funcional</div></div></div></div>
        <ExerciseSelection prescription />
      </section>
    </main>
  );
}

export default TreinosCliente;