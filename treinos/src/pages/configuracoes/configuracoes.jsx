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
  const items = catalog[kind].filter((item) =>
    `${item.name} ${item.unit || ""}`.toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR"))
  );

  function handleSubmit(event) {
    event.preventDefault();
    const error = catalog.register(kind, { name, ...(withUnit ? { unit } : {}) });
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
        <button type="submit" className="button button-primary button-dark"><FiPlus aria-hidden="true" /> Cadastrar</button>
      </form>
      {message && <p className={`catalog-message ${message.error ? "catalog-error" : "catalog-success"}`} role={message.error ? "alert" : "status"}>{message.text}</p>}
      <label className="search-field catalog-search"><FiSearch aria-hidden="true" /><span className="sr-only">Buscar em {title}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Buscar ${title.toLocaleLowerCase("pt-BR")}...`} /></label>
      <div className="table-wrap"><table className="data-table"><thead><tr><th scope="col">Nome</th>{withUnit && <th scope="col">Unidade de medida</th>}</tr></thead>
        <tbody>{items.map((item) => <tr key={item.id}><td>{item.name}</td>{withUnit && <td>{item.unit}</td>}</tr>)}
          {!items.length && <tr><td colSpan={withUnit ? 2 : 1}>Nenhum cadastro encontrado.</td></tr>}
        </tbody></table></div>
    </section>
  );
}

export default function Configuracoes() {
  return (
    <main className="workspace settings-page">
      <header className="page-heading"><div><h1>Configurações</h1><p>Organize os exercícios e as medições usados nos atendimentos.</p></div></header>
      <p className="notice-banner">Os cadastros ficam salvos neste navegador nesta versão. A sincronização com o servidor será integrada ao back-end.</p>
      <CatalogSection kind="exercises" title="Exercícios" description="Cadastre os exercícios disponíveis para seleção." />
      <CatalogSection kind="measurements" title="Medições" description="Defina o que será medido e a unidade de cada medição." withUnit />
      <div className="settings-links"><Link className="button button-outline" to="/clientes/novaavaliacao">Abrir avaliação de demonstração</Link><Link className="button button-outline" to="/clientes/treinos">Abrir montagem de treino de demonstração</Link></div>
    </main>
  );
}
