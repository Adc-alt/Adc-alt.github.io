import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DRAW,
  RANKS,
  SUITS,
  autoMove,
  canDrop,
  drawStock,
  isRed,
  isWon,
  makeDeck,
  move,
  newGame,
  pile,
  runFrom,
  shuffle,
} from "./solitaire.mjs";

const seeded = (seed = 1) => {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
};

const SPADES = 0;
const HEARTS = 1;
const DIAMONDS = 2;
const CLUBS = 3;

const card = (suit, rank, up = true) => ({ id: `${suit}-${rank}`, suit, rank, up });

/** An empty game, so a test can put exactly the cards it cares about on the table. */
const bare = () => ({
  stock: [],
  waste: [],
  foundations: [[], [], [], []],
  tableau: [[], [], [], [], [], [], []],
  moves: 0,
});

test("the deck is fifty-two distinct cards, thirteen of each suit", () => {
  const deck = makeDeck();
  assert.equal(deck.length, 52);
  assert.equal(new Set(deck.map((c) => c.id)).size, 52);
  for (let suit = 0; suit < 4; suit++) {
    assert.equal(deck.filter((c) => c.suit === suit).length, 13);
  }
  assert.equal(deck.every((c) => !c.up), true, "a fresh deck is face down");
});

test("hearts and diamonds are the red ones", () => {
  assert.equal(isRed(card(HEARTS, 1)), true);
  assert.equal(isRed(card(DIAMONDS, 1)), true);
  assert.equal(isRed(card(SPADES, 1)), false);
  assert.equal(isRed(card(CLUBS, 1)), false);
  assert.deepEqual(
    SUITS.map((s) => s.glyph),
    ["♠", "♥", "♦", "♣"],
  );
  assert.equal(RANKS[1], "A");
  assert.equal(RANKS[13], "K");
});

test("shuffling keeps every card and only reorders them", () => {
  const before = makeDeck().map((c) => c.id);
  const after = shuffle(makeDeck(), seeded(3)).map((c) => c.id);
  assert.notDeepEqual(after, before, "a shuffle that changes nothing is not a shuffle");
  assert.deepEqual([...after].sort(), [...before].sort());
});

test("the deal is 1 to 7 down the columns with one card up in each", () => {
  const g = newGame(seeded(5));
  for (let col = 0; col < 7; col++) {
    const t = g.tableau[col];
    assert.equal(t.length, col + 1, `column ${col} got the wrong number of cards`);
    assert.equal(t[t.length - 1].up, true, `column ${col} did not turn its top card over`);
    assert.equal(t.slice(0, -1).every((c) => !c.up), true, `column ${col} showed a buried card`);
  }
  assert.equal(g.stock.length, 52 - 28);
  assert.equal(g.waste.length, 0);

  const all = [...g.stock, ...g.tableau.flat()].map((c) => c.id);
  assert.equal(new Set(all).size, 52, "the deal lost or duplicated a card");
});

test("a foundation starts at the ace and climbs in its own suit", () => {
  const g = bare();
  assert.equal(canDrop(g, [card(HEARTS, 2)], "f0"), false, "no twos before the ace");
  assert.equal(canDrop(g, [card(HEARTS, 1)], "f0"), true);
  g.foundations[0].push(card(HEARTS, 1));
  assert.equal(canDrop(g, [card(HEARTS, 2)], "f0"), true);
  assert.equal(canDrop(g, [card(DIAMONDS, 2)], "f0"), false, "same colour is not same suit");
  assert.equal(canDrop(g, [card(HEARTS, 3)], "f0"), false, "no skipping a rank");
});

test("a foundation never takes more than one card", () => {
  const g = bare();
  g.foundations[0].push(card(SPADES, 1));
  assert.equal(canDrop(g, [card(SPADES, 2), card(SPADES, 3)], "f0"), false);
});

test("a column takes a descending run of alternating colour", () => {
  const g = bare();
  g.tableau[0].push(card(SPADES, 8));
  assert.equal(canDrop(g, [card(HEARTS, 7)], "t0"), true);
  assert.equal(canDrop(g, [card(DIAMONDS, 7)], "t0"), true);
  assert.equal(canDrop(g, [card(CLUBS, 7)], "t0"), false, "black on black");
  assert.equal(canDrop(g, [card(HEARTS, 6)], "t0"), false, "not the next rank down");
  assert.equal(canDrop(g, [card(HEARTS, 9)], "t0"), false, "going up, not down");
});

test("an empty column takes a King and nothing else", () => {
  const g = bare();
  assert.equal(canDrop(g, [card(SPADES, 13)], "t3"), true);
  assert.equal(canDrop(g, [card(SPADES, 12)], "t3"), false);
  assert.equal(canDrop(g, [card(SPADES, 1)], "t3"), false);
});

test("you cannot build on a face-down card", () => {
  // The board shows a card back; dropping onto it would look like the move
  // landed on a card nobody can see.
  const g = bare();
  g.tableau[0].push(card(SPADES, 8, false));
  assert.equal(canDrop(g, [card(HEARTS, 7)], "t0"), false);
});

test("picking up a column takes everything above the card", () => {
  const g = bare();
  g.tableau[0].push(card(CLUBS, 5, false), card(SPADES, 10), card(HEARTS, 9), card(CLUBS, 8));
  assert.deepEqual(
    runFrom(g, "t0", 1).map((c) => c.id),
    ["0-10", "1-9", "3-8"],
  );
  assert.deepEqual(runFrom(g, "t0", 0), [], "a face-down card cannot be picked up");
});

test("the waste and the foundations only give up their top card", () => {
  const g = bare();
  g.waste.push(card(SPADES, 2), card(HEARTS, 5));
  assert.deepEqual(
    runFrom(g, "waste", 1).map((c) => c.id),
    ["1-5"],
  );
  assert.deepEqual(runFrom(g, "waste", 0), [], "you cannot dig into the waste");
  assert.deepEqual(runFrom(g, "stock", 0), [], "the stock is not draggable");
});

test("moving off a column turns over the card it uncovers", () => {
  // This is the one that makes a game finishable. Without it the column stalls
  // with a face-down card on top and no legal move will ever reach it.
  const g = bare();
  g.tableau[0].push(card(DIAMONDS, 4, false), card(SPADES, 9));
  g.tableau[1].push(card(HEARTS, 10));
  assert.equal(move(g, "t0", 1, "t1"), true);
  assert.equal(g.tableau[0].length, 1);
  assert.equal(g.tableau[0][0].up, true, "the uncovered card should be face up now");
});

test("an illegal move changes nothing at all", () => {
  const g = bare();
  g.tableau[0].push(card(SPADES, 9));
  g.tableau[1].push(card(CLUBS, 10));
  assert.equal(move(g, "t0", 0, "t1"), false, "black on black");
  assert.equal(g.tableau[0].length, 1);
  assert.equal(g.tableau[1].length, 1);
  assert.equal(g.moves, 0);
});

test("a move onto the pile it came from is refused", () => {
  const g = bare();
  g.tableau[0].push(card(SPADES, 13));
  assert.equal(move(g, "t0", 0, "t0"), false);
  assert.equal(g.tableau[0].length, 1);
});

test("the stock turns cards face up and the waste keeps them in order", () => {
  const g = bare();
  g.stock.push(card(SPADES, 1, false), card(HEARTS, 2, false), card(CLUBS, 3, false));
  assert.equal(drawStock(g), true);
  assert.equal(g.waste.length, DRAW);
  assert.equal(g.waste.every((c) => c.up), true, "a card in the waste is face up");
  assert.equal(g.stock.length, 3 - DRAW);
});

test("an empty stock takes the waste back, face down and in the same order", () => {
  const g = bare();
  g.stock.push(card(SPADES, 1, false), card(HEARTS, 2, false));
  const order = [...g.stock].map((c) => c.id);
  while (g.stock.length) drawStock(g);
  assert.equal(g.stock.length, 0);

  assert.equal(drawStock(g), true, "clicking an empty stock should recycle");
  assert.equal(g.waste.length, 0);
  assert.deepEqual(g.stock.map((c) => c.id), order, "the second pass deals the same order");
  assert.equal(g.stock.every((c) => !c.up), true, "recycled cards go back face down");
});

test("clicking an empty stock with an empty waste does nothing", () => {
  const g = bare();
  assert.equal(drawStock(g), false);
  assert.equal(g.moves, 0);
});

test("a double click prefers the foundation over a column", () => {
  const g = bare();
  g.foundations[0].push(card(SPADES, 1));
  g.tableau[0].push(card(SPADES, 2));
  g.tableau[1].push(card(HEARTS, 3)); // the two would also go here
  assert.equal(autoMove(g, "t0", 0), "f0");
  assert.equal(g.foundations[0].length, 2);
  assert.equal(g.tableau[1].length, 1);
});

test("a double click falls back to a column when no foundation will take it", () => {
  const g = bare();
  g.tableau[0].push(card(SPADES, 9));
  g.tableau[4].push(card(HEARTS, 10));
  assert.equal(autoMove(g, "t0", 0), "t4");
});

test("a double click will not shuffle a whole column into an empty one", () => {
  // Legal, pointless, and on screen it looks like the card jumped for no
  // reason. The only place a lone King should go is a foundation.
  const g = bare();
  g.tableau[0].push(card(SPADES, 13));
  assert.equal(autoMove(g, "t0", 0), null);
  assert.equal(g.tableau[0].length, 1);
});

test("a double click that has nowhere to go reports it and changes nothing", () => {
  const g = bare();
  g.tableau[0].push(card(SPADES, 7));
  assert.equal(autoMove(g, "t0", 0), null);
  assert.equal(g.moves, 0);
});

test("the game is won only when all four foundations are complete", () => {
  const g = bare();
  assert.equal(isWon(g), false);
  for (let suit = 0; suit < 4; suit++) {
    for (let rank = 1; rank <= 13; rank++) g.foundations[suit].push(card(suit, rank));
  }
  assert.equal(isWon(g), true);
  g.foundations[3].pop();
  assert.equal(isWon(g), false);
});

test("pile() maps every id to its own array and rejects anything else", () => {
  const g = newGame(seeded(9));
  assert.equal(pile(g, "stock"), g.stock);
  assert.equal(pile(g, "waste"), g.waste);
  assert.equal(pile(g, "f2"), g.foundations[2]);
  assert.equal(pile(g, "t6"), g.tableau[6]);
  assert.equal(pile(g, "nope"), undefined);
  assert.equal(canDrop(g, [card(SPADES, 1)], "nope"), false);
});

test("a hundred random deals never lose a card", () => {
  for (let seed = 1; seed <= 100; seed++) {
    const g = newGame(seeded(seed));
    const ids = [...g.stock, ...g.waste, ...g.foundations.flat(), ...g.tableau.flat()].map(
      (c) => c.id,
    );
    assert.equal(new Set(ids).size, 52, `seed ${seed} dealt a broken deck`);
  }
});
