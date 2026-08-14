/**
 * Mapa del comecocos. 28x31 tiles, como el original de Namco.
 *
 *   #  muro          .  punto          o  power pellet
 *   -  puerta de la casa (la cruzan los fantasmas, tu no)
 *   P  donde arranca el jugador
 *   (espacio) suelo vacio
 *
 * La fila 14 no tiene muro en los extremos: es el tunel, se sale por un lado
 * y se entra por el otro.
 *
 * ⚠️ Si editas esto, corre `pnpm test`. El test valida dimensiones, simetria
 * y —lo importante— que TODOS los puntos sean alcanzables desde P. Un muro de
 * mas y el nivel es imposible de terminar sin que se note hasta jugarlo.
 */
export const MAZE = [
  "############################",
  "#............##............#",
  "#.####.#####.##.#####.####.#",
  "#o####.#####.##.#####.####o#",
  "#.####.#####.##.#####.####.#",
  "#..........................#",
  "#.####.##.########.##.####.#",
  "#.####.##.########.##.####.#",
  "#......##....##....##......#",
  "######.##### ## #####.######",
  "######.##### ## #####.######",
  "######.##          ##.######",
  "######.## ###--### ##.######",
  "######.## #      # ##.######",
  "      ....#      #....      ",
  "######.## #      # ##.######",
  "######.## ######## ##.######",
  "######.##          ##.######",
  "######.## ######## ##.######",
  "######.## ######## ##.######",
  "#............##............#",
  "#.####.#####.##.#####.####.#",
  "#.####.#####.##.#####.####.#",
  "#o..##.......P........##..o#",
  "###.##.##.########.##.##.###",
  "###.##.##.########.##.##.###",
  "#......##....##....##......#",
  "#.##########.##.##########.#",
  "#.##########.##.##########.#",
  "#..........................#",
  "############################",
];

export const COLS = 28;
export const ROWS = 31;

/** Casa de los fantasmas: interior y celda justo encima de la puerta. */
export const HOUSE = {
  door: { c: 13, r: 12 },
  inside: { c: 13, r: 14 },
  outside: { c: 13, r: 11 },
};
