import { readFile } from 'node:fs/promises';
import { expect, matchCards, railTab, setAllResults, startLongTournament, startTournament, test } from './fixtures';

const FOUR = ['Ana, 2000', 'Bruno, 1900', 'Carla, 1800', 'Diego, 1700'];

test('exporta o torneio e o arquivo reimporta o mesmo estado', async ({ page }) => {
  await startTournament(page, { players: FOUR, rounds: 3, name: 'Aberto de Verão' });
  await setAllResults(page, '0.5-0.5');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar torneio' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('aberto-de-verao-rodada-1.json');

  const content = await readFile((await download.path())!, 'utf8');
  const file = JSON.parse(content);
  expect(file).toMatchObject({ app: 'ascurra-chess', version: 2 });
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('ascurra-chess:tournament')!).state);
  expect(file.state).toEqual(saved);

  // Reimporta em uma sessão limpa.
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Novo torneio' }).click();
  await page.getByTestId('import-file-input').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from(content) });
  await expect(page.locator('.app-title')).toContainText('Aberto de Verão');
  await expect(matchCards(page).locator('.result-btn.selected-draw')).toHaveCount(2);
});

test('aba de manutenção lista participantes com número inicial, pontos e status', async ({ page }) => {
  await startTournament(page, { players: FOUR, rounds: 3 });
  await setAllResults(page, '0.5-0.5');
  await page.getByRole('button', { name: 'Manutenção' }).click();

  await expect(page.getByRole('heading', { name: 'Manutenção' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Manutenção' })).toHaveClass(/active/);
  const rows = page.locator('.maintenance-table tbody tr');
  await expect(rows).toHaveCount(4);
  // Ratings distintos: o número inicial segue o rating.
  await expect(rows.locator('.maintenance-name')).toHaveText(['Ana', 'Bruno', 'Carla', 'Diego']);
  await expect(rows.locator('.standings-points')).toHaveText(['0.5', '0.5', '0.5', '0.5']);
  await expect(rows.locator('.status-tag')).toHaveText(Array(4).fill('Ativo'));
});

test('com muitas rodadas, botões do rodapé e rodada atual continuam visíveis', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await startLongTournament(page);

  await expect(page.getByRole('button', { name: 'Exportar torneio' })).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Manutenção' })).toBeInViewport();
  await expect(railTab(page, 'Rodada 9')).toBeInViewport();
});

test('cada aba abre no topo do conteúdo', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 500 });
  await startLongTournament(page, 3);
  await page.locator('.tab-content').evaluate((el) => el.scrollTo({ top: el.scrollHeight }));

  await railTab(page, 'Placar').click();
  await expect(page.getByRole('heading', { name: 'Placar' })).toBeInViewport();
});
