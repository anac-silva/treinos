import { FiCalendar, FiChevronDown } from "react-icons/fi";

const fields = [["Peso (kg)", "62,0"], ["Ombro", "110"], ["Peito", "95"], ["Cintura", "70"], ["Quadril", "98"], ["Braço (dir.)", "32"], ["Braço (esq.)", "32"], ["Coxa (dir.)", "58"], ["Coxa (esq.)", "58"], ["Panturrilha (dir.)", "36"], ["Panturrilha (esq.)", "35"]];

function NovaAvaliacao() {
  return (
    <main className="workspace profile-workspace">
      <header className="client-profile compact-profile"><div className="avatar avatar-profile avatar-rose">MS</div><div><h1>Marina Silva</h1><p>28 anos <span>•</span> 1,65 m <span>•</span> 62 kg</p></div><button className="button button-outline profile-edit">Editar</button></header>
      <nav className="profile-tabs"><div className="profile-tab selected">Avaliação</div><div className="profile-tab">Medidas</div><div className="profile-tab">Treinos</div><div className="profile-tab">Histórico</div></nav>
      <section className="measurement-page"><div className="measurement-heading"><div><h2>Nova Avaliação de Medidas</h2><p>Registre as medidas corporais do aluno.</p></div><label className="field date-field">Data da avaliação<div className="input-with-icon"><input value="15/09/2026" readOnly /><FiCalendar /></div></label></div>
        <div className="measurement-content"><div className="body-figure"><div className="figure-person"><i className="figure-head"></i><i className="figure-torso"></i><i className="figure-arm arm-left"></i><i className="figure-arm arm-right"></i><i className="figure-leg leg-left"></i><i className="figure-leg leg-right"></i><i className="measure-mark mark-shoulder"></i><i className="measure-mark mark-chest"></i><i className="measure-mark mark-waist"></i><i className="measure-mark mark-hip"></i><i className="measure-mark mark-thigh"></i><i className="measure-mark mark-calf"></i></div><div className="figure-person figure-back"><i className="figure-head"></i><i className="figure-torso"></i><i className="figure-arm arm-left"></i><i className="figure-arm arm-right"></i><i className="figure-leg leg-left"></i><i className="figure-leg leg-right"></i></div></div>
          <div className="measure-list"><h3>Medidas <span>(cm / kg)</span></h3>{fields.map(([name, value]) => <label className="measure-field" key={name}><span>{name}</span><input value={value} readOnly /></label>)}</div></div>
        <details className="observations"><summary><span>Observações</span><FiChevronDown /></summary><p>Registro de avaliação física.</p></details><footer className="form-actions"><button className="button button-outline">Cancelar</button><button className="button button-primary button-dark">Salvar medidas</button></footer>
      </section>
    </main>
  );
}

export default NovaAvaliacao;