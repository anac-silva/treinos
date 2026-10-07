import { useState } from "react";
import { CatalogContext } from "./catalogContext";

const STORAGE_KEY = "personal-trainer.catalog.v1";
const defaults = {
  exercises: ["Agachamento Hack", "Leg Press", "Cadeira extensora", "Mesa flexora"]
    .map((name, index) => ({ id: `exercise-${index + 1}`, name })),
  measurements: [
    ["Peso", "kg"], ["Ombro", "cm"], ["Peito", "cm"], ["Cintura", "cm"],
    ["Quadril", "cm"], ["Braço (dir.)", "cm"], ["Braço (esq.)", "cm"],
    ["Coxa (dir.)", "cm"], ["Coxa (esq.)", "cm"],
    ["Panturrilha (dir.)", "cm"], ["Panturrilha (esq.)", "cm"],
  ].map(([name, unit], index) => ({ id: `measurement-${index + 1}`, name, unit })),
};

function validEntries(entries, withUnit = false) {
  return Array.isArray(entries) && entries.every((item) =>
    item && typeof item.id === "string" && typeof item.name === "string" &&
    item.name.trim() && (!withUnit || (typeof item.unit === "string" && item.unit.trim()))
  ) && new Set(entries.map(({ id }) => id)).size === entries.length;
}

function loadCatalog() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaults;
    const parsed = JSON.parse(stored);
    if (validEntries(parsed.exercises) && validEntries(parsed.measurements, true)) return parsed;
  } catch { /* O catálogo padrão permite usar a tela quando o storage não está disponível. */ }
  return defaults;
}

export default function CatalogProvider({ children }) {
  const [catalog, setCatalog] = useState(loadCatalog);

  function register(kind, values) {
    const name = values.name.trim();
    const unit = values.unit?.trim();
    if (!name || name.length > 100) return "Informe um nome de até 100 caracteres.";
    if (kind === "measurements" && (!unit || unit.length > 20)) return "Informe uma unidade de até 20 caracteres.";
    if (catalog[kind].some((item) => item.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"))) {
      return "Já existe um cadastro com esse nome.";
    }
    const entry = { id: crypto.randomUUID(), name, ...(unit ? { unit } : {}) };
    const next = { ...catalog, [kind]: [...catalog[kind], entry] };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      return "Não foi possível salvar neste navegador. Verifique se o armazenamento está disponível.";
    }
    setCatalog(next);
    return null;
  }

  return <CatalogContext.Provider value={{ ...catalog, register }}>{children}</CatalogContext.Provider>;
}
