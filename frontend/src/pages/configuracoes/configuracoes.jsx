import LegacyCatalogImport from './legacyCatalogImport';
import AssessmentSettings from './assessmentSettings';
import { useState } from "react";
import { Link } from "react-router-dom";
import { FiPlus, FiSearch } from "react-icons/fi";
import { useCatalog } from "../../contexts/catalogContext";

function CatalogSection({ kind, title, description, withUnit = false }) {
  const catalog = useCatalog();
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  const items = catalog[kind].filter((item) =>
    `${item.name} ${item.unit || ""}`.toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR"))
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    const error = await catalog.register(kind, { name, ...(withUnit ? { unit } : {}) });
    setBusy(false);
    setMessage({ error: Boolean(error), text: error || "Cadastro salvo com sucesso." });
    if (!error) { setName(""); setUnit(""); }
  }

  return (
    <section className="settings-section" aria-labelledby={`${kind}-title`}>
      <div className="section-heading"><div><h2 id={`${kind}-title`}>{title}</h2><p>{description}</p></div><span className="settings-count">{catalog[kind].length} cadastrados</span></div>
      <form className="catalog-form" onSubmit={handleSubmit}>
        <label className="field">{withUnit ? "Nome da medição" : "Nome do exercício"}
          <input required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder={withUnit ? "Ex: Circunferência abdominal" : "Ex: Supino reto"} />
        </label>
        {withUnit && <label className="field catalog-unit">Unidade de medida
          <input required maxLength={20} value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="Ex: cm, kg, %, mm" />
        </label>}
        <button type="submit" disabled={busy} className="button button-primary button-dark"><FiPlus aria-hidden="true" /> {busy ? 'Salvando…' : 'Cadastrar'}</button>
      </form>
      {message && <p className={`catalog-message ${message.error ? "catalog-error" : "catalog-success"}`} role={message.error ? "alert" : "status"}>{message.text}</p>}
      <label className="search-field catalog-search"><FiSearch aria-hidden="true" /><span className="sr-only">Buscar em {title}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Buscar ${title.toLocaleLowerCase("pt-BR")}...`} /></label>
      {withUnit && catalog.loading && <p role="status">Carregando medições…</p>}
      {withUnit && catalog.error && <p role="alert">{catalog.error} <button type="button" onClick={catalog.reload}>Tentar novamente</button></p>}
      {!withUnit && catalog.exerciseLoading && <p role="status">Carregando exercícios…</p>}
      {!withUnit && catalog.exerciseError && <p role="alert">{catalog.exerciseError} <button type="button" onClick={catalog.reload}>Tentar novamente</button></p>}
      <div className="table-wrap"><table className="data-table"><thead><tr><th scope="col">Nome</th>{withUnit && <><th scope="col">Unidade de medida</th><th>Ações</th></>}</tr></thead>
        <tbody>{items.map((item) => <tr key={item.id}><td>{item.name}</td>{withUnit && <><td>{item.unit}</td><td><MeasurementActions item={item} /></td></>}</tr>)}
          {!items.length && <tr><td colSpan={withUnit ? 3 : 1}>Nenhum cadastro encontrado.</td></tr>}
        </tbody></table></div>
    </section>
  );
}

export default function Configuracoes() {
  return (
    <main className="workspace settings-page">
      <header className="page-heading"><div><h1>Configurações</h1><p>Organize os exercícios e as medições usados nos atendimentos.</p></div></header>
      <p className="notice-banner">Exercícios e medições são salvos no servidor e ficam disponíveis para os treinos e avaliações.</p>
      <LegacyCatalogImport />
      <AssessmentSettings />
      <CatalogSection kind="exercises" title="Exercícios" description="Cadastre os exercícios disponíveis para seleção nos treinos." />
      <CatalogSection kind="measurements" title="Medições" description="Defina o que será medido e a unidade de cada medição." withUnit />
      <div className="settings-links"><Link className="button button-outline" to="/clientes">Selecionar aluno para avaliação</Link></div>
    </main>
  );
}

function MeasurementActions({ item }) {
  const { updateMeasurement } = useCatalog();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save(body) {
    setBusy(true); setError('');
    try { await updateMeasurement(item.id, body); setEditing(false); } catch (error) { setError(error.message); } finally { setBusy(false); }
  }
  return <>{editing ? <form onSubmit={(event) => { event.preventDefault(); save(Object.fromEntries(new FormData(event.currentTarget))); }} className="catalog-form"><label className="field">Nome<input name="name" required maxLength={100} defaultValue={item.name} /></label><label className="field">Unidade<input name="unit" required maxLength={20} defaultValue={item.unit} /></label><button disabled={busy}>Salvar</button><button type="button" disabled={busy} onClick={() => setEditing(false)}>Cancelar</button></form> : <><button type="button" disabled={busy} onClick={() => setEditing(true)}>Editar</button> <button type="button" disabled={busy} onClick={() => save({ active: !item.active })}>{item.active ? 'Arquivar' : 'Reativar'}</button></>}{error && <p role="alert">{error}</p>}</>;
}
