import { test as base, expect, type Locator, type Page } from '@playwright/test';

/** Falha o teste se a página emitir erro no console ou exceção não tratada. */
export const test = base.extend<{ consoleGuard: void }>({
  consoleGuard: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));

      await use();

      expect(errors, 'erros no console do navegador').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export interface StartOptions {
  /** Linhas no formato da entrada em lote ("Nome, 1800" ou "Nome"). */
  players: string[];
  rounds?: number;
  name?: string;
}

export async function addBatch(page: Page, lines: string[]) {
  await page.getByRole('button', { name: 'Em lote' }).click();
  await page.getByPlaceholder(/Um participante por linha/).fill(lines.join('\n'));
  await page.getByRole('button', { name: 'Adicionar lista' }).click();
}

export async function setTotalRounds(page: Page, rounds: number) {
  const value = page.locator('.rounds-value');
  const current = Number(await value.textContent());
  const button = page.getByRole('button', { name: rounds > current ? 'Aumentar rodadas' : 'Diminuir rodadas' });
  for (let i = 0; i < Math.abs(rounds - current); i += 1) await button.click();
  await expect(value).toHaveText(String(rounds));
}

export async function startTournament(page: Page, { players, rounds = 5, name = 'Torneio E2E' }: StartOptions) {
  await page.goto('./');
  await page.getByLabel('Nome do torneio').fill(name);
  await setTotalRounds(page, rounds);
  await addBatch(page, players);
  await page.getByRole('button', { name: 'Iniciar torneio' }).click();
  await expect(page.locator('.app-title')).toContainText(name);
}

/** Cards de partida (exclui os de bye). */
export function matchCards(page: Page): Locator {
  return page.locator('.match-card').filter({ has: page.getByRole('button', { name: '1-0' }) });
}

export function byeCards(page: Page): Locator {
  return page.locator('.match-card').filter({ has: page.locator('.match-bye-tag') });
}

export async function setAllResults(page: Page, result: '1-0' | '0.5-0.5' | '0-1' = '1-0') {
  const cards = matchCards(page);
  const count = await cards.count();
  for (let i = 0; i < count; i += 1) {
    await cards.nth(i).getByRole('button', { name: result, exact: true }).click();
  }
}

export async function generateNextRound(page: Page, roundNumber: number) {
  await page.getByRole('button', { name: `Gerar rodada ${roundNumber}` }).click();
  await expect(page.getByRole('heading', { name: `Rodada ${roundNumber}` })).toBeVisible();
}

/** Joga a rodada atual com o resultado informado e gera a próxima. */
export async function playRound(page: Page, nextRoundNumber: number) {
  await setAllResults(page);
  await generateNextRound(page, nextRoundNumber);
}

export function railTab(page: Page, label: string): Locator {
  // "Rodada 1" não pode casar com "Rodada 10"; o badge de concluída pode compor o nome acessível.
  return page.locator('.tab-rail').getByRole('button', { name: new RegExp(`^${label}(\\s|$)`) });
}

export async function standingsPoints(page: Page): Promise<number[]> {
  await railTab(page, 'Placar').click();
  return (await page.locator('.standings-table tbody .standings-points').allTextContents()).map(Number);
}
