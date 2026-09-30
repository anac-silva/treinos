import { FiArrowLeft, FiCamera } from "react-icons/fi";
import { NavLink } from "react-router-dom";

function NovoCliente() {
  return (
    <main className="workspace">
      <NavLink to="/clientes" className="back-link">
        <FiArrowLeft aria-hidden="true" /> Voltar para Clientes
      </NavLink>
      <header className="new-client-heading"><div><h1>Novo Cliente</h1><p>Preencha os dados para cadastrar um novo aluno.</p></div><div className="photo-upload"><FiCamera /><span>Adicionar foto</span></div></header>
      <form className="form-layout">
        <label className="field full-field">Nome completo <b>*</b><input placeholder="Ex: João da Silva" /></label>
        <label className="field">Idade <b>*</b><input placeholder="Ex: 25" /></label>
        <label className="field">Peso (kg) <b>*</b><input placeholder="Ex: 70" /></label>
        <label className="field">Altura (m) <b>*</b><input placeholder="Ex: 1,75" /></label>
        <label className="field span-two">E-mail<input placeholder="exemplo@email.com" /></label>
        <label className="field">Telefone<input placeholder="(00) 00000-0000" /></label>
        <label className="field span-two">Objetivo principal <b>*</b><select defaultValue=""><option value="" disabled>Selecione o objetivo</option><option>Emagrecimento</option><option>Hipertrofia</option><option>Condicionamento</option></select></label>
        <label className="field">Nível de experiência<select defaultValue=""><option value="" disabled>Selecione o nível</option><option>Iniciante</option><option>Intermediário</option><option>Avançado</option></select></label>
        <label className="field full-field">Observações<textarea placeholder="Informações adicionais sobre o aluno..." rows="4" /></label>
      </form>
      <footer className="form-actions"><button className="button button-outline">Cancelar</button><button className="button button-primary button-dark">Salvar cliente</button></footer>
    </main>
  );
}

export default NovoCliente;
