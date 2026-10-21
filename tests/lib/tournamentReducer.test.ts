import { describe, expect, it } from 'vitest';
import { DEFAULT_TIEBREAK_ORDER, type Participant } from '../../src/types';
import { tournamentReducer } from '../../src/lib/tournamentReducer.ts';

const participants: Participant[] = ['a', 'b', 'c', 'd'].map((id) => ({ id, name: id, rating: null }));
const config = { name: 'Teste', totalRounds: 3, tiebreakOrder: DEFAULT_TIEBREAK_ORDER };

describe('tournamentReducer', () => {
  it('inicia o torneio com a primeira rodada e reseta para null', () => {
    const started = tournamentReducer(null, { type: 'start', config, participants });

    expect(started?.rounds).toHaveLength(1);
    expect(tournamentReducer(started, { type: 'reset' })).toBeNull();
  });

  it('registra resultados e gera a próxima rodada', () => {
    let current = tournamentReducer(null, { type: 'start', config, participants });
    for (const m of current!.rounds[0].matches) {
      current = tournamentReducer(current, { type: 'setResult', roundNumber: 1, matchId: m.id, result: 1 });
    }
    current = tournamentReducer(current, { type: 'generateNextRound' });

    expect(current?.rounds.map((r) => r.number)).toEqual([1, 2]);
  });

  it('ignora ações de torneio quando não há torneio', () => {
    expect(tournamentReducer(null, { type: 'generateNextRound' })).toBeNull();
  });
});
