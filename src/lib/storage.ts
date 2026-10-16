import { TIEBREAK_LABELS } from '../types';
import type {
  Match,
  Participant,
  Round,
  RoundBye,
  TiebreakKind,
  TournamentConfig,
  TournamentState,
} from '../types';

const STORAGE_KEY = 'ascurra-chess:tournament';
const STORAGE_VERSION = 1;

interface StoredTournament {
  version: number;
  state: TournamentState;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0;
}

function isTiebreakKind(value: unknown): value is TiebreakKind {
  return isString(value) && Object.hasOwn(TIEBREAK_LABELS, value);
}

function isParticipant(value: unknown): value is Participant {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    (value.rating === null || Number.isFinite(value.rating))
  );
}

function isMatch(value: unknown): value is Match {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.white) &&
    isString(value.black) &&
    (value.result === null || value.result === 1 || value.result === 0.5 || value.result === 0)
  );
}

function isRoundBye(value: unknown): value is RoundBye {
  return isRecord(value) && isString(value.id) && isString(value.player);
}

function isRound(value: unknown): value is Round {
  return (
    isRecord(value) &&
    isPositiveInteger(value.number) &&
    typeof value.isInvalid === 'boolean' &&
    Array.isArray(value.matches) &&
    value.matches.every(isMatch) &&
    Array.isArray(value.byes) &&
    value.byes.every(isRoundBye)
  );
}

function isTournamentConfig(value: unknown): value is TournamentConfig {
  return (
    isRecord(value) &&
    isString(value.name) &&
    isPositiveInteger(value.totalRounds) &&
    Array.isArray(value.tiebreakOrder) &&
    value.tiebreakOrder.every(isTiebreakKind)
  );
}

function isTournamentState(value: unknown): value is TournamentState {
  return (
    isRecord(value) &&
    isTournamentConfig(value.config) &&
    Array.isArray(value.participants) &&
    value.participants.every(isParticipant) &&
    Array.isArray(value.rounds) &&
    value.rounds.every(isRound)
  );
}

/**
 * Lê o torneio salvo no navegador. Dados ausentes, corrompidos ou de outra
 * versão do formato são descartados para não quebrar a aplicação.
 */
export function loadTournament(): TournamentState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;

    const parsed: unknown = JSON.parse(raw);
    if (
      isRecord(parsed) &&
      parsed.version === STORAGE_VERSION &&
      isTournamentState(parsed.state)
    ) {
      return parsed.state;
    }
  } catch {
    // localStorage indisponível ou JSON inválido: segue como se não houvesse dados.
  }

  clearTournament();
  return null;
}

export function saveTournament(state: TournamentState): void {
  const payload: StoredTournament = { version: STORAGE_VERSION, state };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    // Quota excedida ou storage bloqueado (ex.: modo privado): o torneio segue só em memória.
    console.warn('Não foi possível salvar o torneio no navegador.', error);
  }
}

export function clearTournament(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignora: não há o que limpar se o storage está indisponível.
  }
}
