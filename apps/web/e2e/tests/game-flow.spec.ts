import { test, expect } from '@playwright/test';

test.describe('Game Flow', () => {
  test('host can create a game and player can join', async ({ browser }) => {
    test.setTimeout(30000); // Set timeout for this specific test
    // Create two separate browser contexts for host and player
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();

    const hostPage = await hostContext.newPage();
    const playerPage = await playerContext.newPage();

    try {
      // Host creates a game
      await hostPage.goto('/');
      await hostPage.waitForLoadState('networkidle');
      await expect(
        hostPage.getByRole('heading', { name: 'Trivia Game' })
      ).toBeVisible();

      await hostPage.getByRole('button', { name: 'Create Game' }).click();
      await expect(hostPage).toHaveURL('/create');

      // Select first question pack
      await hostPage.waitForSelector('[data-testid="question-pack"]', {
        timeout: 10000,
      });
      const firstPack = hostPage
        .locator('[data-testid="question-pack"]')
        .first();
      await firstPack.click();

      // Click Create Game button
      await hostPage.getByRole('button', { name: 'Create Game' }).click();

      // Should navigate to host lobby
      await expect(hostPage).toHaveURL(/\/host\/[A-Z0-9]{6}$/);

      // Get the game code
      const gameCode = await hostPage.locator('.text-5xl').textContent();
      expect(gameCode).toMatch(/^[A-Z0-9]{6}$/);

      // Player joins the game
      await playerPage.goto('/');
      await playerPage.getByRole('button', { name: 'Join Game' }).click();

      // Enter game code - wait for input to be visible
      const codeInput = playerPage.locator('input[placeholder="ABC123"]');
      await codeInput.waitFor({ state: 'visible' });
      await codeInput.fill(gameCode!);
      await playerPage.getByRole('button', { name: 'Join' }).click();

      // Should navigate to join page
      await expect(playerPage).toHaveURL(`/join/${gameCode}`);

      // Enter nickname
      const nicknameInput = playerPage.getByPlaceholder('Enter nickname');
      await nicknameInput.waitFor({ state: 'visible' });
      await nicknameInput.fill('TestPlayer');
      await playerPage.getByRole('button', { name: 'Join Game' }).click();

      // Should be in waiting room
      await expect(playerPage).toHaveURL(/\/play\/[A-Z0-9]{6}$/);
      await expect(playerPage.getByText('Waiting Room')).toBeVisible();
      await expect(
        playerPage.getByRole('heading', { name: 'TestPlayer' })
      ).toBeVisible();

      // Host should see the player (with longer timeout for polling)
      await hostPage.waitForSelector('text=TestPlayer', { timeout: 10000 });
      await expect(hostPage.getByText('Players (1)')).toBeVisible();
      await expect(hostPage.getByText('TestPlayer')).toBeVisible();

      // Verify Start Game button is now enabled
      const startButton = hostPage.getByRole('button', { name: 'Start Game' });
      await expect(startButton).toBeEnabled();
    } finally {
      // Clean up
      await hostContext.close();
      await playerContext.close();
    }
  });

  test('player cannot join with invalid code', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Join Game' }).click();

    // Try invalid code - the input shows up after clicking Join Game
    await page.locator('input[placeholder="ABC123"]').fill('BADCOD');
    await page.getByRole('button', { name: 'Join' }).click();

    // Should navigate to join page with invalid code
    await expect(page).toHaveURL('/join/BADCOD');

    // Should show error message
    await expect(page.getByText('Invalid game code')).toBeVisible();
  });
});
