import type { MatchResult, ParticipantDraft, TournamentConfig, TournamentState } from '../types';
import { appendNextRound, createTournament, setMatchResult } from './tournament.ts';

export type TournamentAction =
  | { type: 'start'; config: TournamentConfig; participants: ParticipantDraft[] }
  | { type: 'import'; state: TournamentState }
  | { type: 'setResult'; roundNumber: number; matchId: string; result: MatchResult | null }
  | { type: 'generateNextRound' }
  | { type: 'reset' };

export function tournamentReducer(
  state: TournamentState | null,
  action: TournamentAction,
): TournamentState | null {
  switch (action.type) {
    case 'start':
      return createTournament(action.config, action.participants);
    case 'import':
      return action.state;
    case 'reset':
      return null;
    case 'setResult':
      return state && setMatchResult(state, action.roundNumber, action.matchId, action.result);
    case 'generateNextRound':
      return state && appendNextRound(state);
  }
}
