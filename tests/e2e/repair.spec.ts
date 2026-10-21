import type { Page } from '@playwright/test';
import { expect, matchCards, playRound, railTab, setAllResults, startTournament, test } from './fixtures';

const UNRATED = ['Ana', 'Bruno', 'Carla', 'Diego', 'Eva', 'Fábio', 'Gabi', 'Hugo'];

// Sorteio reprodutível: Math.random determinístico (Park-Miller).
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    let seed = 1;
    Math.random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  });
});

async function pairs(page: Page): Promise<string[]> {
  return matchCards(page).evaluateAll((cards) =>
    cards.map((card) => [...card.querySelectorAll('.match-player-main')].map((el) => el.textContent?.trim()).join(' x ')),
  );
}

const repairButton = (page: Page) => page.getByRole('button', { name: 'Reemparceirar' });

test('rodada 1: novo sorteio gera outro pareamento, sem confirmação se não há resultados', async ({ page }) => {
  await startTournament(page, { players: UNRATED, rounds: 3 });
  const before = await pairs(page);

  page.on('dialog', () => {
    throw new Error('não deveria pedir confirmação');
  });
  await repairButton(page).click();

  await expect.poll(() => pairs(page)).not.toEqual(before);
  await expect(matchCards(page)).toHaveCount(4);
  await expect(page.locator('.tab-rail-rounds .tab-rail-item')).toHaveCount(1);
});

test('com resultados, pede confirmação e só descarta se confirmado', async ({ page }) => {
  await startTournament(page, { players: UNRATED, rounds: 3 });
  await matchCards(page).nth(0).getByRole('button', { name: '1-0', exact: true }).click();
  await matchCards(page).nth(1).getByRole('button', { name: '0-1', exact: true }).click();

  let message = '';
  page.once('dialog', (dialog) => {
    message = dialog.message();
    void dialog.dismiss();
  });
  await repairButton(page).click();
  expect(message).toContain('novo sorteio');
  expect(message).toContain('2 resultados desta rodada serão descartados');
  await expect(page.locator('.result-btn.selected-win')).toHaveCount(2);

  page.once('dialog', (dialog) => dialog.accept());
  await repairButton(page).click();
  await expect(page.locator('.result-btn.selected-win')).toHaveCount(0);
});

test('rodada 2 sem mudança: botão desabilitado; após retirada, refaz sem o retirado', async ({ page }) => {
  await startTournament(page, { players: UNRATED.slice(0, 6), rounds: 3 });
  await playRound(page, 2);
  const roundOnePairs = await (async () => {
    await railTab(page, 'Rodada 1').click();
    const result = await pairs(page);
    await railTab(page, 'Rodada 2').click();
    return result;
  })();

  await expect(repairButton(page)).toBeDisabled();
  await expect(repairButton(page)).toHaveAttribute('title', /refazer geraria os mesmos pares/);

  const withdrawn = (await pairs(page))[0].split(' x ')[0];
  await page.getByRole('button', { name: 'Manutenção' }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: `Remover ${withdrawn} do torneio` }).click();

  await railTab(page, 'Rodada 2').click();
  await expect(page.locator('.match-forfeit-tag')).toHaveCount(1);
  await expect(repairButton(page)).toBeEnabled();

  page.once('dialog', (dialog) => dialog.accept());
  await repairButton(page).click();

  await expect(page.locator('.match-forfeit-tag')).toHaveCount(0);
  await expect(page.locator('.match-list')).not.toContainText(withdrawn);
  await expect(matchCards(page)).toHaveCount(2);
  await expect(page.locator('.match-bye-tag')).toHaveCount(1);

  await railTab(page, 'Rodada 1').click();
  expect(await pairs(page)).toEqual(roundOnePairs);
});

test('botão só aparece na rodada atual', async ({ page }) => {
  await startTournament(page, { players: UNRATED.slice(0, 4), rounds: 3 });
  await setAllResults(page);
  await playRound(page, 2);
  await railTab(page, 'Rodada 1').click();

  await expect(repairButton(page)).toHaveCount(0);
});
