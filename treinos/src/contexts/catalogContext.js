import { createContext, useContext } from "react";

export const CatalogContext = createContext(null);

export function useCatalog() {
  const catalog = useContext(CatalogContext);
  if (!catalog) throw new Error("Catálogo indisponível fora do CatalogProvider.");
  return catalog;
}
