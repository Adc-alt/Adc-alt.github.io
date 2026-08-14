import test from "node:test";
import assert from "node:assert/strict";
import { MAZE, COLS, ROWS, HOUSE } from "./comecocos-maze.js";

const at = (c, r) =>
  r < 0 || r >= ROWS ? "#" : MAZE[r][((c % COLS) + COLS) % COLS];

/** BFS 4-direccional con el tunel envolviendo por los lados. */
function flood(start, passable) {
  const seen = new Set();
  const queue = [start];
  seen.add(`${start.c},${start.r}`);
  while (queue.length) {
    const { c, r } = queue.pop();
    for (const [dc, dr] of [[0, -1], [-1, 0], [0, 1], [1, 0]]) {
      const nc = ((c + dc) % COLS + COLS) % COLS;
      const nr = r + dr;
      const key = `${nc},${nr}`;
      if (seen.has(key) || !passable(at(nc, nr))) continue;
      seen.add(key);
      queue.push({ c: nc, r: nr });
    }
  }
  return seen;
}

const spawn = (() => {
  for (let r = 0; r < ROWS; r++) {
    const c = MAZE[r].indexOf("P");
    if (c >= 0) return { c, r };
  }
  throw new Error("el mapa no tiene P");
})();

test("dimensiones", () => {
  assert.equal(MAZE.length, ROWS);
  for (const [i, row] of MAZE.entries()) {
    assert.equal(row.length, COLS, `la fila ${i} mide ${row.length}`);
  }
});

test("solo caracteres conocidos", () => {
  const raro = [...MAZE.join("")].find((ch) => !"#.o- P".includes(ch));
  assert.equal(raro, undefined, `caracter no reconocido: ${JSON.stringify(raro)}`);
});

test("una salida de jugador y cuatro pellets", () => {
  const flat = MAZE.join("");
  assert.equal([...flat].filter((ch) => ch === "P").length, 1);
  assert.equal([...flat].filter((ch) => ch === "o").length, 4);
});

test("todos los puntos son alcanzables desde la salida", () => {
  // Para el jugador la puerta de la casa es un muro.
  const seen = flood(spawn, (ch) => ch !== "#" && ch !== "-");
  const perdidos = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const ch = MAZE[r][c];
      if ((ch === "." || ch === "o") && !seen.has(`${c},${r}`)) perdidos.push(`${c},${r}`);
    }
  }
  assert.deepEqual(perdidos, [], "puntos inalcanzables");
});

test("el tunel de la fila 14 conecta los dos lados", () => {
  const fila = MAZE[14];
  assert.notEqual(fila[0], "#");
  assert.notEqual(fila[COLS - 1], "#");
});

test("la casa de los fantasmas tiene salida, y solo por la puerta", () => {
  // Con la puerta abierta se llega al mapa.
  const conPuerta = flood(HOUSE.inside, (ch) => ch !== "#");
  assert.ok(conPuerta.has(`${spawn.c},${spawn.r}`), "no se sale de la casa");

  // Sin ella, la casa queda aislada: si no, los fantasmas se escapan por un
  // agujero y la puerta no pinta nada.
  const sinPuerta = flood(HOUSE.inside, (ch) => ch !== "#" && ch !== "-");
  assert.ok(!sinPuerta.has(`${spawn.c},${spawn.r}`), "la casa tiene un agujero");
});

test("la celda de encima de la puerta esta libre", () => {
  assert.equal(at(HOUSE.outside.c, HOUSE.outside.r), " ");
  assert.equal(at(HOUSE.door.c, HOUSE.door.r), "-");
});
