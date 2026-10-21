import { expect, matchCards, test } from './fixtures';

const participants = [
  { id: 'a', name: 'Ana', rating: 2000, startingRank: 1, withdrawnInRound: null },
  { id: 'b', name: 'Bruno', rating: 1900, startingRank: 2, withdrawnInRound: null },
  { id: 'c', name: 'Carla', rating: 1800, startingRank: 3, withdrawnInRound: null },
  { id: 'd', name: 'Diego', rating: 1700, startingRank: 4, withdrawnInRound: null },
];

const exported = {
  app: 'ascurra-chess',
  version: 2,
  exportedAt: '2026-10-20T12:00:00.000Z',
  state: {
    config: {
      name: 'Torneio Importado',
      totalRounds: 3,
      tiebreakOrder: ['buchholzCut1', 'buchholz', 'sonnebornBerger', 'directEncounter', 'numberOfWins'],
    },
    participants,
    rounds: [
      {
        number: 1,
        isInvalid: false,
        matches: [
          { id: 'm1', white: 'a', black: 'c', result: 1 },
          { id: 'm2', white: 'd', black: 'b', result: 0 },
        ],
        byes: [],
      },
      {
        number: 2,
        isInvalid: false,
        matches: [
          { id: 'm3', white: 'b', black: 'a', result: null },
          { id: 'm4', white: 'c', black: 'd', result: null },
        ],
        byes: [],
      },
    ],
  },
};

async function importFile(page: import('@playwright/test').Page, content: string, name = 'torneio.json') {
  await page.goto('./');
  await page.getByTestId('import-file-input').setInputFiles({ name, mimeType: 'application/json', buffer: Buffer.from(content) });
}

test('importa um torneio exportado e continua de onde parou', async ({ page }) => {
  await importFile(page, JSON.stringify(exported));

  await expect(page.locator('.app-title')).toContainText('Torneio Importado');
  await expect(page.getByRole('heading', { name: 'Rodada 2' })).toBeVisible();
  await expect(matchCards(page)).toHaveCount(2);

  // Persistido: sobrevive a um reload.
  await page.reload();
  await expect(page.locator('.app-title')).toContainText('Torneio Importado');
});

test.describe('arquivos inválidos', () => {
  const cases: [string, string, RegExp][] = [
    ['não é JSON', 'isto não é json', /não é um JSON válido/],
    ['outro formato', JSON.stringify({ foo: 'bar' }), /não é um torneio exportado/],
    ['versão mais nova', JSON.stringify({ ...exported, version: 99 }), /versão mais nova/],
    [
      'dados inconsistentes',
      JSON.stringify({ ...exported, state: { ...exported.state, participants: participants.slice(1) } }),
      /dados inconsistentes/,
    ],
  ];

  for (const [label, content, message] of cases) {
    test(`mostra erro e permanece na tela inicial: ${label}`, async ({ page }) => {
      await importFile(page, content);

      await expect(page.getByRole('alert')).toHaveText(message);
      await expect(page.getByRole('heading', { name: 'Configure seu torneio' })).toBeVisible();
    });
  }

  test('o aviso pode ser fechado e o mesmo arquivo reenviado', async ({ page }) => {
    await importFile(page, 'x');
    await page.getByRole('button', { name: 'Fechar aviso' }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);

    await page.getByTestId('import-file-input').setInputFiles({ name: 'torneio.json', mimeType: 'application/json', buffer: Buffer.from('x') });
    await expect(page.getByRole('alert')).toBeVisible();
  });
});
