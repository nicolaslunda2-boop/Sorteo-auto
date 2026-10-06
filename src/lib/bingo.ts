// Generador de cartones de bingo español (90 bolillas).
//
// Reglas de cada cartón:
//  - 3 filas x 9 columnas = 27 casilleros.
//  - 15 números y 12 casilleros vacíos; exactamente 5 números por fila.
//  - Columna 1: 1-9, columna 2: 10-19, … columna 9: 80-90.
//  - Cada columna tiene entre 1 y 3 números, ordenados de arriba hacia abajo.
//  - Ningún cartón se repite (se compara el conjunto de 15 números).

export const ROWS = 3;
export const COLS = 9;
export const NUMBERS_PER_CARD = 15;
export const NUMBERS_PER_ROW = 5;

export type Card = {
  /** 27 casilleros en orden fila por fila; 0 = casillero vacío. */
  grid: number[];
  /** Los 15 números ordenados de menor a mayor. */
  numbers: number[];
};

/** Generador pseudoaleatorio con semilla (mulberry32): mismo resultado cada vez. */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function columnRange(col: number): [number, number] {
  if (col === 0) return [1, 9];
  if (col === COLS - 1) return [80, 90];
  return [col * 10, col * 10 + 9];
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Cuántos números lleva cada columna (1 a 3, suman 15). */
function columnCounts(rng: () => number): number[] {
  const counts = new Array(COLS).fill(1);
  let extra = NUMBERS_PER_CARD - COLS;
  while (extra > 0) {
    const c = Math.floor(rng() * COLS);
    if (counts[c] < ROWS) {
      counts[c]++;
      extra--;
    }
  }
  return counts;
}

/**
 * Elige en qué filas va cada número de columna para que cada fila quede con 5.
 * Procesa primero las columnas más cargadas y elige las filas con más lugar libre.
 */
function assignRows(counts: number[], rng: () => number): boolean[][] | null {
  const capacity = new Array(ROWS).fill(NUMBERS_PER_ROW);
  const used: boolean[][] = Array.from({ length: COLS }, () => new Array(ROWS).fill(false));
  const order = shuffle([...Array(COLS).keys()], rng).sort((a, b) => counts[b] - counts[a]);

  for (const col of order) {
    const rows = shuffle([...Array(ROWS).keys()], rng).sort((a, b) => capacity[b] - capacity[a]);
    for (let k = 0; k < counts[col]; k++) {
      const r = rows[k];
      if (capacity[r] <= 0) return null;
      used[col][r] = true;
      capacity[r]--;
    }
  }
  return capacity.every((c) => c === 0) ? used : null;
}

export function generateCard(rng: () => number): Card {
  for (;;) {
    const counts = columnCounts(rng);
    const layout = assignRows(counts, rng);
    if (!layout) continue;

    const grid = new Array(ROWS * COLS).fill(0);
    for (let col = 0; col < COLS; col++) {
      const [min, max] = columnRange(col);
      const pool = [];
      for (let n = min; n <= max; n++) pool.push(n);
      const picked = shuffle(pool, rng).slice(0, counts[col]).sort((a, b) => a - b);
      let i = 0;
      for (let row = 0; row < ROWS; row++) {
        if (layout[col][row]) grid[row * COLS + col] = picked[i++];
      }
    }
    const numbers = grid.filter((n) => n > 0).sort((a, b) => a - b);
    return { grid, numbers };
  }
}

/** Genera `total` cartones distintos entre sí, siempre los mismos para la misma semilla. */
export function generateCards(total: number, seed: number): Card[] {
  const rng = createRng(seed);
  const seen = new Set<string>();
  const cards: Card[] = [];
  while (cards.length < total) {
    const card = generateCard(rng);
    const key = card.numbers.join(",");
    if (seen.has(key)) continue;
    seen.add(key);
    cards.push(card);
  }
  return cards;
}

/** Verifica que un cartón cumpla todas las reglas. Devuelve la lista de errores. */
export function validateCard(card: Card): string[] {
  const errors: string[] = [];
  const { grid } = card;
  if (grid.length !== ROWS * COLS) errors.push("el cartón no tiene 27 casilleros");
  for (let row = 0; row < ROWS; row++) {
    const filled = grid.slice(row * COLS, row * COLS + COLS).filter((n) => n > 0).length;
    if (filled !== NUMBERS_PER_ROW) errors.push(`la fila ${row + 1} tiene ${filled} números`);
  }
  for (let col = 0; col < COLS; col++) {
    const [min, max] = columnRange(col);
    const values = [0, 1, 2].map((r) => grid[r * COLS + col]).filter((n) => n > 0);
    if (values.length < 1) errors.push(`la columna ${col + 1} está vacía`);
    for (const v of values) {
      if (v < min || v > max) errors.push(`${v} no corresponde a la columna ${col + 1}`);
    }
    for (let i = 1; i < values.length; i++) {
      if (values[i] <= values[i - 1]) errors.push(`la columna ${col + 1} no está ordenada`);
    }
  }
  const nums = grid.filter((n) => n > 0);
  if (nums.length !== NUMBERS_PER_CARD) errors.push(`tiene ${nums.length} números`);
  if (new Set(nums).size !== nums.length) errors.push("tiene números repetidos");
  return errors;
}
