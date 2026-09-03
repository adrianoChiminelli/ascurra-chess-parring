import { pair } from '@echecs/swiss';
import type { CompletedRound, Player } from '@echecs/swiss';
import type {
  Match,
  MatchResult,
  Participant,
  Round,
  StandingRow,
  TournamentState,
} from '../types';

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

function toGameResult(result: MatchResult): 'white' | 'black' | 'draw' {
  if (result === 1) return 'white';
  if (result === 0) return 'black';
  return 'draw';
}

/** Considera uma rodada concluída quando todas as suas partidas têm resultado. */
export function isRoundComplete(round: Round): boolean {
  return round.matches.every((m) => m.result !== null);
}

/** Converte as rodadas já concluídas para o formato exigido pela lib. */
function toCompletedRounds(rounds: Round[]): CompletedRound[] {
  return rounds.filter(isRoundComplete).map((round) => ({
    byes: round.byes.map((b) => ({ kind: 'pairing' as const, player: b.player })),
    games: round.matches.map((m) => ({
      white: m.white,
      black: m.black,
      result: toGameResult(m.result as MatchResult),
    })),
  }));
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
  if(noValidMatch) {
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

  return [...rows.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.participant.name.localeCompare(b.participant.name, 'pt-BR');
  });
}

export function canGenerateNextRound(state: TournamentState): boolean {
  if (state.participants.length < 2) return false;
  if (state.rounds.length >= state.config.totalRounds) return false;
  if (state.rounds.length === 0) return true;
  const lastRound = state.rounds[state.rounds.length - 1];
  return isRoundComplete(lastRound);
}
