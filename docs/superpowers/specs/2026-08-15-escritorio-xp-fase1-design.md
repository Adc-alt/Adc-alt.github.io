# Escritorio XP — fase 1: fondo y barra de tareas

Fecha: 2026-08-15
Estado: aprobado en conversación, pendiente de plan de implementación.

## 1. Qué se construye

Un escritorio **inerte** que aparece después de la pantalla de arranque: fondo
de pantalla y barra de tareas al estilo Windows XP (tema Luna). Nada más.

Explícitamente **fuera** de esta fase:

- Iconos en el escritorio.
- Menú Inicio. El botón `start` se pinta y se hunde al pulsarlo, pero no abre nada.
- Ventanas.
- Diseño para móvil.

## 2. Por qué existe esta fase por separado

El objetivo final, decidido por el usuario, es que **el escritorio XP sustituya
al sitio**: el portfolio pasará a vivir dentro de ventanas XP y la estética
arcade actual (Press Start 2P, ámbar, capas de CRT, comecocos) desaparecerá.

Esta fase construye el caparazón sobre el que se montará eso. No es una
maqueta de usar y tirar: `XP.astro` es el layout definitivo y las ventanas se
le añadirán dentro.

## 3. Restricción de propiedad intelectual

**No se copia ni se sirve ningún fichero de terceros.**

- El fondo de Windows XP es una fotografía con dueño. El nuestro se **dibuja**:
  SVG en línea, obra propia.
- `winbows.neocities.org` sirve su fondo como `/resources/bg.jpg` y sus iconos
  como PNG. Nada de eso se descarga ni se enlaza.
- De la barra se copian **medidas y colores**, que son hechos, no obra. El CSS
  se escribe aquí desde cero.
- No se usa el logotipo de Windows. Fue una petición explícita del usuario y
  además es la pieza con más carga de marca registrada.

Es la misma disciplina que se siguió con la pantalla de arranque: se calca la
maqueta, no se sirven sus bytes.

## 4. Medidas de la referencia

Tomadas muestreando dos capturas públicas de Windows XP con Luna, con Pillow.
Las capturas se borraron después de extraer los números; no hay ninguna imagen
de terceros en el repositorio.

### 4.1 Perfil vertical de la barra (resolución nativa)

Muestreado en una columna **vacía** de la barra — sin botón, sin texto — de una
tira de 800x24. La primera búsqueda de columna falló porque el criterio
«columna más plana» encuentra el *interior* de un botón, no la barra vacía; el
criterio correcto es «ninguna fila clara ni oscura», que dio 452 columnas.

| Fila | Color | Papel |
|---|---|---|
| 1 | `#3e8ce8` | primer filo claro |
| 3 | `#458ef3` | banda alta |
| 4 | `#478bf6` | punto más claro |
| 5-20 | `#3980f4` | cuerpo, prácticamente plano |
| 21 | `#2d64d8` | empieza a oscurecer |
| 22 | `#2151c1` | |
| 23 | `#1a43a9` | filo inferior |

La lectura importante: **la barra no es un degradado suave de arriba abajo.**
Es un filo claro, un cuerpo casi plano de dieciséis filas, y tres filas que
oscurecen de golpe al final. Un `linear-gradient` de dos paradas queda mal.

### 4.2 Alto de la barra y botón de Inicio

De una captura de escritorio de 640x480, que está reducida 2:1:

- Barra: 14-15 filas → **28-30 px nativos**. Se fija en **30 px**, que es el
  valor por defecto de XP a 96 ppp y es coherente con la medida.
- Botón de Inicio: 47x14 en la captura → **~94x28 px nativos**.
- Verde del botón: de `#1d861d` (borde) a `#259e25` (cuerpo).
- Cuerpo de la barra en esta captura: **`#245edc`**.

### 4.3 La bandeja del sistema

Barriendo la barra de derecha a izquierda en la misma captura:

- La bandeja empieza a **~50 px del borde derecho** → ~100 px nativos.
- Su borde izquierdo es una línea oscura, `#3770a8`, más oscura que la barra:
  es el filo que la hace parecer hundida.
- Su cuerpo es **más claro y más cian que la barra**: `#1290e9`, bajando a
  `#0f6ed1` en la última fila.

Que la bandeja sea *más clara* que la barra, y no más oscura, es lo que hay
que copiar. La sensación de hundido la da el filo, no el relleno.

### 4.4 Discrepancia, y un error mío al medir

La tira nativa daba un cuerpo de `#3980f4` y la captura de escritorio da
`#245edc`. Al medir la bandeja se ve de dónde salía parte de la confusión: la
**primera** columna que muestreé de la tira no estaba en la barra vacía, estaba
dentro de la zona de bandeja, que es otro azul. Ese primer dato estaba mal.

Aun corregido, las dos capturas no coinciden: son de procedencia distinta.
Se resuelve así:

- **El color lo manda la captura de escritorio**: cuerpo `#245edc`. Es la vista
  completa y coincide con el azul de barra de XP más documentado.
- **La estructura la manda la tira nativa**: filo claro arriba, cuerpo casi
  plano, y tres filas que oscurecen de golpe al final. Es el único perfil
  nativo y limpio que hay.

Durante la implementación se comprueba con sonda en positivo — se renderiza
nuestra barra, se muestrea una columna vacía y se compara el perfil fila a
fila. La sonda tiene que fallar contra una barra mal pintada, no sólo aprobar
la nuestra.

### 4.5 Cómo es la barra de winbows, y por qué no se copia

La referencia que dio el usuario es una simplificación plana: 35 px, azul liso
`#0055EA` con una sola línea interior más clara, y un botón de Inicio que es un
rectángulo verde de 100 px en Tahoma negrita cursiva. No tiene degradado ni
esquina redondeada.

Preguntado, el usuario eligió **la barra de XP de verdad**. Se documenta aquí
la barra de winbows sólo para dejar constancia de que la desviación respecto a
«tal como está» es deliberada y consultada.

## 5. Arquitectura

### 5.1 Rutas

| Ruta | Antes | Después de esta fase |
|---|---|---|
| `/` | portada arcade con arranque | **sin cambios** |
| `/xp/` | no existe | escritorio, `noindex`, fuera del sitemap |

`/` no se toca en esta fase. Un escritorio sin ventanas es un callejón sin
salida, y el portfolio es la herramienta de búsqueda de trabajo del usuario:
entre esta fase y la siguiente, la raíz tiene que seguir llevando a algún
sitio. La raíz pasa a ser el escritorio el día que existan las ventanas.

`/xp/` lleva `noindex` por la misma razón que `/work/`: es contenido en obras y
no debe competir en Google con el sitio real.

### 5.2 Ficheros

| Fichero | Qué es |
|---|---|
| `src/layouts/XP.astro` | Layout nuevo. `<head>`, el fondo y la barra. **Definitivo**, no andamio. |
| `src/components/xp/Taskbar.astro` | La barra: `start`, zona de ventanas (vacía), bandeja. |
| `src/components/xp/Wallpaper.astro` | El SVG del fondo. |
| `src/components/xp/clock.mjs` | Formateo de la hora. Módulo suelto para poder testearlo. |
| `src/components/xp/clock.test.mjs` | Su test. |
| `src/pages/xp.astro` | La página. Usa `XP.astro` y reutiliza `Boot.astro`. |

`XP.astro` **no** importa `global.css` ni las fuentes arcade. El escritorio
tiene su propio sistema y no debe arrastrar el del sitio viejo.

La carpeta `src/components/xp/` existe para que la fase 2 tenga dónde poner el
gestor de ventanas sin ensuciar `src/components/`.

## 6. El fondo

SVG en línea dentro de `Wallpaper.astro`: degradado de cielo de arriba abajo,
una colina como `path`, y nubes. Obra propia, evocando el paisaje sin copiar la
fotografía.

- **En línea, no como fichero.** Sin petición HTTP y sin destello inicial.
- `preserveAspectRatio="xMidYMid slice"` para que llene cualquier proporción
  igual que un fondo de pantalla, recortando en vez de deformar.
- Color de reserva sólido en el `<body>` por debajo, por si el SVG falla.
- `aria-hidden="true"`. Es decoración.

## 7. La barra

Tres zonas en una fila, igual que XP:

```
[ start ] [ ventanas abiertas — vacío en fase 1 ] [ bandeja: reloj ]
```

- Alto **30 px**, fija abajo, ancho completo.
- Fondo: cuerpo `#245edc` (§4.2) con la estructura de §4.1 — filo claro arriba,
  cuerpo casi plano en la mayor parte del alto, y tres píxeles que oscurecen de
  golpe al final. Un `linear-gradient` con paradas en porcentaje, no de dos
  colores.
- Botón `start`: **94x28**, verde `#1d861d`→`#259e25`, texto blanco en Tahoma
  con sombra. Al pulsar, se hunde: no hace nada más.
- Bandeja: **100 px** de ancho, cuerpo `#1290e9` — *más claro* que la barra —,
  con el filo izquierdo oscuro `#3770a8` que es lo que la hunde. El reloj
  dentro.
- La zona de ventanas queda vacía y **no se dibuja** en fase 1.

**El radio del botón no está medido.** A escala 1:2 los píxeles de la esquina
se mezclan con el azul y el criterio que detecta verde los descarta, así que la
medida que sale (2-4 px) subestima el redondeo real. Se fija **8 px sólo en las
dos esquinas derechas** como valor de partida y se ajusta mirando una captura
nativa durante la implementación. Es el único número de esta spec que no viene
de una medida limpia, y queda señalado a propósito: en el trabajo del arranque,
el único color puesto a ojo fue justo el que la revisión tumbó.

## 8. La entrada

Encadenada con la pantalla de arranque, que ya existe y no se toca:

1. El arranque se apaga con su barrido de CRT (300 ms, ya implementado).
2. Aparece el fondo.
3. **400 ms después**, la barra sube deslizándose desde abajo.

El desfase del paso 3 es el detalle que vende la escena: si la barra aparece a
la vez que el fondo, parece una imagen; si sube después, parece un arranque.

Todo detrás de `prefers-reduced-motion`: con la preferencia activada, fondo y
barra aparecen ya colocados, sin deslizamiento.

## 9. El reloj

- Hora real del navegador, formato `HH:MM` en 24 h.
- Se actualiza al cambiar de minuto, no cada segundo.
- **Es la única lógica de la fase**, y por eso es lo único con test:
  `clock.mjs` exporta una función pura `formatTime(date)` y `clock.test.mjs`
  la fija con `node:test`. El resto de la fase es CSS y se comprueba mirándola.

Con JavaScript desactivado la bandeja queda vacía, y eso es aceptable: es
adorno, no contenido.

## 10. Accesibilidad

- El fondo y los adornos de la barra van con `aria-hidden`.
- `start` es un `<button>` de verdad, enfocable, con foco visible.
- El reloj va en un `<time>` con `datetime`, así que un lector de pantalla lo
  recibe exacto y no depende del contraste.

### 10.1 Los colores de XP no llegan a AA, y hay que decidirlo

Contraste calculado sobre los colores medidos, no estimado:

| Texto | Sobre | Ratio | AA normal (4.5:1) | AA grande (3:1) |
|---|---|---|---|---|
| blanco | verde `#259e25` | **3.50:1** | ✗ | ✓ |
| blanco | bandeja `#1290e9` | **3.39:1** | ✗ | ✓ |

No es un defecto de la implementación: la interfaz de 2001 se diseñó antes de
que esto se midiera así. Para que el blanco pasara AA habría que bajar la
luminancia de ambos alrededor de un 30 %, y a esa altura ya no es el azul de
XP ni el verde de XP.

**Recomendación: quedarse con los colores de XP y dejarlo documentado.** Es un
homenaje a una interfaz concreta, la información del reloj llega íntegra por el
`<time datetime>`, y ambos colores sí cumplen AA para texto grande.

**Esto es una decisión del usuario, no mía.** Queda registrada aquí porque
degrada la accesibilidad respecto al sitio actual, que sí cumple. Si prefiere
cumplir AA, se oscurecen los dos colores hasta luminancia ≤ 0.1833 y se pierde
parecido; la spec no elige por él.

## 11. Verificación

| Qué | Cómo |
|---|---|
| Formato de la hora | `clock.test.mjs`, con `node --test` |
| Perfil de la barra | Renderizar, muestrear la columna vacía, comparar fila a fila con §4.1 |
| Alto y botón | Medir en el navegador: 30 px y ~94x28 |
| Contraste | Calcular sobre los colores finales, no estimar |
| Sin ficheros ajenos | `git diff` no añade ninguna imagen; `grep` no encuentra `neocities` ni `bg.jpg` |
| Movimiento reducido | Con la preferencia activada no hay deslizamiento |
| El sitio sigue vivo | `/` y `/work/` renderizan igual que antes |

La comprobación del perfil necesita **sonda en positivo**: hay que verificar
que el método detecta una barra mal pintada, no sólo que aprueba la nuestra.

## 12. Desviaciones deliberadas respecto a la referencia

| Desviación | Por qué |
|---|---|
| Luna real en vez de la barra plana de winbows | Elección del usuario, preguntada expresamente |
| `start` en inglés, no «inicio» | Elección del usuario; coherente con el arranque, que ya está en inglés |
| Sin logotipo | Petición explícita del usuario |
| Fondo dibujado, no fotografía | §3 |
| Vive en `/xp/`, no en `/` | §5.1 |

## 13. Fuera de alcance — la fase 2

Se apunta para que el diseño de arriba no la impida, no para hacerla ahora:

- Ventanas XP con el contenido del portfolio dentro.
- **Las ventanas se renderizan en el build como HTML normal**, y el JavaScript
  sólo las arrastra, minimiza y cierra. Decidido ya, y hay que decidirlo ya:
  si el JavaScript generase el contenido, un buscador vería un escritorio
  vacío, y rehacerlo después sería reescribir las ventanas enteras.
- Iconos en el escritorio y menú Inicio.
- Botones de ventana en la barra.
- Diseño para móvil, aplazado por el usuario.
- Mover el escritorio a `/` y retirar la estética arcade.
