import { pair } from '@echecs/swiss';
import type { CompletedRound, Player } from '@echecs/swiss';
import type {
  Match,
  MatchResult,
  Participant,
  ParticipantDraft,
  Round,
  StandingRow,
  TournamentConfig,
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
import { createId } from './ids';
import { drawStartingRanks, type RandomSource } from './startingRank';
import { MAX_NAME_LENGTH } from './participants';

/** Participantes que ainda podem ser emparceirados. */
export function activeParticipants(participants: Participant[]): Participant[] {
  return participants.filter((p) => p.withdrawnInRound === null);
}

/**
 * Converte os participantes ativos para o formato da lib de pareamento. O rank
 * segue o número inicial, renumerado sem lacunas deixadas por retirados. A lib
 * aceita histórico com jogadores fora da lista (retirados).
 */
function toPairingPlayers(participants: Participant[]): Player[] {
  return [...activeParticipants(participants)]
    .sort((a, b) => a.startingRank - b.startingRank)
    .map((p, index) => ({
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

/**
 * Considera uma rodada concluída quando todas as suas partidas têm resultado.
 * Rodada inválida (sem pareamento possível) nunca é concluída: não foi disputada.
 */
export function isRoundComplete(round: Round): boolean {
  return !round.isInvalid && round.matches.every((m) => m.result !== null);
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
  if (players.length < 2) {
    return { number: completedRounds.length + 1, matches: [], byes: [], isInvalid: true };
  }
  const result = pair(players, completedRounds);

  const matches: Match[] = result.games.map((g) => ({
    id: createId(),
    white: g.white,
    black: g.black,
    result: null,
  }));

  const byes = result.byes.map((b) => ({
    id: createId(),
    player: b.player,
  }));

  // Sem nenhuma partida possível (todos já se enfrentaram), o pair() devolve
  // games vazio — com ou sem bye, dependendo da paridade de jogadores.
  if (matches.length === 0) {
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

      // W.O. conta ponto e vitória/derrota, mas não é partida jogada.
      const played = match.forfeit === undefined ? 1 : 0;

      if (whiteRow) {
        whiteRow.points += match.result;
        whiteRow.played += played;
        if (match.result === 1) whiteRow.wins += 1;
        else if (match.result === 0.5) whiteRow.draws += 1;
        else whiteRow.losses += 1;
      }

      if (blackRow) {
        const blackResult: MatchResult = match.result === 1 ? 0 : match.result === 0 ? 1 : 0.5;
        blackRow.points += blackResult;
        blackRow.played += played;
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
  if (activeParticipants(state.participants).length < 2) return false;
  if (state.rounds.length >= state.config.totalRounds) return false;
  if (state.rounds.length === 0) return true;
  const lastRound = state.rounds[state.rounds.length - 1];
  return isRoundComplete(lastRound);
}

/**
 * Só a última rodada aceita resultados: as anteriores já serviram de base
 * para pareamentos seguintes, e alterá-las deixaria o torneio inconsistente.
 */
export function canEditRound(state: TournamentState, roundNumber: number): boolean {
  const lastRound = state.rounds[state.rounds.length - 1];
  return lastRound !== undefined && lastRound.number === roundNumber;
}

export function createTournament(
  config: TournamentConfig,
  drafts: ParticipantDraft[],
  random: RandomSource = Math.random,
): TournamentState {
  const participants: Participant[] = drawStartingRanks(drafts, random).map((p) => ({ ...p, withdrawnInRound: null }));
  return { config, participants, rounds: [generateNextRound(participants, [])] };
}

export function setMatchResult(
  state: TournamentState,
  roundNumber: number,
  matchId: string,
  result: MatchResult | null,
): TournamentState {
  if (!canEditRound(state, roundNumber)) return state;

  const rounds = state.rounds.map((round) =>
    round.number !== roundNumber
      ? round
      : {
          ...round,
          // Resultado de W.O. é definido pela retirada e não pode ser alterado.
          matches: round.matches.map((m) => (m.id === matchId && m.forfeit === undefined ? { ...m, result } : m)),
        },
  );
  return { ...state, rounds };
}

/** Nome válido: sem espaços nas pontas, não vazio e dentro do limite. */
export function normalizeParticipantName(name: string): string | null {
  const trimmed = name.trim();
  return trimmed && trimmed.length <= MAX_NAME_LENGTH ? trimmed : null;
}

export function renameParticipant(state: TournamentState, participantId: string, name: string): TournamentState {
  const normalized = normalizeParticipantName(name);
  if (normalized === null) return state;

  return {
    ...state,
    participants: state.participants.map((p) => (p.id === participantId ? { ...p, name: normalized } : p)),
  };
}

/** Partida sem resultado do participante na rodada atual, se houver. */
export function pendingMatchOf(state: TournamentState, participantId: string): Match | undefined {
  const lastRound = state.rounds[state.rounds.length - 1];
  return lastRound?.matches.find(
    (m) => m.result === null && (m.white === participantId || m.black === participantId),
  );
}

/**
 * Retira o participante do torneio: ele mantém os pontos e continua no placar,
 * mas não é mais emparceirado. A partida pendente na rodada atual vira W.O.
 * para o adversário; resultados já registrados e byes são preservados.
 */
export function withdrawParticipant(state: TournamentState, participantId: string): TournamentState {
  const participant = state.participants.find((p) => p.id === participantId);
  const lastRound = state.rounds[state.rounds.length - 1];
  if (!participant || participant.withdrawnInRound !== null || !lastRound) return state;

  const pending = pendingMatchOf(state, participantId);
  const forfeited = (m: Match): Match =>
    m.white === participantId ? { ...m, result: 0, forfeit: 'white' } : { ...m, result: 1, forfeit: 'black' };

  return {
    ...state,
    participants: state.participants.map((p) =>
      p.id === participantId ? { ...p, withdrawnInRound: lastRound.number } : p,
    ),
    rounds: state.rounds.map((round) =>
      round !== lastRound || !pending
        ? round
        : { ...round, matches: round.matches.map((m) => (m.id === pending.id ? forfeited(m) : m)) },
    ),
  };
}

export function appendNextRound(state: TournamentState): TournamentState {
  if (!canGenerateNextRound(state)) return state;
  return { ...state, rounds: [...state.rounds, generateNextRound(state.participants, state.rounds)] };
}

function pairingSignature(round: Round): string {
  const games = round.matches.map((m) => `${m.white}>${m.black}`).sort();
  const byes = round.byes.map((b) => b.player).sort();
  return `${games.join(',')}|${byes.join(',')}`;
}

/**
 * Rodada 1: sempre (novo sorteio). Demais: só se o pareamento mudaria — o
 * sistema suíço é determinístico, então refazer sem mudança (ex.: retirada)
 * repetiria exatamente os mesmos pares.
 */
export function canRepairCurrentRound(state: TournamentState): boolean {
  const lastRound = state.rounds[state.rounds.length - 1];
  if (!lastRound || activeParticipants(state.participants).length < 2) return false;
  if (lastRound.number === 1) return true;

  const simulated = generateNextRound(state.participants, state.rounds.slice(0, -1));
  return pairingSignature(simulated) !== pairingSignature(lastRound);
}

/** Desfaz a rodada atual (resultados e W.O. incluídos) e emparceira de novo. */
export function repairCurrentRound(state: TournamentState, random: RandomSource = Math.random): TournamentState {
  if (!canRepairCurrentRound(state)) return state;

  const previousRounds = state.rounds.slice(0, -1);
  const participants =
    previousRounds.length === 0
      ? drawStartingRanks(state.participants, random)
      : state.participants;

  return { ...state, participants, rounds: [...previousRounds, generateNextRound(participants, previousRounds)] };
}
