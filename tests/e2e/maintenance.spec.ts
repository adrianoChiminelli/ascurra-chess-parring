import type { Page } from '@playwright/test';
import { expect, generateNextRound, matchCards, railTab, setAllResults, startTournament, test } from './fixtures';

// Ratings distintos: pareamento da rodada 1 é Ana x Carla e Bruno x Diego (cores definidas pela lib).
const FOUR = ['Ana, 2000', 'Bruno, 1900', 'Carla, 1800', 'Diego, 1700'];

async function openMaintenance(page: Page) {
  await page.getByRole('button', { name: 'Manutenção' }).click();
  await expect(page.getByRole('heading', { name: 'Manutenção' })).toBeVisible();
}

function row(page: Page, name: string) {
  return page.locator('.maintenance-table tbody tr').filter({ hasText: name });
}

test.describe('renomear', () => {
  test('novo nome aparece na manutenção, nas rodadas e no placar', async ({ page }) => {
    await startTournament(page, { players: FOUR, rounds: 3 });
    await openMaintenance(page);

    await page.getByRole('button', { name: 'Renomear Ana' }).click();
    await page.getByLabel('Novo nome de Ana').fill('  Ana Paula  ');
    await page.getByLabel('Novo nome de Ana').press('Enter');

    await expect(row(page, 'Ana Paula')).toHaveCount(1);
    await railTab(page, 'Rodada 1').click();
    await expect(matchCards(page).filter({ hasText: 'Ana Paula' })).toHaveCount(1);
    await railTab(page, 'Placar').click();
    await expect(page.locator('.standings-name').filter({ hasText: 'Ana Paula' })).toHaveCount(1);
  });

  test('Esc e Cancelar descartam a edição', async ({ page }) => {
    await startTournament(page, { players: FOUR, rounds: 3 });
    await openMaintenance(page);

    await page.getByRole('button', { name: 'Renomear Ana' }).click();
    await page.getByLabel('Novo nome de Ana').fill('Outro');
    await page.getByLabel('Novo nome de Ana').press('Escape');
    await expect(row(page, 'Ana')).toHaveCount(1);

    await page.getByRole('button', { name: 'Renomear Ana' }).click();
    await page.getByLabel('Novo nome de Ana').fill('Outro');
    await page.getByRole('button', { name: 'Cancelar edição' }).click();
    await expect(row(page, 'Outro')).toHaveCount(0);
  });

  test('não permite salvar nome vazio e limita o tamanho', async ({ page }) => {
    await startTournament(page, { players: FOUR, rounds: 3 });
    await openMaintenance(page);
    await page.getByRole('button', { name: 'Renomear Ana' }).click();
    const input = page.getByLabel('Novo nome de Ana');

    await input.fill('   ');
    await expect(page.getByRole('button', { name: 'Salvar nome' })).toBeDisabled();
    await input.press('Enter');
    await expect(input).toBeVisible();

    await input.fill('');
    await input.pressSequentially('x'.repeat(25));
    await expect(input).toHaveValue('x'.repeat(20));
  });
});

test.describe('remover do torneio', () => {
  test('partida pendente vira W.O. e o retirado continua no placar', async ({ page }) => {
    await startTournament(page, { players: FOUR, rounds: 3 });
    await openMaintenance(page);

    let message = '';
    page.once('dialog', (dialog) => {
      message = dialog.message();
      void dialog.accept();
    });
    await page.getByRole('button', { name: 'Remover Ana do torneio' }).click();

    expect(message).toContain('vitória por W.O. para Carla');
    await expect(row(page, 'Ana').locator('.status-tag')).toHaveText('Retirado na R1');
    await expect(page.getByRole('button', { name: 'Remover Ana do torneio' })).toHaveCount(0);
    await expect(page.locator('.panel-subtitle')).toHaveText('3 de 4 participantes ativos');

    await railTab(page, 'Rodada 1').click();
    const forfeitCard = matchCards(page).filter({ has: page.locator('.match-forfeit-tag') });
    await expect(forfeitCard).toContainText('Ana');
    for (const button of await forfeitCard.locator('.result-btn').all()) await expect(button).toBeDisabled();

    await railTab(page, 'Placar').click();
    const standingsRow = page.locator('.standings-table tbody tr').filter({ hasText: 'Ana' });
    await expect(standingsRow.locator('.status-tag')).toHaveText('Retirado');
    await expect(standingsRow.locator('.standings-points')).toHaveText('0');
    const carla = page.locator('.standings-table tbody tr').filter({ hasText: 'Carla' });
    await expect(carla.locator('.standings-points')).toHaveText('1');
    await expect(carla.locator('.standings-record')).toHaveText('1-0-0');
  });

  test('cancelar a confirmação não altera nada', async ({ page }) => {
    await startTournament(page, { players: FOUR, rounds: 3 });
    await openMaintenance(page);
    page.once('dialog', (dialog) => dialog.dismiss());
    await page.getByRole('button', { name: 'Remover Ana do torneio' }).click();

    await expect(row(page, 'Ana').locator('.status-tag')).toHaveText('Ativo');
    await railTab(page, 'Rodada 1').click();
    await expect(page.locator('.match-forfeit-tag')).toHaveCount(0);
  });

  test('partida já decidida é mantida e o retirado não é emparceirado depois', async ({ page }) => {
    await startTournament(page, { players: FOUR, rounds: 3 });
    await setAllResults(page, '0.5-0.5');
    await openMaintenance(page);

    let message = '';
    page.once('dialog', (dialog) => {
      message = dialog.message();
      void dialog.accept();
    });
    await page.getByRole('button', { name: 'Remover Ana do torneio' }).click();
    expect(message).not.toContain('W.O.');
    await expect(row(page, 'Ana').locator('.standings-points')).toHaveText('0.5');

    await railTab(page, 'Rodada 1').click();
    await expect(page.locator('.match-forfeit-tag')).toHaveCount(0);
    await generateNextRound(page, 2);
    await expect(page.locator('.match-list')).not.toContainText('Ana');
    await expect(page.locator('.match-bye-tag')).toHaveCount(1);
  });

  test('retirada persiste após recarregar', async ({ page }) => {
    await startTournament(page, { players: FOUR, rounds: 3 });
    await openMaintenance(page);
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Remover Ana do torneio' }).click();

    await page.reload();
    await openMaintenance(page);
    await expect(row(page, 'Ana').locator('.status-tag')).toHaveText('Retirado na R1');
  });
});
