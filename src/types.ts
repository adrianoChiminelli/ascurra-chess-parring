export interface Participant {
  id: string;
  name: string;
  rating: number | null;
}

/** Resultado de uma partida do ponto de vista do jogador das brancas. */
export type MatchResult = 1 | 0.5 | 0;

export interface Match {
  id: string;
  white: string; // participant id
  black: string; // participant id
  result: MatchResult | null; // null = ainda não jogado
}

export interface RoundBye {
  id: string;
  player: string; // participant id — recebe ponto cheio automaticamente
}

export interface Round {
  number: number;
  matches: Match[];
  byes: RoundBye[];
}

export interface TournamentConfig {
  name: string;
  totalRounds: number;
}

export interface TournamentState {
  config: TournamentConfig;
  participants: Participant[];
  rounds: Round[];
}

export interface StandingRow {
  participant: Participant;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
}
