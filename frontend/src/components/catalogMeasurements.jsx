import { useCatalog } from "../contexts/catalogContext";

export default function CatalogMeasurements() {
  const { measurements } = useCatalog();
  return <div className="measure-list"><h3>Medições</h3>
    {measurements.map(({ id, name, unit }) => <label className="measure-field" key={id}>
      <span>{name} ({unit})</span><input type="number" step="any" min="0" name={`measurement-${id}`} placeholder="—" />
    </label>)}
    {!measurements.length && <p>Cadastre medições em Configurações.</p>}
  </div>;
}
