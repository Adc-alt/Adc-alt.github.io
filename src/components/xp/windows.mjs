/**
 * La aritmética de arrastrar una ventana. Sin DOM a propósito: el manejo de
 * eventos vive en el <script> de Window.astro, y aquí solo está lo que se
 * puede equivocar en silencio y por tanto merece test.
 */

/**
 * Cuánto de la ventana tiene que quedar SIEMPRE dentro del escritorio, en px.
 *
 * No es un margen estético: es lo que impide que la barra de título se vaya
 * detrás de la barra de tareas o fuera de la pantalla y la ventana se quede
 * inarrastrable para siempre, que es el fallo clásico de un gestor de
 * ventanas casero. Windows hace lo mismo.
 *
 * Por qué 110 y no 60, que es lo que parece suficiente: los tres botones
 * (minimizar, maximizar, cerrar) ocupan unos 70px en el extremo DERECHO de la
 * barra de título. Al empujar la ventana hacia la izquierda, lo que queda
 * asomando es ese extremo — o sea, solo botones. Con 60 el asa que queda no
 * es un asa: es un botón de cerrar. Con 110 quedan unos 40px de barra de
 * título de verdad, que sí se puede agarrar.
 */
export const KEEP_VISIBLE = 110;

/**
 * Encaja una posición propuesta dentro del escritorio.
 *
 * @param {{x:number,y:number,w:number,h:number}} win  posición propuesta y tamaño
 * @param {{vw:number,vh:number,barH:number}} desk     hueco disponible
 * @returns {{x:number,y:number}} la posición ya corregida
 */
export function clampPosition(win, desk) {
  const { x, y, w } = win;
  const { vw, vh, barH } = desk;

  // El alto útil termina donde empieza la barra de tareas.
  const bottom = vh - barH;

  // A la izquierda puede salirse casi entera, pero no del todo: si el borde
  // derecho cruza KEEP_VISIBLE queda un asa para traerla de vuelta.
  const minX = KEEP_VISIBLE - w;
  const maxX = vw - KEEP_VISIBLE;

  // Arriba no se sale nada: en Windows la barra de título no pasa del borde
  // superior. Abajo el tope es la barra de tareas, no el alto de la ventana:
  // una ventana más alta que la pantalla se arrastra igual.
  const maxY = bottom - KEEP_VISIBLE;

  return {
    x: Math.min(Math.max(x, minX), maxX),
    y: Math.min(Math.max(y, 0), Math.max(maxY, 0)),
  };
}

/**
 * Posición inicial: centrada en horizontal y algo por encima del centro en
 * vertical, que es donde Windows abre una ventana nueva. Pasa por el mismo
 * clamp que el arrastre, así que en una pantalla pequeña ya sale encajada.
 */
export function initialPosition(win, desk) {
  const bottom = desk.vh - desk.barH;
  return clampPosition(
    {
      ...win,
      x: Math.round((desk.vw - win.w) / 2),
      y: Math.round((bottom - win.h) * 0.4),
    },
    desk,
  );
}
