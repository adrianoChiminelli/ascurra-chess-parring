import type { TournamentState } from '../types';
import { parseTournament, SCHEMA_VERSION, type ParseError } from './tournamentSchema';

const APP_ID = 'ascurra-chess';

export const MAX_FILE_SIZE = 1024 * 1024;

export type FileError = ParseError | 'not-json' | 'too-large';

export type FileParseResult = { ok: true; state: TournamentState } | { ok: false; error: FileError };

export const FILE_ERROR_MESSAGES: Record<FileError, string> = {
  'too-large': 'O arquivo é grande demais para ser um torneio (limite de 1 MB).',
  'not-json': 'O arquivo não é um JSON válido.',
  'invalid-format': 'O arquivo não é um torneio exportado por este aplicativo.',
  'newer-version': 'O torneio foi exportado por uma versão mais nova do aplicativo. Atualize a página e tente novamente.',
  inconsistent: 'O arquivo contém dados inconsistentes e não pode ser importado.',
};

export function serializeTournament(state: TournamentState, now: Date = new Date()): string {
  return JSON.stringify({ app: APP_ID, version: SCHEMA_VERSION, exportedAt: now.toISOString(), state }, null, 2);
}

export function parseTournamentFile(text: string): FileParseResult {
  if (text.length > MAX_FILE_SIZE) return { ok: false, error: 'too-large' };

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'not-json' };
  }

  // Arquivos de outro app são recusados; a ausência do campo é tolerada.
  if (typeof data === 'object' && data !== null && 'app' in data && data.app !== APP_ID) {
    return { ok: false, error: 'invalid-format' };
  }
  return parseTournament(data);
}

/** Ex.: "Aberto de Verão" na rodada 3 → "aberto-de-verao-rodada-3.json". */
export function exportFileName(state: TournamentState): string {
  const slug = state.config.name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || 'torneio'}-rodada-${state.rounds.length}.json`;
}
