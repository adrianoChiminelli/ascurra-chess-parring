import { addBatch, expect, test } from './fixtures';

const participantNames = (page: import('@playwright/test').Page) => page.locator('.participant-list .participant-name');

test.beforeEach(async ({ page }) => {
  await page.goto('./');
});

test('entrada individual limita o nome a 20 caracteres', async ({ page }) => {
  const nameInput = page.getByPlaceholder('Nome do participante');
  await nameInput.pressSequentially('a'.repeat(25));

  await expect(nameInput).toHaveValue('a'.repeat(20));
});

test('entrada individual adiciona participante com e sem rating', async ({ page }) => {
  await page.getByPlaceholder('Nome do participante').fill('Ana');
  await page.getByPlaceholder('Rating (opcional)').fill('1840');
  await page.getByRole('button', { name: 'Adicionar participante' }).click();
  await page.getByPlaceholder('Nome do participante').fill('Bruno');
  await page.getByPlaceholder('Nome do participante').press('Enter');

  await expect(participantNames(page)).toHaveText(['1. Ana', '2. Bruno']);
  await expect(page.locator('.participant-list .participant-rating')).toHaveText(['1840']);
});

test('entrada em lote adiciona linhas válidas e mantém as rejeitadas no campo', async ({ page }) => {
  const longLine = 'Nome com mais de vinte caracteres, 1500';
  await addBatch(page, ['Ana Souza, 1840', 'Bruno; 1620', 'Carla', '', longLine]);

  await expect(participantNames(page)).toHaveText(['1. Ana Souza', '2. Bruno', '3. Carla']);
  await expect(page.locator('.participant-list .participant-rating')).toHaveText(['1840', '1620']);
  await expect(page.getByPlaceholder(/Um participante por linha/)).toHaveValue(longLine);
  await expect(page.getByText('1 linha não adicionada')).toBeVisible();
});

test('linha corrigida é adicionada e o erro some', async ({ page }) => {
  await addBatch(page, ['Nome com mais de vinte caracteres']);
  await expect(page.locator('.form-error')).toBeVisible();

  await page.getByPlaceholder(/Um participante por linha/).fill('Nome curto');
  await page.getByRole('button', { name: 'Adicionar lista' }).click();

  await expect(participantNames(page)).toHaveText(['1. Nome curto']);
  await expect(page.locator('.form-error')).toHaveCount(0);
});

test('remove participante da lista', async ({ page }) => {
  await addBatch(page, ['Ana', 'Bruno']);
  await page.getByRole('button', { name: 'Remover Ana' }).click();

  await expect(participantNames(page)).toHaveText(['1. Bruno']);
});

test('exige pelo menos 2 participantes para iniciar', async ({ page }) => {
  await addBatch(page, ['Ana']);
  await page.getByRole('button', { name: 'Iniciar torneio' }).click();

  await expect(page.getByText('Adicione pelo menos 2 participantes')).toBeVisible();
});
