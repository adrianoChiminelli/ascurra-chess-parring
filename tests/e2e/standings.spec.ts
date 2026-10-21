import { expect, playRound, railTab, test, startTournament } from './fixtures';

const FOUR = ['Ana, 2000', 'Bruno, 1900', 'Carla, 1800', 'Diego, 1700'];

test('tooltip de desempate flutua sem alterar o layout da tabela', async ({ page }) => {
  await startTournament(page, { players: FOUR, rounds: 3 });
  await playRound(page, 2);
  await railTab(page, 'Placar').click();

  const wrap = page.locator('.standings-table-wrap');
  const sizeBefore = await wrap.evaluate((el) => ({ w: el.scrollWidth, h: el.scrollHeight }));

  const icons = page.locator('.standings-table .hint-icon');
  for (const icon of await icons.all()) {
    await icon.hover();
    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toBeVisible();

    // Renderizado fora da tabela e dentro da viewport.
    expect(await tooltip.evaluate((el) => el.parentElement === document.body)).toBe(true);
    const box = (await tooltip.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);

    expect(await wrap.evaluate((el) => ({ w: el.scrollWidth, h: el.scrollHeight }))).toEqual(sizeBefore);
  }

  await page.mouse.move(0, 0);
  await expect(page.getByRole('tooltip')).toHaveCount(0);
});

test('ordem dos critérios configurada define as colunas do placar', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /Critérios de desempate/ }).click();
  await page.getByRole('button', { name: 'Remover Buchholz Cut 1' }).click();
  await page.getByRole('button', { name: 'Remover Número de vitórias' }).click();

  await page.getByRole('button', { name: 'Em lote' }).click();
  await page.getByPlaceholder(/Um participante por linha/).fill(FOUR.join('\n'));
  await page.getByRole('button', { name: 'Adicionar lista' }).click();
  await page.getByRole('button', { name: 'Iniciar torneio' }).click();
  await railTab(page, 'Placar').click();

  const headers = await page.locator('.standings-table thead th').allInnerTexts();
  expect(headers.map((h) => h.trim()).slice(4)).toEqual(['BH', 'SB', 'CD']);
});
