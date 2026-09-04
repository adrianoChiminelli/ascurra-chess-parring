import { buchholz } from '@echecs/buchholz';
import { buchholzCut1 } from '@echecs/buchholz/cut1';
import { directEncounter } from '@echecs/direct-encounter';
import { numberOfWins } from '@echecs/number-of-wins';
import { sonnebornBerger } from '@echecs/sonneborn-berger';
import type { CompletedRound } from '@echecs/swiss';

import type { Participant, Round, TiebreakKind } from '../types';

export type TiebreakPlayer = {
  id: string;
  points: number;
  rank: number;
  name?: string;
  rating?: number;
};

export function toCompletedRounds(rounds: Round[]): CompletedRound[] {
  return rounds
    .filter((round) => round.matches.every((match) => match.result !== null))
    .map((round) => ({
      byes: round.byes.map((bye) => ({
        kind: 'pairing' as const,
        player: bye.player,
      })),
      games: round.matches.map((match) => ({
        white: match.white,
        black: match.black,
        result: match.result === 1 ? 'white' : match.result === 0 ? 'black' : 'draw',
      })),
    }));
}

export function toPlayersForTiebreak(
  participants: Participant[],
  pointsById: Map<string, number>,
): TiebreakPlayer[] {
  return participants.map((participant, index) => ({
    id: participant.id,
    name: participant.name,
    rating: participant.rating ?? undefined,
    points: pointsById.get(participant.id) ?? 0,
    rank: index + 1,
  }));
}

export function computeFlatTiebreak(
  kind: Exclude<TiebreakKind, 'directEncounter'>,
  playerId: string,
  completedRounds: CompletedRound[],
  players: TiebreakPlayer[],
): number {
  switch (kind) {
    case 'buchholzCut1':
      return buchholzCut1(playerId, completedRounds, players);
    case 'buchholz':
      return buchholz(playerId, completedRounds, players);
    case 'sonnebornBerger':
      return sonnebornBerger(playerId, completedRounds, players);
    case 'numberOfWins':
      return numberOfWins(playerId, completedRounds, players);
    default:
      return 0;
  }
}

export function computeDirectEncounter(
  playerId: string,
  completedRounds: CompletedRound[],
  tiedGroupPlayers: TiebreakPlayer[],
): number {
  return directEncounter(playerId, completedRounds, tiedGroupPlayers);
}
