import { TIEBREAK_LABELS } from '../types';
import type {
  Match,
  Participant,
  ParticipantDraft,
  Round,
  RoundBye,
  TiebreakKind,
  TournamentConfig,
  TournamentState,
} from '../types';
import { sortByRating } from './startingRank';

/** Versão do formato do torneio salvo (localStorage e arquivo exportado). */
export const SCHEMA_VERSION = 2;

export type ParseError = 'invalid-format' | 'newer-version' | 'inconsistent';

export type ParseResult = { ok: true; state: TournamentState } | { ok: false; error: ParseError };

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

function isParticipantDraft(value: unknown): value is ParticipantDraft {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    (value.rating === null || Number.isFinite(value.rating))
  );
}

function isParticipant(value: unknown): value is Participant {
  return (
    isRecord(value) &&
    isParticipantDraft(value) &&
    isPositiveInteger(value.startingRank) &&
    (value.withdrawnInRound === null || isPositiveInteger(value.withdrawnInRound))
  );
}

function isMatch(value: unknown): value is Match {
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.white) ||
    !isString(value.black) ||
    !(value.result === null || value.result === 1 || value.result === 0.5 || value.result === 0)
  ) {
    return false;
  }
  // W.O. implica vitória do outro lado.
  if (value.forfeit === undefined) return true;
  return (value.forfeit === 'black' && value.result === 1) || (value.forfeit === 'white' && value.result === 0);
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

function isTournamentShape(value: unknown, isParticipantOfVersion: (v: unknown) => boolean): boolean {
  return (
    isRecord(value) &&
    isTournamentConfig(value.config) &&
    Array.isArray(value.participants) &&
    value.participants.every(isParticipantOfVersion) &&
    Array.isArray(value.rounds) &&
    value.rounds.every(isRound)
  );
}

/**
 * v1 → v2: adiciona número inicial e status de retirada. O número inicial
 * reproduz a ordem que a v1 usava (rating e depois ordem de cadastro), então
 * os pareamentos de torneios em andamento não mudam.
 */
function migrateV1(state: UnknownRecord): UnknownRecord {
  const participants = state.participants as ParticipantDraft[];
  const rankById = new Map(sortByRating(participants).map((p, index) => [p.id, index + 1]));
  return {
    ...state,
    participants: participants.map((p) => ({ ...p, startingRank: rankById.get(p.id), withdrawnInRound: null })),
  };
}

/** Regras que o formato não garante sozinho: referências, sequência e unicidade. */
export function isConsistent(state: TournamentState): boolean {
  const ids = new Set(state.participants.map((p) => p.id));
  if (ids.size !== state.participants.length) return false;

  const ranks = state.participants.map((p) => p.startingRank).sort((a, b) => a - b);
  if (ranks.some((rank, index) => rank !== index + 1)) return false;

  if (new Set(state.config.tiebreakOrder).size !== state.config.tiebreakOrder.length) return false;
  if (state.rounds.length > state.config.totalRounds) return false;
  if (state.participants.some((p) => p.withdrawnInRound !== null && p.withdrawnInRound > state.rounds.length)) {
    return false;
  }

  const lastIndex = state.rounds.length - 1;
  return state.rounds.every((round, index) => {
    if (round.number !== index + 1) return false;
    // Só a última rodada pode ter resultado pendente.
    if (index < lastIndex && round.matches.some((m) => m.result === null)) return false;

    const seated = [...round.matches.flatMap((m) => [m.white, m.black]), ...round.byes.map((b) => b.player)];
    return seated.every((id) => ids.has(id)) && new Set(seated).size === seated.length;
  });
}

/** Lê o envelope `{ version, state }`, migrando versões antigas. */
export function parseTournament(envelope: unknown): ParseResult {
  if (!isRecord(envelope) || !isPositiveInteger(envelope.version)) return { ok: false, error: 'invalid-format' };
  if (envelope.version > SCHEMA_VERSION) return { ok: false, error: 'newer-version' };

  let state = envelope.state;
  if (envelope.version === 1) {
    if (!isTournamentShape(state, isParticipantDraft)) return { ok: false, error: 'invalid-format' };
    state = migrateV1(state as UnknownRecord);
  }

  if (!isTournamentShape(state, isParticipant)) return { ok: false, error: 'invalid-format' };
  const tournament = state as TournamentState;
  return isConsistent(tournament) ? { ok: true, state: tournament } : { ok: false, error: 'inconsistent' };
}
