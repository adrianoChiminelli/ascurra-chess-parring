import type { TournamentState } from '../types';
import { parseTournament, SCHEMA_VERSION } from './tournamentSchema';

const STORAGE_KEY = 'ascurra-chess:tournament';

/**
 * Lê o torneio salvo no navegador, migrando formatos antigos. Dados ausentes,
 * corrompidos ou inconsistentes são descartados para não quebrar a aplicação.
 */
export function loadTournament(): TournamentState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;

    const result = parseTournament(JSON.parse(raw));
    if (result.ok) return result.state;
    // Salvo por uma versão mais nova do app: preserva em vez de apagar.
    if (result.error === 'newer-version') return null;
  } catch {
    // localStorage indisponível ou JSON inválido: segue como se não houvesse dados.
  }

  clearTournament();
  return null;
}

export function saveTournament(state: TournamentState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, state }));
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
