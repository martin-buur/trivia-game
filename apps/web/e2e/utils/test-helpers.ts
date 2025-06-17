import { Page } from '@playwright/test';

export async function createGame(page: Page): Promise<string> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Create Game' }).click();

  // Select first question pack
  await page.waitForSelector('[data-testid="question-pack"]');
  await page.locator('[data-testid="question-pack"]').first().click();

  // Create the game
  await page.getByRole('button', { name: 'Create Game' }).click();

  // Wait for navigation and extract game code
  await page.waitForURL(/\/host\/[A-Z0-9]{6}$/);
  const gameCode = await page.locator('.text-5xl').textContent();

  if (!gameCode) throw new Error('Failed to get game code');
  return gameCode;
}

export async function joinGame(
  page: Page,
  gameCode: string,
  nickname: string
): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Join Game' }).click();

  // Enter game code
  const codeInput = page.locator('input[placeholder="ABC123"]');
  await codeInput.waitFor({ state: 'visible' });
  await codeInput.fill(gameCode);
  await page.getByRole('button', { name: 'Join' }).click();

  // Enter nickname
  await page.waitForURL(`/join/${gameCode}`);
  const nicknameInput = page.getByPlaceholder('Enter nickname');
  await nicknameInput.waitFor({ state: 'visible' });
  await nicknameInput.fill(nickname);
  await page.getByRole('button', { name: 'Join Game' }).click();

  // Wait for waiting room
  await page.waitForURL(/\/play\/[A-Z0-9]{6}$/);
}
