import ClientTabs from "../../components/clientTabs";
import CatalogMeasurements from "../../components/catalogMeasurements";
import ExerciseSelection from "../../components/exerciseSelection";
import { FiCalendar, FiEdit2 } from "react-icons/fi";


function MedidasCliente() {
  return (
    <main className="workspace profile-workspace">
      <header className="client-profile compact-profile"><div className="avatar avatar-profile avatar-rose">MS</div><div><h1>Marina Silva</h1><p>28 anos <span>•</span> 1,65 m <span>•</span> 62 kg</p><div className="profile-tags"><span className="goal-tag">Emagrecimento</span><span className="status status-done">Ativo</span></div></div><button className="button button-outline profile-edit"><FiEdit2 /> Editar</button></header>
      <ClientTabs />
      <p className="notice-banner">Demonstração de avaliação: o perfil ainda é ilustrativo e os valores preenchidos não são salvos nesta etapa.</p>
      <section className="measurement-page"><div className="measurement-heading"><div><h2>Nova Avaliação de Medidas</h2><p>Registre as medidas corporais do aluno.</p></div><label className="field date-field">Data da avaliação<div className="input-with-icon"><input type="date" aria-label="Data da avaliação" /><FiCalendar /></div></label></div>
        <div className="measurement-content"><div className="body-figure"><div className="figure-person"><i className="figure-head"></i><i className="figure-torso"></i><i className="figure-arm arm-left"></i><i className="figure-arm arm-right"></i><i className="figure-leg leg-left"></i><i className="figure-leg leg-right"></i><i className="measure-mark mark-shoulder"></i><i className="measure-mark mark-chest"></i><i className="measure-mark mark-waist"></i><i className="measure-mark mark-hip"></i><i className="measure-mark mark-thigh"></i><i className="measure-mark mark-calf"></i></div><div className="figure-person figure-back"><i className="figure-head"></i><i className="figure-torso"></i><i className="figure-arm arm-left"></i><i className="figure-arm arm-right"></i><i className="figure-leg leg-left"></i><i className="figure-leg leg-right"></i></div></div>
          <CatalogMeasurements /></div>
        <ExerciseSelection />
        <details className="observations"><summary>Observações</summary><p>Registro de avaliação física.</p></details><footer className="form-actions"><button className="button button-outline">Cancelar</button><button className="button button-primary button-dark">Salvar medidas</button></footer>
      </section>
    </main>
  );
}

export default MedidasCliente;
