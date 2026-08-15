/**
 * Lo poco que comparten el índice de proyectos, cada ventana de proyecto y la
 * página que las monta.
 *
 * Existe por una razón concreta: el `id` de la ventana lo escribe `index.astro`
 * y lo enlaza `Proyectos.astro`. Si cada uno lo compone a su manera, el enlace
 * deja de abrir la ventana y **el build no falla** — se despliega roto. Con
 * una función, o coinciden los dos o no compila ninguno.
 */

/** El id de la ventana de un proyecto, a partir del nombre de su fichero. */
export const ventanaDe = (id) => `ventana-proyecto-${id}`;

/** Cómo se lee cada `status` del schema. */
export const ESTADO = {
  live: "En uso",
  wip: "En curso",
  archived: "Archivado",
};
