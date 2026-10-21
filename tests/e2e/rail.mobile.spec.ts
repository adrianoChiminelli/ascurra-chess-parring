import { expect, railTab, startLongTournament, test } from './fixtures';

test('barra horizontal mantém exportar, manutenção e a rodada atual visíveis', async ({ page }) => {
  await startLongTournament(page);

  const rail = page.locator('.tab-rail');
  expect(await rail.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);

  const exportButton = page.getByRole('button', { name: 'Exportar torneio' });
  const maintenanceButton = page.getByRole('button', { name: 'Manutenção' });
  await expect(exportButton).toBeInViewport();
  await expect(maintenanceButton).toBeInViewport();
  await expect(page.locator('.tab-rail-item-label').first()).toBeHidden();

  // A rodada ativa não fica escondida atrás do rodapé fixo.
  const active = (await railTab(page, 'Rodada 9').boundingBox())!;
  const footer = (await page.locator('.tab-rail-footer').boundingBox())!;
  expect(active.x + active.width).toBeLessThanOrEqual(footer.x);

  // Rolando a barra até o início, o rodapé continua no lugar.
  await rail.evaluate((el) => el.scrollTo({ left: 0 }));
  await expect(exportButton).toBeInViewport();
  await maintenanceButton.click();
  await expect(page.getByRole('heading', { name: 'Manutenção' })).toBeVisible();
});

test('tabela de manutenção cabe na tela sem rolagem horizontal', async ({ page }) => {
  await startLongTournament(page, 2);
  await page.getByRole('button', { name: 'Manutenção' }).click();

  const wrap = page.locator('.standings-table-wrap');
  expect(await wrap.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await expect(page.locator('.status-tag').first()).toBeInViewport();
});
