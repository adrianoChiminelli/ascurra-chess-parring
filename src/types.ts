export interface Participant {
  id: string;
  name: string;
  rating: number | null;
}

/** Resultado de uma partida do ponto de vista do jogador das brancas. */
export type MatchResult = 1 | 0.5 | 0;

export type TiebreakKind =
  | 'buchholzCut1'
  | 'buchholz'
  | 'sonnebornBerger'
  | 'directEncounter'
  | 'numberOfWins';

export const TIEBREAK_LABELS: Record<
  TiebreakKind,
  { short: string; long: string; description: string }
> = {
  buchholzCut1: {
    short: 'BH-C1',
    long: 'Buchholz Cut 1',
    description: 'Soma os pontos dos adversários, descartando o de menor pontuação.',
  },
  buchholz: {
    short: 'BH',
    long: 'Buchholz Total',
    description: 'Soma os pontos de todos os adversários enfrentados.',
  },
  sonnebornBerger: {
    short: 'SB',
    long: 'Sonneborn-Berger',
    description: 'Pontos dos adversários vencidos, mais metade dos empatados.',
  },
  directEncounter: {
    short: 'CD',
    long: 'Confronto direto',
    description: 'Resultado das partidas entre os próprios jogadores empatados.',
  },
  numberOfWins: {
    short: 'V',
    long: 'Número de vitórias',
    description: 'Quantidade total de partidas vencidas pelo participante.',
  },
};

export const DEFAULT_TIEBREAK_ORDER: TiebreakKind[] = [
  'buchholzCut1',
  'buchholz',
  'sonnebornBerger',
  'directEncounter',
  'numberOfWins',
];

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
  isInvalid: boolean;
}

export interface TournamentConfig {
  name: string;
  totalRounds: number;
  tiebreakOrder: TiebreakKind[];
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
  tiebreaks: Partial<Record<TiebreakKind, number>>;
}
