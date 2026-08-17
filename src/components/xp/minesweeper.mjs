/**
 * Minesweeper, the rules only. No DOM: the board is an array of cells and every
 * function here takes one and changes it. `Minesweeper.astro` draws it.
 *
 * Split out for the same reason as `windows.mjs`: this is the part that can be
 * wrong without looking wrong. A flood fill that stops one cell short, or a win
 * test that counts flags instead of revealed cells, produces a board that still
 * renders perfectly.
 */

/** The three boards Windows shipped, with their mine counts. */
export const LEVELS = {
  beginner: { cols: 9, rows: 9, mines: 10 },
  intermediate: { cols: 16, rows: 16, mines: 40 },
  expert: { cols: 30, rows: 16, mines: 99 },
};

/** A cell is one of these. `question` is XP's "?" mark, which is on by default. */
export const HIDDEN = "hidden";
export const REVEALED = "revealed";
export const FLAGGED = "flagged";
export const QUESTION = "question";

/** An empty board: no mines yet, because the first click decides where they go. */
export function createBoard(level = "beginner") {
  const { cols, rows, mines } = LEVELS[level] ?? LEVELS.beginner;
  return {
    level,
    cols,
    rows,
    mines,
    planted: false,
    dead: false,
    /** The mine that was actually stepped on. Windows paints that one red and
        leaves the other nine grey, which is how you see where you went wrong. */
    boom: -1,
    cells: Array.from({ length: cols * rows }, () => ({
      mine: false,
      adj: 0,
      state: HIDDEN,
    })),
  };
}

/** The indices touching `i`, without wrapping round the edges of the grid. */
export function neighbours(board, i) {
  const { cols, rows } = board;
  const x = i % cols;
  const y = (i - x) / cols;
  const out = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      out.push(ny * cols + nx);
    }
  }
  return out;
}

/**
 * Scatters the mines, keeping `safe` clear.
 *
 * Only the clicked cell is protected, not the ring around it. That is what
 * Windows did — the modern convention of opening a whole pocket on the first
 * click came later — so a first click that turns up a bare "3" is authentic and
 * not a bug.
 *
 * `rng` is a parameter so the tests can hand it a counter and get the same
 * board twice.
 */
export function plantMines(board, safe, rng = Math.random) {
  const spots = [];
  for (let i = 0; i < board.cells.length; i++) if (i !== safe) spots.push(i);

  // Fisher-Yates over the candidates, then take the first `mines`. Cheaper to
  // reason about than "pick random cells until enough are distinct", which has
  // no upper bound on a board that is nearly all mines.
  for (let i = spots.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [spots[i], spots[j]] = [spots[j], spots[i]];
  }
  for (const i of spots.slice(0, board.mines)) board.cells[i].mine = true;

  for (let i = 0; i < board.cells.length; i++) {
    board.cells[i].adj = neighbours(board, i).filter((n) => board.cells[n].mine).length;
  }
  board.planted = true;
  return board;
}

/**
 * Opens a cell, and everything it opens in turn.
 *
 * Returns "boom" if it was a mine, "ok" otherwise. A flagged cell is left
 * alone: the flag exists to stop exactly this click.
 *
 * The flood fill is a worklist rather than recursion — the expert board is 480
 * cells and a first click can open most of them, which is deep enough to be
 * worth not putting on the call stack.
 */
export function reveal(board, i, rng = Math.random) {
  if (board.dead || isWon(board)) return "ok";

  const cell = board.cells[i];
  if (!cell || cell.state === REVEALED || cell.state === FLAGGED) return "ok";

  if (!board.planted) plantMines(board, i, rng);

  if (board.cells[i].mine) {
    board.cells[i].state = REVEALED;
    board.dead = true;
    board.boom = i;
    return "boom";
  }

  const work = [i];
  while (work.length) {
    const at = work.pop();
    const c = board.cells[at];
    if (c.state === REVEALED || c.state === FLAGGED) continue;
    c.state = REVEALED;
    if (c.adj === 0) work.push(...neighbours(board, at));
  }
  return "ok";
}

/** Right click: hidden → flag → "?" → hidden, the cycle XP shows by default. */
export function cycleMark(board, i) {
  const cell = board.cells[i];
  if (!cell || board.dead || cell.state === REVEALED) return board;
  cell.state =
    cell.state === HIDDEN ? FLAGGED : cell.state === FLAGGED ? QUESTION : HIDDEN;
  return board;
}

/**
 * The number in the left-hand display: mines minus flags.
 *
 * It can go negative, and it should — Windows lets you plant more flags than
 * there are mines and shows the counter below zero rather than refusing.
 */
export function remaining(board) {
  return board.mines - board.cells.filter((c) => c.state === FLAGGED).length;
}

/**
 * Won when every cell that is not a mine has been opened.
 *
 * Deliberately not "every mine is flagged": you win in Minesweeper by clearing
 * the board, and a game where the last cells are all mines is won without
 * planting a single flag.
 */
export function isWon(board) {
  return !board.dead && board.cells.every((c) => c.mine || c.state === REVEALED);
}

/** What each cell should show. One place, so the renderer holds no rules. */
export function faceOf(board, i) {
  const c = board.cells[i];
  if (board.dead && c.mine && c.state !== FLAGGED) return i === board.boom ? "boom" : "mine";
  if (c.state === FLAGGED) return board.dead && !c.mine ? "wrong" : "flag";
  if (c.state === QUESTION) return "question";
  if (c.state !== REVEALED) return "hidden";
  return c.adj === 0 ? "empty" : String(c.adj);
}
