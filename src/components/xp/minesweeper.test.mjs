import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FLAGGED,
  HIDDEN,
  LEVELS,
  QUESTION,
  REVEALED,
  createBoard,
  cycleMark,
  faceOf,
  isWon,
  neighbours,
  plantMines,
  remaining,
  reveal,
} from "./minesweeper.mjs";

/** A deterministic stand-in for Math.random: walks a fixed cycle. */
const seeded = (seed = 1) => {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
};

/** Builds a board with the mines exactly where `mask` says, skipping the shuffle. */
function rigged(cols, rows, mineIndices) {
  const board = createBoard("beginner");
  board.cols = cols;
  board.rows = rows;
  board.mines = mineIndices.length;
  board.cells = Array.from({ length: cols * rows }, () => ({
    mine: false,
    adj: 0,
    state: HIDDEN,
  }));
  for (const i of mineIndices) board.cells[i].mine = true;
  for (let i = 0; i < board.cells.length; i++) {
    board.cells[i].adj = neighbours(board, i).filter((n) => board.cells[n].mine).length;
  }
  board.planted = true;
  return board;
}

test("the three levels are the ones Windows shipped", () => {
  assert.deepEqual(LEVELS.beginner, { cols: 9, rows: 9, mines: 10 });
  assert.deepEqual(LEVELS.intermediate, { cols: 16, rows: 16, mines: 40 });
  assert.deepEqual(LEVELS.expert, { cols: 30, rows: 16, mines: 99 });
});

test("a corner has three neighbours and the middle has eight", () => {
  // The failure this catches: computing neighbours with `i ± 1` and letting the
  // right edge wrap round onto the left of the next row, which puts a phantom
  // mine count on every border cell and is invisible on screen.
  const b = createBoard("beginner"); // 9x9
  assert.deepEqual(neighbours(b, 0).sort((x, y) => x - y), [1, 9, 10]);
  assert.deepEqual(neighbours(b, 8).sort((x, y) => x - y), [7, 16, 17]);
  assert.equal(neighbours(b, 40).length, 8);
  assert.equal(neighbours(b, 80).length, 3);
});

test("every level plants exactly its mine count and nothing wraps", () => {
  for (const name of Object.keys(LEVELS)) {
    const b = plantMines(createBoard(name), 0, seeded(7));
    assert.equal(
      b.cells.filter((c) => c.mine).length,
      LEVELS[name].mines,
      `${name} planted the wrong number of mines`,
    );
    for (let i = 0; i < b.cells.length; i++) {
      assert.ok(b.cells[i].adj <= neighbours(b, i).length, `cell ${i} counts more neighbours than it has`);
    }
  }
});

test("the first click is never a mine, whatever the seed", () => {
  for (let seed = 1; seed <= 40; seed++) {
    const b = createBoard("expert"); // 99 mines in 480 cells: a fifth of the board
    plantMines(b, 123, seeded(seed));
    assert.equal(b.cells[123].mine, false, `seed ${seed} put a mine under the first click`);
  }
});

test("clicking an empty cell opens the whole pocket and stops at the numbers", () => {
  //  0 1 2 3 4      One mine, bottom right. Clicking cell 0 must open the empty
  //  5 6 7 8 9*     left half, must open the "1"s that ring the mine — cells 3
  //                 and 8 — and must STOP there: cell 4 is a 1 as well, but the
  //                 only ways to reach it are through 3 and 9, and a number
  //                 does not expand. A fill that opens cell 4 anyway is one
  //                 that keeps walking past the numbers.
  const b = rigged(5, 2, [9]);
  assert.equal(reveal(b, 0), "ok");
  const open = b.cells.map((c) => c.state === REVEALED);
  assert.deepEqual(open, [true, true, true, true, false, true, true, true, true, false]);
  assert.equal(faceOf(b, 0), "empty");
  assert.equal(faceOf(b, 3), "1");
  assert.equal(faceOf(b, 8), "1");
  assert.equal(faceOf(b, 4), "hidden");
  assert.equal(faceOf(b, 9), "hidden", "the mine stays hidden while the game is alive");
});

test("a flag stops the click it exists to stop", () => {
  const b = rigged(3, 1, [2]);
  cycleMark(b, 2);
  assert.equal(reveal(b, 2), "ok");
  assert.equal(b.dead, false);
  assert.equal(b.cells[2].state, FLAGGED);
});

test("a flagged cell also blocks the flood fill running into it", () => {
  // Without the FLAGGED guard inside the worklist the fill overwrites the flag
  // with REVEALED, and on a mine that is a silent loss with no explosion.
  const b = rigged(4, 1, []);
  cycleMark(b, 2);
  reveal(b, 0);
  assert.equal(b.cells[2].state, FLAGGED);
  assert.equal(b.cells[3].state, HIDDEN, "the fill should not have jumped the flag");
});

test("stepping on a mine ends it", () => {
  const b = rigged(3, 1, [1]);
  assert.equal(reveal(b, 1), "boom");
  assert.equal(b.dead, true);
  assert.equal(isWon(b), false);
  assert.equal(reveal(b, 0), "ok");
  assert.equal(b.cells[0].state, HIDDEN, "a dead board should not keep opening");
});

test("the mark cycles hidden, flag, question, hidden", () => {
  const b = rigged(1, 1, []);
  assert.equal(b.cells[0].state, HIDDEN);
  assert.equal(cycleMark(b, 0).cells[0].state, FLAGGED);
  assert.equal(cycleMark(b, 0).cells[0].state, QUESTION);
  assert.equal(cycleMark(b, 0).cells[0].state, HIDDEN);
});

test("with Marks (?) off the cycle is just flag on, flag off", () => {
  // The Game menu offers the setting, so it has to mean something. Left in,
  // the "?" would be reachable with the setting switched off.
  const b = rigged(1, 1, []);
  assert.equal(cycleMark(b, 0, false).cells[0].state, FLAGGED);
  assert.equal(cycleMark(b, 0, false).cells[0].state, HIDDEN);
  assert.equal(cycleMark(b, 0, false).cells[0].state, FLAGGED);
});

test("a question mark still clears when the setting is turned off mid-cycle", () => {
  const b = rigged(1, 1, []);
  cycleMark(b, 0); // flag
  cycleMark(b, 0); // question
  assert.equal(b.cells[0].state, QUESTION);
  assert.equal(cycleMark(b, 0, false).cells[0].state, HIDDEN, "a ? must not be a dead end");
});

test("a revealed cell cannot be flagged", () => {
  const b = rigged(3, 1, [2]);
  reveal(b, 0);
  cycleMark(b, 0);
  assert.equal(b.cells[0].state, REVEALED);
});

test("the counter shows mines minus flags and is allowed to go negative", () => {
  const b = rigged(4, 1, [3]);
  assert.equal(remaining(b), 1);
  cycleMark(b, 0);
  assert.equal(remaining(b), 0);
  cycleMark(b, 1);
  assert.equal(remaining(b), -1, "Windows shows -1 rather than refusing the flag");
  cycleMark(b, 1); // to question
  assert.equal(remaining(b), 0, "a question mark is not a flag");
});

test("you win by clearing the board, not by flagging every mine", () => {
  const b = rigged(3, 1, [2]);
  assert.equal(isWon(b), false);
  reveal(b, 0);
  reveal(b, 1);
  assert.equal(isWon(b), true, "both safe cells are open, so the game is over");
  assert.equal(b.cells[2].state, HIDDEN, "won without planting a single flag");
});

test("a lost board shows the mines it hid and marks the flags that were wrong", () => {
  const b = rigged(3, 1, [0]);
  cycleMark(b, 1); // a flag on a safe cell
  reveal(b, 2);
  assert.equal(faceOf(b, 1), "flag", "still just a flag while the game is alive");
  reveal(b, 0);
  assert.equal(b.dead, true);
  assert.equal(faceOf(b, 0), "boom");
  assert.equal(faceOf(b, 1), "wrong");
});

test("only the mine you stepped on is the one that went off", () => {
  // Windows paints the detonated mine red and the rest plain, which is what
  // tells you where you went wrong. Painting all ten red loses that.
  const b = rigged(4, 1, [0, 2, 3]);
  reveal(b, 2);
  assert.equal(b.boom, 2);
  assert.equal(faceOf(b, 2), "boom");
  assert.equal(faceOf(b, 0), "mine");
  assert.equal(faceOf(b, 3), "mine");
});

test("a board nobody lost has no detonated mine", () => {
  const b = rigged(3, 1, [2]);
  assert.equal(b.boom, -1);
  reveal(b, 0);
  assert.equal(faceOf(b, 2), "hidden", "index -1 must not mark a real cell");
});
