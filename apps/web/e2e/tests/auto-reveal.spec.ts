import { test, expect, Page } from '@playwright/test';

test.describe('Auto-reveal feature', () => {
  let code: string;

  async function createGame(hostPage: Page) {
    await hostPage.goto('/');
    await hostPage.getByRole('button', { name: 'Create Game' }).click();
    await hostPage.waitForSelector('[data-testid="question-pack"]', { timeout: 10000 });
    await hostPage.locator('[data-testid="question-pack"]').first().click();
    
    const gameCode = await hostPage.locator('h1').textContent();
    expect(gameCode).toMatch(/^[A-Z0-9]{6}$/);
    return gameCode!;
  }

  async function joinGame(playerPage: Page, gameCode: string, nickname: string) {
    await playerPage.goto('/');
    await playerPage.getByRole('button', { name: 'Join Game' }).click();
    await playerPage.getByPlaceholder('Game Code').fill(gameCode);
    await playerPage.getByRole('button', { name: 'Next' }).click();
    
    await playerPage.waitForSelector('input[placeholder*="nickname"]', { timeout: 10000 });
    await playerPage.getByPlaceholder(/nickname/i).fill(nickname);
    await playerPage.getByRole('button', { name: 'Join Game' }).click();
    
    await expect(playerPage).toHaveURL(/\/play\/[A-Z0-9]{6}$/);
    await expect(playerPage.getByText(nickname)).toBeVisible();
  }

  test('should auto-reveal answer when timeout occurs', async ({ browser }) => {
    test.setTimeout(60000);
    
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const playerPage = await playerContext.newPage();

    try {
      // Host creates game
      code = await createGame(hostPage);
      
      // Player joins
      await joinGame(playerPage, code, 'TestPlayer');
      
      // Host starts game
      await hostPage.getByRole('button', { name: 'Start Game' }).click();
      
      // Host should see Question 1
      await expect(hostPage.getByText('Question 1 of')).toBeVisible({ timeout: 10000 });
      
      // Player should see the question
      await expect(playerPage.locator('h2').first()).toBeVisible({ timeout: 10000 });
      
      // DO NOT answer - wait for timeout
      // Assuming 30 second timeout, wait for auto-reveal
      
      // Check that answer was revealed automatically on host
      await expect(hostPage.getByText('Answer revealed automatically')).toBeVisible({ timeout: 35000 });
      await expect(hostPage.locator('.border-green-500')).toBeVisible();
      
      // Player should see the correct answer
      await expect(playerPage.getByText("Time's up!")).toBeVisible();
      await expect(playerPage.locator('.bg-green-100, .bg-green-900')).toBeVisible();
      
    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });

  test('should auto-reveal answer when all players answer and 5 seconds pass', async ({ browser }) => {
    test.setTimeout(30000);
    
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const playerPage = await playerContext.newPage();

    try {
      // Host creates game
      code = await createGame(hostPage);
      
      // Player joins
      await joinGame(playerPage, code, 'QuickPlayer');
      
      // Host starts game
      await hostPage.getByRole('button', { name: 'Start Game' }).click();
      
      // Host should see Question 1
      await expect(hostPage.getByText('Question 1 of')).toBeVisible({ timeout: 10000 });
      
      // Player should see the question
      await expect(playerPage.locator('h2').first()).toBeVisible({ timeout: 10000 });
      
      // Player answers quickly
      await playerPage.locator('button').filter({ hasText: /^[A-D]/ }).first().click();
      
      // Check that Reveal Answer button is still visible (not auto-revealed yet)
      await expect(hostPage.getByRole('button', { name: 'Reveal Answer' })).toBeVisible();
      
      // Wait 5+ seconds for auto-reveal
      await hostPage.waitForTimeout(5500);
      
      // Check that answer was revealed automatically
      await expect(hostPage.getByText('Answer revealed automatically')).toBeVisible();
      await expect(hostPage.locator('.border-green-500')).toBeVisible();
      
      // Player should see the correct answer
      await expect(playerPage.locator('.bg-green-100, .bg-green-900, .bg-red-100, .bg-red-900')).toBeVisible();
      
    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });

  test('should allow manual reveal before auto-reveal', async ({ browser }) => {
    test.setTimeout(30000);
    
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const playerPage = await playerContext.newPage();

    try {
      // Host creates game
      code = await createGame(hostPage);
      
      // Player joins
      await joinGame(playerPage, code, 'ManualPlayer');
      
      // Host starts game
      await hostPage.getByRole('button', { name: 'Start Game' }).click();
      
      // Host should see Question 1
      await expect(hostPage.getByText('Question 1 of')).toBeVisible({ timeout: 10000 });
      
      // Player answers
      await playerPage.locator('button').filter({ hasText: /^[A-D]/ }).first().click();
      
      // Host manually reveals answer (before 5 seconds)
      await hostPage.getByRole('button', { name: 'Reveal Answer' }).click();
      
      // Should NOT show "Answer revealed automatically"
      await expect(hostPage.getByText('Answer revealed automatically')).not.toBeVisible();
      
      // But should show the answer
      await expect(hostPage.locator('.border-green-500')).toBeVisible();
      
    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });
});