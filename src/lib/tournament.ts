import { pair } from '@echecs/swiss';
import type { CompletedRound, Player } from '@echecs/swiss';
import type {
  Match,
  MatchResult,
  Participant,
  Round,
  StandingRow,
  TournamentState,
  TiebreakKind,
} from '../types';
import { DEFAULT_TIEBREAK_ORDER } from '../types';
import {
  computeDirectEncounter,
  computeFlatTiebreak,
  toCompletedRounds,
  toPlayersForTiebreak,
} from './tiebreaks';

/**
 * Converte os participantes para o formato que a lib de pareamento espera,
 * ordenados por rating (jogadores sem rating entram por último) — essa ordem
 * define a "número de emparceiramento" usada no sorteio da 1ª rodada.
 */
function toPairingPlayers(participants: Participant[]): Player[] {
  const sorted = [...participants].sort((a, b) => {
    if (a.rating === null && b.rating === null) return 0;
    if (a.rating === null) return 1;
    if (b.rating === null) return -1;
    return b.rating - a.rating;
  });
  return sorted.map((p, index) => ({
    id: p.id,
    rating: p.rating ?? undefined,
    points: 0,
    rank: index + 1,
  }));
}

function compareNames(a: StandingRow, b: StandingRow): number {
  return a.participant.name.localeCompare(b.participant.name, 'pt-BR');
}

function isEquivalentUnderPreviousCriteria(
  a: StandingRow,
  b: StandingRow,
  previousKinds: TiebreakKind[],
): boolean {
  if (a.points !== b.points) return false;

  for (const kind of previousKinds) {
    const valueA = kind === 'directEncounter'
      ? a.tiebreaks.directEncounter ?? null
      : a.tiebreaks[kind] ?? null;
    const valueB = kind === 'directEncounter'
      ? b.tiebreaks.directEncounter ?? null
      : b.tiebreaks[kind] ?? null;

    if (valueA === null || valueB === null) continue;
    if (valueA !== valueB) return false;
  }

  return true;
}

function badDirectEncounterGroup(
  group: StandingRow[],
  completedRounds: CompletedRound[],
): boolean {
  const ids = group.map((row) => row.participant.id);

  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      const firstId = ids[i];
      const secondId = ids[j];
      const count = completedRounds.reduce((total, round) => {
        const pairGames = round.games.filter((game) => {
          const isSamePair =
            (game.white === firstId && game.black === secondId) ||
            (game.white === secondId && game.black === firstId);
          if (!isSamePair) return false;
          if ('forfeit' in game && game.forfeit !== undefined) return false;
          return true;
        });
        return total + pairGames.length;
      }, 0);

      if (count !== 1) return true;
    }
  }

  return false;
}

/** Considera uma rodada concluída quando todas as suas partidas têm resultado. */
export function isRoundComplete(round: Round): boolean {
  return round.matches.every((m) => m.result !== null);
}

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}${Date.now().toString(36)}${counter}`;
}

/**
 * Gera a próxima rodada com base nos participantes e nas rodadas já concluídas.
 * Byes recebem ponto cheio automaticamente, já que não há partida a disputar.
 */
export function generateNextRound(
  participants: Participant[],
  rounds: Round[],
): Round {
  const players = toPairingPlayers(participants);
  const completedRounds = toCompletedRounds(rounds);
  const result = pair(players, completedRounds);

  const matches: Match[] = result.games.map((g) => ({
    id: nextId('m'),
    white: g.white,
    black: g.black,
    result: null,
  }));

  const byes = result.byes.map((b) => ({
    id: nextId('b'),
    player: b.player,
  }));

  const noValidMatch = matches.length === 0 && byes.length === 1;
  if (noValidMatch) {
    return { number: completedRounds.length + 1, matches: [], byes: [], isInvalid: true };
  }

  return { number: completedRounds.length + 1, matches, byes, isInvalid: false };
}

/** Calcula a classificação atual somando pontos de todas as partidas e byes já registrados. */
export function computeStandings(state: TournamentState): StandingRow[] {
  const rows = new Map<string, StandingRow>();
  for (const participant of state.participants) {
    rows.set(participant.id, {
      participant,
      points: 0,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      tiebreaks: {},
    });
  }

  for (const round of state.rounds) {
    for (const bye of round.byes) {
      const row = rows.get(bye.player);
      if (row) row.points += 1;
    }

    for (const match of round.matches) {
      if (match.result === null) continue;
      const whiteRow = rows.get(match.white);
      const blackRow = rows.get(match.black);

      if (whiteRow) {
        whiteRow.points += match.result;
        whiteRow.played += 1;
        if (match.result === 1) whiteRow.wins += 1;
        else if (match.result === 0.5) whiteRow.draws += 1;
        else whiteRow.losses += 1;
      }

      if (blackRow) {
        const blackResult: MatchResult = match.result === 1 ? 0 : match.result === 0 ? 1 : 0.5;
        blackRow.points += blackResult;
        blackRow.played += 1;
        if (blackResult === 1) blackRow.wins += 1;
        else if (blackResult === 0.5) blackRow.draws += 1;
        else blackRow.losses += 1;
      }
    }
  }

  const order = state.config.tiebreakOrder ?? DEFAULT_TIEBREAK_ORDER;
  const completedRounds = toCompletedRounds(state.rounds);
  const pointsById = new Map<string, number>();
  for (const row of rows.values()) {
    pointsById.set(row.participant.id, row.points);
  }

  const allPlayers = toPlayersForTiebreak(state.participants, pointsById);
  for (const row of rows.values()) {
    for (const kind of order) {
      if (kind === 'directEncounter') continue;
      row.tiebreaks[kind] = computeFlatTiebreak(kind, row.participant.id, completedRounds, allPlayers);
    }
  }

  let sortedRows = [...rows.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;

    for (const kind of order) {
      if (kind === 'directEncounter') continue;
      const valueA = a.tiebreaks[kind] ?? 0;
      const valueB = b.tiebreaks[kind] ?? 0;
      if (valueB !== valueA) return valueB - valueA;
    }

    return compareNames(a, b);
  });

  for (let i = 0; i < order.length; i += 1) {
    const kind = order[i];
    const previousKinds = order.slice(0, i);
    const groups: StandingRow[][] = [];
    let cursor = 0;

    while (cursor < sortedRows.length) {
      let nextCursor = cursor + 1;
      while (nextCursor < sortedRows.length && isEquivalentUnderPreviousCriteria(sortedRows[cursor], sortedRows[nextCursor], previousKinds)) {
        nextCursor += 1;
      }
      groups.push(sortedRows.slice(cursor, nextCursor));
      cursor = nextCursor;
    }

    const nextSortedRows: StandingRow[] = [];
    for (const group of groups) {
      if (group.length <= 1) {
        nextSortedRows.push(...group);
        continue;
      }

      if (kind === 'directEncounter') {
        if (badDirectEncounterGroup(group, completedRounds)) {
          nextSortedRows.push(...group);
          continue;
        }

        const tiedGroupPlayers = toPlayersForTiebreak(
          group.map((row) => row.participant),
          new Map(group.map((row) => [row.participant.id, row.points])),
        );

        for (const row of group) {
          row.tiebreaks.directEncounter = computeDirectEncounter(
            row.participant.id,
            completedRounds,
            tiedGroupPlayers,
          );
        }

        group.sort((a, b) => {
          const valueA = a.tiebreaks.directEncounter ?? 0;
          const valueB = b.tiebreaks.directEncounter ?? 0;
          if (valueB !== valueA) return valueB - valueA;
          return compareNames(a, b);
        });

        nextSortedRows.push(...group);
        continue;
      }

      group.sort((a, b) => {
        const valueA = a.tiebreaks[kind] ?? 0;
        const valueB = b.tiebreaks[kind] ?? 0;
        if (valueB !== valueA) return valueB - valueA;
        return compareNames(a, b);
      });

      nextSortedRows.push(...group);
    }

    sortedRows = nextSortedRows;
  }

  let finalCursor = 0;
  while (finalCursor < sortedRows.length) {
    let nextCursor = finalCursor + 1;
    while (nextCursor < sortedRows.length && isEquivalentUnderPreviousCriteria(sortedRows[finalCursor], sortedRows[nextCursor], order)) {
      nextCursor += 1;
    }

    const group = sortedRows.slice(finalCursor, nextCursor);
    if (group.length > 1) {
      group.sort((a, b) => compareNames(a, b));
      sortedRows.splice(finalCursor, group.length, ...group);
    }

    finalCursor = nextCursor;
  }

  return sortedRows;
}

export function canGenerateNextRound(state: TournamentState): boolean {
  if (state.participants.length < 2) return false;
  if (state.rounds.length >= state.config.totalRounds) return false;
  if (state.rounds.length === 0) return true;
  const lastRound = state.rounds[state.rounds.length - 1];
  return isRoundComplete(lastRound);
}
