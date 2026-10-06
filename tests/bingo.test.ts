import { test } from "node:test";
import assert from "node:assert/strict";
import { generateCards, validateCard } from "../src/lib/bingo.ts";
import { calcTotal } from "../src/lib/pricing.ts";

test("genera 6000 cartones válidos y sin repetir", () => {
  const cards = generateCards(6000, 20261006);
  assert.equal(cards.length, 6000);
  const keys = new Set(cards.map((c) => c.numbers.join(",")));
  assert.equal(keys.size, 6000);
  for (const card of cards) assert.deepEqual(validateCard(card), []);
});

test("misma semilla, mismos cartones", () => {
  assert.deepEqual(generateCards(50, 7), generateCards(50, 7));
});

test("precio con combos de 3", () => {
  assert.equal(calcTotal(1).total, 6500);
  assert.equal(calcTotal(2).total, 13000);
  assert.equal(calcTotal(3).total, 15000);
  assert.equal(calcTotal(4).total, 21500);
  assert.equal(calcTotal(6).total, 30000);
  assert.equal(calcTotal(7).total, 36500);
  assert.equal(calcTotal(3).savings, 4500);
});
