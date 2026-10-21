import { describe, expect, it } from 'vitest';
import { DEFAULT_TIEBREAK_ORDER, type TournamentState } from '../../src/types';
import { exportFileName, MAX_FILE_SIZE, parseTournamentFile, serializeTournament } from '../../src/lib/tournamentFile.ts';
import { createTournament } from '../../src/lib/tournament.ts';
import { seededRandom } from './random.ts';

function tournament(name = 'Aberto de Verão'): TournamentState {
  const drafts = ['Ana', 'Bruno', 'Carla', 'Diego'].map((n) => ({ id: n.toLowerCase(), name: n, rating: null }));
  return createTournament({ name, totalRounds: 3, tiebreakOrder: DEFAULT_TIEBREAK_ORDER }, drafts, seededRandom(1));
}

describe('arquivo de torneio', () => {
  it('exporta e importa de volta o mesmo estado', () => {
    const state = tournament();
    expect(parseTournamentFile(serializeTournament(state))).toEqual({ ok: true, state });
  });

  it('inclui identificação do app, versão e data de exportação', () => {
    const data = JSON.parse(serializeTournament(tournament(), new Date('2026-10-20T12:00:00Z')));
    expect(data).toMatchObject({ app: 'ascurra-chess', version: 2, exportedAt: '2026-10-20T12:00:00.000Z' });
  });

  it('aceita o envelope do localStorage (sem o campo app)', () => {
    const state = tournament();
    expect(parseTournamentFile(JSON.stringify({ version: 2, state }))).toEqual({ ok: true, state });
  });

  it('recusa arquivo de outro app', () => {
    const data = { ...JSON.parse(serializeTournament(tournament())), app: 'outro-app' };
    expect(parseTournamentFile(JSON.stringify(data))).toEqual({ ok: false, error: 'invalid-format' });
  });

  it('recusa conteúdo que não é JSON', () => {
    expect(parseTournamentFile('não é json')).toEqual({ ok: false, error: 'not-json' });
  });

  it('recusa conteúdo acima do limite', () => {
    expect(parseTournamentFile(' '.repeat(MAX_FILE_SIZE + 1))).toEqual({ ok: false, error: 'too-large' });
  });

  it('propaga erros de validação do torneio', () => {
    const data = JSON.parse(serializeTournament(tournament()));
    data.state.rounds[0].matches[0].white = 'inexistente';
    expect(parseTournamentFile(JSON.stringify(data))).toEqual({ ok: false, error: 'inconsistent' });
  });
});

describe('exportFileName', () => {
  it('gera nome sem acentos com a rodada atual', () => {
    expect(exportFileName(tournament('Aberto de Verão — 2026!'))).toBe('aberto-de-verao-2026-rodada-1.json');
  });

  it('usa nome padrão quando não sobra nada do nome', () => {
    expect(exportFileName(tournament('???'))).toBe('torneio-rodada-1.json');
  });
});
