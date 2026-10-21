import { describe, expect, it } from 'vitest';
import { DEFAULT_TIEBREAK_ORDER, type TournamentState } from '../../src/types';
import { parseTournament, SCHEMA_VERSION } from '../../src/lib/tournamentSchema.ts';

function validState(): TournamentState {
  return {
    config: { name: 'Teste', totalRounds: 3, tiebreakOrder: [...DEFAULT_TIEBREAK_ORDER] },
    participants: [
      { id: 'a', name: 'Ana', rating: 1800, startingRank: 1, withdrawnInRound: null },
      { id: 'b', name: 'Bruno', rating: null, startingRank: 2, withdrawnInRound: null },
      { id: 'c', name: 'Carla', rating: null, startingRank: 3, withdrawnInRound: 1 },
    ],
    rounds: [
      {
        number: 1,
        isInvalid: false,
        matches: [{ id: 'm1', white: 'a', black: 'b', result: 1, forfeit: 'black' }],
        byes: [{ id: 'b1', player: 'c' }],
      },
      { number: 2, isInvalid: false, matches: [{ id: 'm2', white: 'b', black: 'a', result: null }], byes: [] },
    ],
  };
}

const envelope = (state: unknown, version = SCHEMA_VERSION) => ({ version, state });

describe('parseTournament', () => {
  it('aceita um torneio válido na versão atual', () => {
    const state = validState();
    expect(parseTournament(envelope(state))).toEqual({ ok: true, state });
  });

  it('migra v1, preservando a ordem de pareamento antiga (rating e depois cadastro)', () => {
    const v1 = {
      config: validState().config,
      participants: [
        { id: 'x', name: 'Xavier', rating: null },
        { id: 'y', name: 'Yara', rating: 1500 },
        { id: 'z', name: 'Zeca', rating: null },
        { id: 'w', name: 'Wilson', rating: 1500 },
      ],
      rounds: [],
    };

    const result = parseTournament(envelope(v1, 1));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.participants.map((p) => [p.id, p.startingRank, p.withdrawnInRound])).toEqual([
      ['x', 3, null],
      ['y', 1, null],
      ['z', 4, null],
      ['w', 2, null],
    ]);
  });

  it('recusa versão mais nova que o app', () => {
    expect(parseTournament(envelope(validState(), SCHEMA_VERSION + 1))).toEqual({ ok: false, error: 'newer-version' });
  });

  it.each([
    ['nulo', null],
    ['sem versão', { state: validState() }],
    ['estado inválido', envelope({ foo: 'bar' })],
    ['v2 sem número inicial', envelope({ ...validState(), participants: [{ id: 'a', name: 'A', rating: null }] })],
  ])('recusa formato inválido: %s', (_, value) => {
    expect(parseTournament(value)).toEqual({ ok: false, error: 'invalid-format' });
  });

  it('recusa W.O. com resultado incoerente', () => {
    const state = validState();
    state.rounds[0].matches[0] = { ...state.rounds[0].matches[0], result: 0 };
    expect(parseTournament(envelope(state))).toEqual({ ok: false, error: 'invalid-format' });
  });

  it.each<[string, (s: TournamentState) => void]>([
    ['partida com participante inexistente', (s) => { s.rounds[1].matches[0].black = 'zzz'; }],
    ['participante duplicado na rodada', (s) => { s.rounds[0].byes[0].player = 'a'; }],
    ['ids de participante repetidos', (s) => { s.participants[1].id = 'a'; }],
    ['números iniciais com lacuna', (s) => { s.participants[2].startingRank = 5; }],
    ['rodadas fora de sequência', (s) => { s.rounds[1].number = 3; }],
    ['resultado pendente em rodada anterior', (s) => { s.rounds[0].matches[0] = { id: 'm1', white: 'a', black: 'b', result: null }; }],
    ['mais rodadas que o total', (s) => { s.config.totalRounds = 1; }],
    ['retirado em rodada inexistente', (s) => { s.participants[2].withdrawnInRound = 5; }],
    ['critério de desempate repetido', (s) => { s.config.tiebreakOrder = ['buchholz', 'buchholz']; }],
  ])('recusa estado inconsistente: %s', (_, mutate) => {
    const state = validState();
    mutate(state);
    expect(parseTournament(envelope(state))).toEqual({ ok: false, error: 'inconsistent' });
  });
});
