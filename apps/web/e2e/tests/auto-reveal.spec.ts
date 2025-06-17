import { test, expect, Page } from '@playwright/test';

test.describe('Auto-reveal feature', () => {
  let code: string;

  async function createGame(hostPage: Page) {
    await hostPage.goto('/');
    await hostPage.getByRole('button', { name: 'Create Game' }).click();
    await hostPage.waitForSelector('[data-testid="question-pack"]', { timeout: 10000 });
    
    // Use the E2E Test Pack with 3-second timeouts
    const testPack = hostPage.locator('[data-testid="question-pack"]:has-text("E2E Test Pack")');
    await testPack.click();
    
    await hostPage.getByRole('button', { name: 'Create Game' }).click();
    
    // Wait for navigation to host lobby
    await hostPage.waitForURL(/\/host\/[A-Z0-9]{6}$/);
    
    // Get game code from the large text display
    const gameCode = await hostPage.locator('.text-5xl').textContent();
    expect(gameCode).toMatch(/^[A-Z0-9]{6}$/);
    return gameCode!;
  }

  async function joinGame(playerPage: Page, gameCode: string, nickname: string) {
    await playerPage.goto('/');
    await playerPage.getByRole('button', { name: 'Join Game' }).click();
    await playerPage.getByPlaceholder('ABC123').fill(gameCode);
    await playerPage.getByRole('button', { name: 'Join' }).click();
    
    await playerPage.waitForSelector('input[placeholder*="nickname"]', { timeout: 10000 });
    await playerPage.getByPlaceholder(/nickname/i).fill(nickname);
    await playerPage.getByRole('button', { name: 'Join Game' }).click();
    
    await expect(playerPage).toHaveURL(/\/play\/[A-Z0-9]{6}$/);
    await expect(playerPage.getByRole('heading', { name: nickname })).toBeVisible();
  }

  test('should auto-reveal answer when timeout occurs', async ({ browser }) => {
    test.setTimeout(20000); // Reduced timeout since questions are only 3 seconds
    
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
      // 3 second timeout for E2E Test Pack
      
      // Check that answer was revealed automatically on host
      await expect(hostPage.getByText('Answer revealed automatically')).toBeVisible({ timeout: 5000 });
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
    test.setTimeout(20000); // Reduced timeout
    
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
      
      // Player should see the correct answer highlighted
      await expect(playerPage.locator('button.bg-green-100, button.bg-green-900')).toBeVisible();
      
    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });

  test('should allow manual reveal before auto-reveal', async ({ browser }) => {
    test.setTimeout(20000); // Reduced timeout
    
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