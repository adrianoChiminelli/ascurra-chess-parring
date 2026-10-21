import { expect, matchCards, railTab, startTournament, test } from './fixtures';

const FOUR = ['Ana, 2000', 'Bruno, 1900', 'Carla, 1800', 'Diego, 1700'];

test('mantém o torneio ao recarregar a página', async ({ page }) => {
  await startTournament(page, { players: FOUR, rounds: 3, name: 'Aberto de Teste' });
  await matchCards(page).first().getByRole('button', { name: '1-0', exact: true }).click();

  await page.reload();

  await expect(page.locator('.app-title')).toContainText('Aberto de Teste');
  await expect(railTab(page, 'Rodada 1')).toHaveClass(/active/);
  await expect(matchCards(page).first().getByRole('button', { name: '1-0', exact: true })).toHaveClass(/selected-win/);
});

test('"Novo torneio" cancelado mantém o torneio', async ({ page }) => {
  await startTournament(page, { players: FOUR });
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Novo torneio' }).click();

  await expect(page.locator('.app-title')).toContainText('Torneio E2E');
});

test('"Novo torneio" confirmado volta para a tela inicial e limpa o salvo', async ({ page }) => {
  await startTournament(page, { players: FOUR });
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Novo torneio' }).click();

  await expect(page.getByRole('heading', { name: 'Configure seu torneio' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Configure seu torneio' })).toBeVisible();
});

test('abre torneio salvo por versão anterior (ids no formato antigo)', async ({ page }) => {
  const legacy = {
    version: 1,
    state: {
      config: {
        name: 'Torneio Legado',
        totalRounds: 3,
        tiebreakOrder: ['buchholzCut1', 'buchholz', 'sonnebornBerger', 'directEncounter', 'numberOfWins'],
      },
      participants: [
        { id: 'pmgx1a2b1', name: 'Ana', rating: 2000 },
        { id: 'pmgx1a2b2', name: 'Bruno', rating: 1900 },
        { id: 'pmgx1a2b3', name: 'Carla', rating: null },
      ],
      rounds: [
        {
          number: 1,
          isInvalid: false,
          matches: [{ id: 'mmgx1a2c4', white: 'pmgx1a2b1', black: 'pmgx1a2b2', result: 0.5 }],
          byes: [{ id: 'bmgx1a2c5', player: 'pmgx1a2b3' }],
        },
      ],
    },
  };

  await page.goto('./');
  await page.evaluate((data) => localStorage.setItem('ascurra-chess:tournament', JSON.stringify(data)), legacy);
  await page.reload();

  await expect(page.locator('.app-title')).toContainText('Torneio Legado');
  await expect(matchCards(page)).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Gerar rodada 2' })).toBeEnabled();
});
