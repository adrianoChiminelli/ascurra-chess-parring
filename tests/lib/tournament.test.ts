import { describe, expect, it } from 'vitest';
import type { Match, MatchResult, Participant, Round, TiebreakKind, TournamentState } from '../../src/types';
import { DEFAULT_TIEBREAK_ORDER } from '../../src/types';
import {
  appendNextRound,
  canEditRound,
  canGenerateNextRound,
  computeStandings,
  createTournament,
  generateNextRound,
  isRoundComplete,
  setMatchResult,
} from '../../src/lib/tournament.ts';

function participant(id: string, name = id, rating: number | null = null): Participant {
  return { id, name, rating };
}

function match(white: string, black: string, result: MatchResult | null): Match {
  return { id: `${white}-${black}`, white, black, result };
}

function round(number: number, matches: Match[], byes: string[] = []): Round {
  return { number, matches, byes: byes.map((player) => ({ id: `bye-${player}`, player })), isInvalid: false };
}

function state(
  participants: Participant[],
  rounds: Round[],
  tiebreakOrder: TiebreakKind[] = DEFAULT_TIEBREAK_ORDER,
  totalRounds = 5,
): TournamentState {
  return { config: { name: 'Teste', totalRounds, tiebreakOrder }, participants, rounds };
}

function ranking(s: TournamentState): string[] {
  return computeStandings(s).map((row) => row.participant.id);
}

/**
 * a: 2 pts | b ("Zé") e c ("Ana"): 1 pt cada | d: 0 pts.
 * b venceu c no confronto direto e enfrentou adversários mais fortes (BH 3 x 1).
 */
const players = [participant('a', 'Alfa'), participant('b', 'Zé'), participant('c', 'Ana'), participant('d', 'Delta')];
const rounds = [
  round(1, [match('a', 'b', 1), match('c', 'd', 1)]),
  round(2, [match('a', 'd', 1), match('b', 'c', 1)]),
];

describe('computeStandings', () => {
  it('soma pontos e contabiliza vitórias, empates e derrotas', () => {
    const rows = computeStandings(
      state([participant('a'), participant('b'), participant('c')], [round(1, [match('a', 'b', 0.5)], ['c'])]),
    );
    const byId = new Map(rows.map((row) => [row.participant.id, row]));

    expect(byId.get('a')).toMatchObject({ points: 0.5, played: 1, wins: 0, draws: 1, losses: 0 });
    expect(byId.get('b')).toMatchObject({ points: 0.5, played: 1, wins: 0, draws: 1, losses: 0 });
    // Bye vale ponto cheio, mas não conta como partida jogada.
    expect(byId.get('c')).toMatchObject({ points: 1, played: 0, wins: 0 });
  });

  it('ordena por pontos', () => {
    const result = ranking(state(players, rounds));
    expect(result[0]).toBe('a');
    expect(result[3]).toBe('d');
  });

  it('calcula Buchholz e Buchholz Cut 1', () => {
    const rows = computeStandings(state(players, rounds));
    const byId = new Map(rows.map((row) => [row.participant.id, row.tiebreaks]));

    expect(byId.get('b')).toMatchObject({ buchholz: 3, buchholzCut1: 2 });
    expect(byId.get('c')).toMatchObject({ buchholz: 1, buchholzCut1: 1 });
  });

  it('desempata pelo primeiro critério configurado', () => {
    expect(ranking(state(players, rounds, ['buchholz']))).toEqual(['a', 'b', 'c', 'd']);
  });

  it('desempata pelo confronto direto', () => {
    expect(ranking(state(players, rounds, ['directEncounter']))).toEqual(['a', 'b', 'c', 'd']);
  });

  it('usa ordem alfabética quando todos os critérios empatam', () => {
    // b e c têm 1 vitória cada: só o nome separa ("Ana" antes de "Zé").
    expect(ranking(state(players, rounds, ['numberOfWins']))).toEqual(['a', 'c', 'b', 'd']);
  });
});

describe('generateNextRound', () => {
  it('emparceira todos os jogadores com número par', () => {
    const generated = generateNextRound(players, []);
    const seated = generated.matches.flatMap((m) => [m.white, m.black]).sort();

    expect(generated).toMatchObject({ number: 1, isInvalid: false, byes: [] });
    expect(seated).toEqual(['a', 'b', 'c', 'd']);
  });

  it('atribui bye com número ímpar', () => {
    const generated = generateNextRound([...players, participant('e')], []);

    expect(generated.matches).toHaveLength(2);
    expect(generated.byes).toHaveLength(1);
  });

  it('marca a rodada como inválida quando não há pareamento possível (número par)', () => {
    const two = [participant('a'), participant('b')];
    const generated = generateNextRound(two, [round(1, [match('a', 'b', 1)])]);

    expect(generated).toMatchObject({ number: 2, isInvalid: true, matches: [], byes: [] });
  });

  it('marca a rodada como inválida quando não há pareamento possível (número ímpar)', () => {
    const three = [participant('a'), participant('b'), participant('c')];
    const played = [
      round(1, [match('a', 'b', 0.5)], ['c']),
      round(2, [match('c', 'a', 0.5)], ['b']),
      round(3, [match('b', 'c', 0.5)], ['a']),
    ];

    expect(generateNextRound(three, played).isInvalid).toBe(true);
  });
});

describe('regras de rodada', () => {
  const ongoing = state(players, [...rounds, round(3, [match('a', 'c', null), match('b', 'd', null)])]);

  it('só permite editar a última rodada', () => {
    expect(canEditRound(ongoing, 3)).toBe(true);
    expect(canEditRound(ongoing, 2)).toBe(false);
  });

  it('ignora resultado em rodada anterior', () => {
    expect(setMatchResult(ongoing, 2, 'b-c', 0)).toBe(ongoing);
  });

  it('registra resultado na rodada atual', () => {
    const updated = setMatchResult(ongoing, 3, 'a-c', 0.5);
    expect(updated.rounds[2].matches[0].result).toBe(0.5);
  });

  it('não gera rodada com partidas pendentes', () => {
    expect(canGenerateNextRound(ongoing)).toBe(false);
    expect(appendNextRound(ongoing)).toBe(ongoing);
  });

  it('não gera rodada além do total configurado', () => {
    expect(canGenerateNextRound(state(players, rounds, DEFAULT_TIEBREAK_ORDER, 2))).toBe(false);
  });

  it('rodada inválida não conta como concluída nem altera os desempates', () => {
    const invalid: Round = { number: 3, matches: [], byes: [], isInvalid: true };
    const withInvalid = state(players, [...rounds, invalid]);

    expect(isRoundComplete(invalid)).toBe(false);
    expect(computeStandings(withInvalid)).toEqual(computeStandings(state(players, rounds)));
  });

  it('não gera rodada depois de uma rodada inválida', () => {
    const invalid: Round = { number: 3, matches: [], byes: [], isInvalid: true };
    expect(canGenerateNextRound(state(players, [...rounds, invalid]))).toBe(false);
  });

  it('gera a próxima rodada quando a atual está completa', () => {
    const next = appendNextRound(state(players, rounds));
    expect(next.rounds).toHaveLength(3);
    expect(next.rounds[2].number).toBe(3);
  });

  it('cria o torneio já com a primeira rodada', () => {
    const created = createTournament(state(players, []).config, players);
    expect(created.rounds).toHaveLength(1);
    expect(created.rounds[0].matches).toHaveLength(2);
  });
});
