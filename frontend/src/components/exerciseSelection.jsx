import { useId, useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { useCatalog } from "../contexts/catalogContext";

export default function ExerciseSelection({ prescription = false }) {
  const { exercises, register } = useCatalog();
  const suggestionsId = useId();
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState(null);
  const [items, setItems] = useState([]);
  const options = exercises.filter((exercise) => !items.some((item) => item.id === exercise.id));
  const normalize = (value) => value.trim().toLocaleLowerCase("pt-BR");
  const existingExercise = exercises.find(({ name }) => normalize(name) === normalize(query));
  const selectedExercise = options.find(({ name }) => normalize(name) === normalize(query));

  async function registerExercise() {
    const error = await register("exercises", { name: query });
    setMessage({ error: Boolean(error), text: error || "Exercício cadastrado em Configurações. Clique em Adicionar exercício para incluí-lo." });
  }

  function addExercise() {
    const exercise = selectedExercise;
    if (!exercise) return;
    setItems([...items, { ...exercise, sets: "", repetitions: "", rest: "" }]);
    setQuery("");
    setMessage(null);
  }

  function update(id, field, value) {
    setItems(items.map((item) => item.id === id ? { ...item, [field]: value } : item));
  }

  return <section className="exercise-selection" aria-label="Seleção de exercícios">
    <div className="exercise-title"><h3>Exercícios</h3></div>
    <div className="catalog-form"><label className="field">Selecionar exercício cadastrado
      <input list={suggestionsId} value={query} maxLength={100} autoComplete="off" placeholder="Comece a digitar o nome do exercício..." onChange={(event) => { setQuery(event.target.value); setMessage(null); }} />
      <datalist id={suggestionsId}>
        {options.map(({ id, name }) => <option key={id} value={name} />)}
      </datalist>
    </label><button type="button" disabled={!selectedExercise} className="button button-outline" onClick={addExercise}><FiPlus aria-hidden="true" /> Adicionar exercício</button>
      {query.trim() && !existingExercise && <button type="button" className="button button-primary button-dark" onClick={registerExercise}><FiPlus aria-hidden="true" /> Cadastrar exercício</button>}
    </div>
    {existingExercise && !selectedExercise && <p className="catalog-message" role="status">Esse exercício já está na seleção.</p>}
    {message && <p className={`catalog-message ${message.error ? "catalog-error" : "catalog-success"}`} role={message.error ? "alert" : "status"}>{message.text}</p>}
    {!items.length && <p className="catalog-empty">Nenhum exercício selecionado.</p>}
    <div className="table-wrap"><table className="data-table selected-exercises"><thead><tr><th scope="col">Exercício</th>{prescription && <><th scope="col">Séries</th><th scope="col">Repetições</th><th scope="col">Descanso (s)</th></>}<th scope="col">Ações</th></tr></thead>
      <tbody>{items.map((item) => <tr key={item.id}><td>{item.name}</td>{prescription && <>
        <td><input aria-label={`Séries de ${item.name}`} type="number" min="1" step="1" value={item.sets} onChange={(event) => update(item.id, "sets", event.target.value)} /></td>
        <td><input aria-label={`Repetições de ${item.name}`} value={item.repetitions} onChange={(event) => update(item.id, "repetitions", event.target.value)} /></td>
        <td><input aria-label={`Descanso de ${item.name} em segundos`} type="number" min="0" step="1" value={item.rest} onChange={(event) => update(item.id, "rest", event.target.value)} /></td>
      </>}<td><button type="button" className="icon-button" aria-label={`Remover ${item.name} da seleção`} onClick={() => setItems(items.filter(({ id }) => id !== item.id))}><FiTrash2 aria-hidden="true" /></button></td></tr>)}</tbody>
    </table></div>
  </section>;
}
