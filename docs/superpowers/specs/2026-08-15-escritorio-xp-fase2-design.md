# Escritorio XP — fase 2: el escritorio es el sitio

Fecha: 2026-08-15
Estado: aprobado en conversación.
Continúa: `2026-08-15-escritorio-xp-fase1-design.md` (§13, «fuera de alcance»).

## 1. Qué se construye

El escritorio pasa de maqueta en `/xp/` a **ser el sitio**. El portfolio entero
vive dentro de ventanas XP y la estética arcade desaparece del repositorio.

Decisiones del usuario, tomadas en conversación y todas contra la
recomendación por defecto en tres de los cuatro casos:

| Pregunta | Respuesta |
|---|---|
| ¿La raíz pasa a ser el escritorio? | Sí |
| ¿Sobreviven las páginas planas? | **No.** Todo vive en ventanas |
| ¿Sobrevive el comecocos? | **No.** Se borra con el arcade |
| ¿Cómo se abren las ventanas? | Desde dentro de la ventana de bienvenida, no con iconos |

## 2. Rutas

| Ruta | Antes | Después |
|---|---|---|
| `/` | portada arcade | **el escritorio**, indexable |
| `/xp/` | escritorio en obras | redirección a `/` |
| `/work/` | portada sin arranque | redirección a `/` |
| `/proyectos/` | índice | redirección a `/` |
| `/perfil/` | página | redirección a `/` |
| `/proyectos/<id>/` | página por proyecto | **desaparece** |
| `/404` | arcade | ventana de error XP |

Las redirecciones no son cortesía: `/work/` es la URL que está en el
currículum del usuario y `/proyectos/` lleva meses en el sitemap. Un 404 ahí
es una candidatura perdida. Se hacen con `redirects` de Astro, que en salida
estática genera una página con `meta refresh`.

`/proyectos/<id>/` sí muere sin red: hoy existe un solo proyecto y es este
mismo sitio.

El `noindex` de `XP.astro` **se quita**. Estaba porque el escritorio era
contenido en obras que no debía competir con la portada; ahora es la portada.

## 3. Las ventanas

Cinco tipos, todas renderizadas en el build (fase 1 §13: si el contenido lo
generase el JavaScript, un buscador vería un escritorio vacío).

| Ventana | Abre al arrancar | Contenido |
|---|---|---|
| Bienvenida | **sí** | quién es, contacto, y los accesos al resto |
| Proyectos | no | la lista; cada uno abre su propia ventana |
| Perfil | no | bio y *loadout*, lo que hoy está en `/perfil/` |
| Blog | no | las entradas seguidas, sin URL por entrada |
| Proyecto (una por `.md`) | no | el proyecto entero |

La bienvenida es el centro y no un adorno: el usuario descartó los iconos de
escritorio y el menú Inicio, así que **es la única puerta**. Si se queda sin
enlaces, el sitio se queda sin navegación.

### 3.1 Los accesos son anclas de verdad

Cada acceso es un `<a href="#ventana-perfil">` que apunta al `id` de la
ventana, no un `<button>`. Con JavaScript el gestor intercepta el clic y abre
la ventana; sin él, el ancla hace lo que hace un ancla. Es lo que permite el
§4 sin escribir una segunda navegación.

## 4. Móvil y sin JavaScript: la misma regla

Al morir las páginas planas, quien abra el sitio desde un teléfono **solo
tiene esto**. El escritorio no se maneja con el dedo, así que por debajo de
**720 px** deja de ser un escritorio:

- Las ventanas dejan de ser absolutas y se apilan en columna, todas abiertas.
- El cuerpo de cada ventana deja de tener scroll propio; scrollea la página.
- Se esconden los tres botones de la barra de título: en columna no significan
  nada, y un botón que no hace nada es peor que ninguno.
- No hay arrastre, y `touch-action: none` **no** se aplica — si se aplicara,
  arrastrar la barra de título bloquearía el scroll de la página.

**El modo apilado es la base y el escritorio es la mejora**, no al revés. Las
reglas del escritorio van dentro de `@media (min-width: 721px)` y colgando de
`html.js`, una clase que pone un script inline en el `<head>`. Consecuencia
buscada: sin JavaScript, cualquier pantalla cae en el modo apilado, que es
legible. Con el orden inverso harían falta dos copias de las mismas reglas.

## 5. Lo que se borra

`Base.astro`, `global.css`, `Nav`, `Footer`, `HomeContent`, `ProjectCard`,
`SectionTitle`, `Konami`, `Comecocos` con su laberinto y su test, y las cuatro
páginas. Del `package.json`: **Tailwind** y las dos `@fontsource` — el
escritorio es CSS con ámbito y la única fuente que se sirve es la del
arranque, que declara su propia `@font-face`.

Son ~1.900 líneas. La estética arcade no se aparca por si acaso: se borra. El
historial de git la conserva.

## 6. Lo que cambia en el gestor de ventanas

Sobre lo que ya existe (`Window.astro` + `windows.mjs`):

- **Cerrar oculta, no destruye.** Hoy hace `remove()`, que con una sola
  ventana que nunca se reabría era correcto. Con cinco no: una ventana
  destruida no se puede volver a abrir.
- **Clic en una ventana la sube al frente**, con un contador de `z-index`. La
  que está al frente lleva la barra de título a todo color y las demás
  atenuadas, que es como se distingue la activa en XP.
- **Cascada al abrir**: cada ventana nueva se coloca desplazada de la
  anterior. La aritmética se va a `windows.mjs`, que ya tiene tests, porque es
  justo el tipo de cálculo que se equivoca en silencio.
- **El botón de la barra de tareas aparece y desaparece** con la ventana.

## 7. Riesgos aceptados

- **La ventana de Proyectos tiene una sola entrada.** El resto del trabajo del
  usuario es privado y no se publica sin su permiso explícito. Para un sitio
  cuyo propósito declarado es buscar trabajo, es el agujero grande, y no lo
  tapa nada de este diseño.
- **Se pierden las URL profundas por proyecto** y el enlace directo a una
  entrada del blog. Decisión del usuario, tomada con el coste sobre la mesa.
- **El contenido de las ventanas cerradas está en el HTML pero oculto.** Un
  buscador lo ve; lo pondera menos que el visible. Es el precio de que todo
  viva en una sola página.

## 8. Verificación

| Qué | Cómo |
|---|---|
| Cascada y clamp | `windows.test.mjs`, con `node --test` |
| Abrir, cerrar, reabrir, subir al frente | En el navegador, midiendo `z-index` y `data-open` |
| Modo apilado | Ventana de 400 px de ancho: todas visibles, la página scrollea |
| Sin JavaScript | Con JS desactivado: sin arranque, todas las ventanas legibles |
| Las redirecciones | `curl` a `/work/`, `/xp/`, `/proyectos/`, `/perfil/` |
| No queda arcade | `grep` de `neon-`, `font-display`, `tailwind` en `src/` |
