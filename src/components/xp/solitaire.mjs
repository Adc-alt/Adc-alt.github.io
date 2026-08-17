/**
 * Klondike, the rules only. No DOM, same split as `minesweeper.mjs`: what is
 * here is what can be wrong while the screen still looks right — a move that
 * should have been refused, a card that never gets turned over, a stock that
 * stops recycling.
 *
 * Piles are addressed by a string so a move is two ids and an index, and the
 * renderer never has to know which array is which: "stock", "waste", "f0".."f3"
 * for the four foundations, "t0".."t6" for the seven columns.
 */

/** Suits in the order the foundations sit in, with the glyph each one draws. */
export const SUITS = [
  { name: "spades", glyph: "♠", red: false },
  { name: "hearts", glyph: "♥", red: true },
  { name: "diamonds", glyph: "♦", red: true },
  { name: "clubs", glyph: "♣", red: false },
];

/** A, 2..10, J, Q, K — index 0 is unused so `RANKS[rank]` reads straight. */
export const RANKS = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const KING = 13;
const ACE = 1;

/**
 * How many cards the stock turns over at a time.
 *
 * Windows defaulted to three. One, here, on purpose: draw-three with a portfolio
 * toy means most deals are unwinnable and nobody is going to sit through that.
 * Changing it back is this constant and nothing else.
 */
export const DRAW = 1;

export const isRed = (card) => SUITS[card.suit].red;

/** The 52, in order, face down. Shuffling is a separate step so tests can skip it. */
export function makeDeck() {
  const cards = [];
  for (let suit = 0; suit < 4; suit++) {
    for (let rank = ACE; rank <= KING; rank++) {
      cards.push({ id: `${suit}-${rank}`, suit, rank, up: false });
    }
  }
  return cards;
}

/** Fisher-Yates. `rng` is a parameter so a test can deal the same hand twice. */
export function shuffle(cards, rng = Math.random) {
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

/** A fresh deal: 1..7 down the columns, top card of each turned over, rest to stock. */
export function newGame(rng = Math.random, deck = shuffle(makeDeck(), rng)) {
  const game = {
    stock: [],
    waste: [],
    foundations: [[], [], [], []],
    tableau: [[], [], [], [], [], [], []],
    moves: 0,
  };
  let at = 0;
  for (let col = 0; col < 7; col++) {
    for (let n = 0; n <= col; n++) {
      const card = deck[at++];
      card.up = n === col;
      game.tableau[col].push(card);
    }
  }
  for (; at < deck.length; at++) {
    deck[at].up = false;
    game.stock.push(deck[at]);
  }
  return game;
}

/** The array behind a pile id, or undefined if the id is not one. */
export function pile(game, id) {
  if (id === "stock") return game.stock;
  if (id === "waste") return game.waste;
  const n = Number(id.slice(1));
  if (id[0] === "f") return game.foundations[n];
  if (id[0] === "t") return game.tableau[n];
  return undefined;
}

const top = (arr) => arr[arr.length - 1];

/**
 * The cards you pick up when you grab card `index` of a pile.
 *
 * A tableau column hands over that card and everything on top of it; the waste
 * and the foundations only ever hand over their top card. A face-down card
 * hands over nothing — you have to turn it up by clearing what is on it.
 */
export function runFrom(game, fromId, index) {
  const from = pile(game, fromId);
  if (!from || index < 0 || index >= from.length) return [];
  if (fromId === "stock") return [];
  if (fromId !== "waste" && fromId[0] !== "f" && fromId[0] !== "t") return [];
  if (fromId === "waste" || fromId[0] === "f") {
    return index === from.length - 1 ? [from[index]] : [];
  }
  const run = from.slice(index);
  return run.every((c) => c.up) ? run : [];
}

/** Foundations take one card at a time, same suit, starting at the ace. */
export function canDropFoundation(cards, target) {
  if (cards.length !== 1) return false;
  const card = cards[0];
  const t = top(target);
  return t ? t.suit === card.suit && t.rank === card.rank - 1 : card.rank === ACE;
}

/** Columns take descending runs of alternating colour; an empty one takes a King. */
export function canDropTableau(cards, target) {
  if (!cards.length) return false;
  const card = cards[0];
  const t = top(target);
  return t ? t.up && t.rank === card.rank + 1 && isRed(t) !== isRed(card) : card.rank === KING;
}

/** Whether `cards` may land on `toId`. The one place both rules are asked. */
export function canDrop(game, cards, toId) {
  const target = pile(game, toId);
  if (!target || !cards.length) return false;
  if (toId[0] === "f") return canDropFoundation(cards, target);
  if (toId[0] === "t") return canDropTableau(cards, target);
  return false;
}

/**
 * Plays a move if it is legal, and reports whether it happened.
 *
 * The turn-over afterwards is part of the move and not a separate step: a
 * column whose last face-down card is left face down is a game that cannot be
 * finished, and nothing else in the file would put it right.
 */
export function move(game, fromId, index, toId) {
  if (fromId === toId) return false;
  const cards = runFrom(game, fromId, index);
  if (!cards.length || !canDrop(game, cards, toId)) return false;

  const from = pile(game, fromId);
  from.splice(index, cards.length);
  pile(game, toId).push(...cards);
  for (const c of cards) c.up = true;

  const exposed = top(from);
  if (fromId[0] === "t" && exposed && !exposed.up) exposed.up = true;
  game.moves++;
  return true;
}

/**
 * Clicking the stock: turn cards over, or put the waste back when it runs out.
 *
 * The recycle reverses the waste, which is what makes a second pass through the
 * deck show the cards in the same order as the first. Windows allowed it
 * without limit in the default scoring, so there is no redeal counter here.
 */
export function drawStock(game) {
  if (!game.stock.length) {
    if (!game.waste.length) return false;
    while (game.waste.length) {
      const card = game.waste.pop();
      card.up = false;
      game.stock.push(card);
    }
    game.moves++;
    return true;
  }
  for (let n = 0; n < DRAW && game.stock.length; n++) {
    const card = game.stock.pop();
    card.up = true;
    game.waste.push(card);
  }
  game.moves++;
  return true;
}

/**
 * Double click: send the card to a foundation if it will go, otherwise try the
 * columns left to right. Returns the pile it landed on, or null.
 */
export function autoMove(game, fromId, index) {
  const cards = runFrom(game, fromId, index);
  if (!cards.length) return null;

  const targets = ["f0", "f1", "f2", "f3", "t0", "t1", "t2", "t3", "t4", "t5", "t6"];
  for (const toId of targets) {
    if (toId === fromId) continue;
    // Sliding a whole column into an empty one is legal and achieves nothing.
    // On a double click it reads as a bug, so it is not offered.
    if (toId[0] === "t" && fromId[0] === "t" && index === 0 && !pile(game, toId).length) continue;
    if (move(game, fromId, index, toId)) return toId;
  }
  return null;
}

/** Won when all four foundations hold thirteen cards. */
export const isWon = (game) => game.foundations.every((f) => f.length === KING);
