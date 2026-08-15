/**
 * La hora de la bandeja del sistema.
 *
 * Módulo suelto y no cuatro líneas dentro del componente porque es la única
 * lógica de ejecución de la fase (§9), y el relleno con cero es justo donde
 * vive el fallo que se ve una vez al día a las 9:05.
 */

/** `HH:MM` en 24 h, hora local del navegador. */
export function formatTime(date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Milisegundos hasta el próximo minuto en punto.
 *
 * El reloj se reprograma con esto en vez de latir cada segundo: la bandeja solo
 * enseña minutos, así que despertar sesenta veces por minuto para pintar lo
 * mismo es gastar batería por nada. En el segundo cero devuelve 60000 y no 0,
 * que dejaría el `setTimeout` girando en vacío.
 */
export function msToNextMinute(date) {
  return 60000 - (date.getSeconds() * 1000 + date.getMilliseconds());
}
