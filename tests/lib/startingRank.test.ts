import { describe, expect, it } from 'vitest';
import type { ParticipantDraft } from '../../src/types';
import { drawStartingRanks, shuffle, sortByRating } from '../../src/lib/startingRank.ts';
import { seededRandom } from './random.ts';

const draft = (id: string, rating: number | null = null): ParticipantDraft => ({ id, name: id, rating });

describe('shuffle', () => {
  it('é uma permutação e não altera a entrada', () => {
    const input = ['a', 'b', 'c', 'd', 'e'];
    const output = shuffle(input, seededRandom(1));

    expect([...output].sort()).toEqual(input);
    expect(input).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('é determinístico para a mesma fonte aleatória', () => {
    const input = ['a', 'b', 'c', 'd', 'e', 'f'];
    expect(shuffle(input, seededRandom(42))).toEqual(shuffle(input, seededRandom(42)));
  });

  it('gera ordens diferentes para fontes diferentes', () => {
    const input = Array.from({ length: 10 }, (_, i) => String(i));
    const orders = new Set([1, 2, 3, 4, 5].map((seed) => shuffle(input, seededRandom(seed)).join()));
    expect(orders.size).toBeGreaterThan(1);
  });
});

describe('sortByRating', () => {
  it('ordena por rating decrescente, sem rating por último, mantendo a ordem dos empates', () => {
    const sorted = sortByRating([draft('x'), draft('a', 1500), draft('y'), draft('b', 1800), draft('c', 1500)]);
    expect(sorted.map((p) => p.id)).toEqual(['b', 'a', 'c', 'x', 'y']);
  });
});

describe('drawStartingRanks', () => {
  it('rating sempre prevalece sobre o sorteio', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const ranked = drawStartingRanks([draft('low', 1200), draft('none'), draft('high', 2000)], seededRandom(seed));
      expect(ranked.map((p) => p.id)).toEqual(['high', 'low', 'none']);
    }
  });

  it('sorteio decide a ordem entre empatados e sem rating', () => {
    const drafts = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => draft(id));
    const orders = new Set([1, 2, 3, 4, 5].map((seed) => drawStartingRanks(drafts, seededRandom(seed)).map((p) => p.id).join()));
    expect(orders.size).toBeGreaterThan(1);
  });

  it('numera de 1 a n na ordem final', () => {
    const ranked = drawStartingRanks([draft('a', 1500), draft('b'), draft('c', 1900)], seededRandom(7));
    expect(ranked.map((p) => p.startingRank)).toEqual([1, 2, 3]);
  });
});
