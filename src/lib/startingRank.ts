import type { ParticipantDraft } from '../types';

export type RandomSource = () => number;

/** Fisher-Yates: cópia embaralhada de forma uniforme. */
export function shuffle<T>(items: readonly T[], random: RandomSource = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Ordena por rating decrescente, sem rating por último. A ordenação é estável:
 * empates mantêm a ordem recebida (a do sorteio, no início do torneio).
 */
export function sortByRating<T extends Pick<ParticipantDraft, 'rating'>>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.rating === null && b.rating === null) return 0;
    if (a.rating === null) return 1;
    if (b.rating === null) return -1;
    return b.rating - a.rating;
  });
}

/** Atribui o número inicial: sorteio como desempate do rating (critério FIDE). */
export function drawStartingRanks<T extends ParticipantDraft>(
  participants: readonly T[],
  random: RandomSource = Math.random,
): (T & { startingRank: number })[] {
  return sortByRating(shuffle(participants, random)).map((p, index) => ({ ...p, startingRank: index + 1 }));
}
