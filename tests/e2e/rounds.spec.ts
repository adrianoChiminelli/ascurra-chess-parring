import {
  byeCards,
  expect,
  generateNextRound,
  matchCards,
  playRound,
  railTab,
  setAllResults,
  standingsPoints,
  startTournament,
  test,
} from './fixtures';

const FOUR = ['Ana, 2000', 'Bruno, 1900', 'Carla, 1800', 'Diego, 1700'];

test.describe('fluxo do torneio', () => {
  test('4 participantes geram 2 mesas sem bye', async ({ page }) => {
    await startTournament(page, { players: FOUR, rounds: 3 });

    await expect(page.getByRole('heading', { name: 'Rodada 1' })).toBeVisible();
    await expect(matchCards(page)).toHaveCount(2);
    await expect(byeCards(page)).toHaveCount(0);
  });

  test('5 participantes geram 2 mesas e 1 bye', async ({ page }) => {
    await startTournament(page, { players: [...FOUR, 'Eva, 1600'], rounds: 3 });

    await expect(matchCards(page)).toHaveCount(2);
    await expect(byeCards(page)).toHaveCount(1);
    await expect(byeCards(page)).toContainText('Folga · 1 ponto');
  });

  test('próxima rodada só é liberada com todos os resultados', async ({ page }) => {
    await startTournament(page, { players: FOUR, rounds: 3 });
    const next = page.getByRole('button', { name: 'Gerar rodada 2' });

    await expect(next).toBeDisabled();
    await matchCards(page).first().getByRole('button', { name: '1-0', exact: true }).click();
    await expect(next).toBeDisabled();

    await setAllResults(page);
    await expect(next).toBeEnabled();

    await generateNextRound(page, 2);
    await expect(railTab(page, 'Rodada 2')).toHaveClass(/active/);
  });

  test('placar soma vitórias, empates e bye', async ({ page }) => {
    await startTournament(page, { players: [...FOUR, 'Eva, 1600'], rounds: 3 });
    const cards = matchCards(page);
    await cards.nth(0).getByRole('button', { name: '1-0', exact: true }).click();
    await cards.nth(1).getByRole('button', { name: '0.5-0.5', exact: true }).click();

    // 1 vitória (1), 2 empates (0.5), 1 bye (1), 1 derrota (0).
    expect(await standingsPoints(page)).toEqual([1, 1, 0.5, 0.5, 0]);
  });
});

test.describe('rodadas anteriores', () => {
  test('ficam somente leitura depois de gerar a próxima', async ({ page }) => {
    await startTournament(page, { players: FOUR, rounds: 3 });
    await playRound(page, 2);
    const pointsBefore = await standingsPoints(page);

    await railTab(page, 'Rodada 1').click();
    await expect(page.locator('.panel-subtitle')).toContainText('somente leitura');

    for (const label of ['1-0', '0.5-0.5', '0-1']) {
      for (const button of await page.getByRole('button', { name: label, exact: true }).all()) {
        await expect(button).toBeDisabled();
      }
    }
    await expect(page.locator('.result-btn.selected-win')).toHaveCount(2);
    expect(await standingsPoints(page)).toEqual(pointsBefore);
  });

  test('rodada atual continua editável', async ({ page }) => {
    await startTournament(page, { players: FOUR, rounds: 3 });
    const first = matchCards(page).first();

    await first.getByRole('button', { name: '1-0', exact: true }).click();
    await first.getByRole('button', { name: '0-1', exact: true }).click();

    await expect(first.getByRole('button', { name: '0-1', exact: true })).toHaveClass(/selected-win/);
    await expect(first.getByRole('button', { name: '1-0', exact: true })).not.toHaveClass(/selected-win/);
  });
});

test.describe('rodada sem pareamento possível', () => {
  const invalidMessage = 'Não há mais partidas válidas';

  test('número par: 2 jogadores na rodada 2', async ({ page }) => {
    await startTournament(page, { players: ['Ana', 'Bruno'], rounds: 3 });
    await playRound(page, 2);

    await expect(page.getByText(invalidMessage)).toBeVisible();
    await expect(page.locator('.match-card')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Gerar rodada/ })).toHaveCount(0);
    await expect(railTab(page, 'Rodada 2').locator('.tab-rail-round-badge')).toHaveCount(0);
  });

  test('número ímpar: 3 jogadores na rodada 4', async ({ page }) => {
    await startTournament(page, { players: ['Ana', 'Bruno', 'Carla'], rounds: 5 });
    await playRound(page, 2);
    await playRound(page, 3);
    await playRound(page, 4);

    await expect(page.getByText(invalidMessage)).toBeVisible();
    await expect(page.locator('.match-card')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Gerar rodada/ })).toHaveCount(0);
    expect((await standingsPoints(page)).reduce((a, b) => a + b, 0)).toBe(6);
  });
});
