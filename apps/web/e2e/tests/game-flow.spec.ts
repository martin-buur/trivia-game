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

  test('complete game flow with start game and question answering', async ({ browser }) => {
    test.setTimeout(60000); // Longer timeout for full game flow
    
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();

    const hostPage = await hostContext.newPage();
    const playerPage = await playerContext.newPage();

    try {
      // Host creates a game and player joins (reuse setup)
      await hostPage.goto('/');
      await hostPage.waitForLoadState('networkidle');
      await hostPage.getByRole('button', { name: 'Create Game' }).click();
      
      await hostPage.waitForSelector('[data-testid="question-pack"]', { timeout: 10000 });
      await hostPage.locator('[data-testid="question-pack"]').first().click();
      await hostPage.getByRole('button', { name: 'Create Game' }).click();
      
      const gameCode = await hostPage.locator('.text-5xl').textContent();
      expect(gameCode).toMatch(/^[A-Z0-9]{6}$/);

      // Player joins
      await playerPage.goto('/');
      await playerPage.getByRole('button', { name: 'Join Game' }).click();
      await playerPage.locator('input[placeholder="ABC123"]').fill(gameCode!);
      await playerPage.getByRole('button', { name: 'Join' }).click();
      await playerPage.getByPlaceholder('Enter nickname').fill('TestPlayer');
      await playerPage.getByRole('button', { name: 'Join Game' }).click();

      // Wait for player to appear in host lobby
      await hostPage.waitForSelector('text=TestPlayer', { timeout: 10000 });

      // HOST: Start the game
      const startButton = hostPage.getByRole('button', { name: 'Start Game' });
      await expect(startButton).toBeEnabled();
      await startButton.click();

      // Host should navigate to game view
      await expect(hostPage).toHaveURL(/\/host\/[A-Z0-9]{6}\/game$/);
      
      // Host should see the first question
      await expect(hostPage.getByText('Question 1 of')).toBeVisible({ timeout: 10000 });
      
      // Player should automatically navigate to game view when game starts
      await expect(playerPage).toHaveURL(/\/play\/[A-Z0-9]{6}\/game$/, { timeout: 15000 });
      
      // Player should see the question
      await expect(playerPage.locator('h2').first()).toBeVisible({ timeout: 10000 });
      
      // Player selects an answer (first option)
      const answerButtons = playerPage.getByRole('button').filter({ has: playerPage.locator('div:has-text("A")') });
      const firstAnswerButton = answerButtons.first();
      await expect(firstAnswerButton).toBeVisible({ timeout: 5000 });
      await firstAnswerButton.click();

      // Player should see answer feedback
      await expect(playerPage.getByText(/Correct!|Incorrect/)).toBeVisible({ timeout: 5000 });

      // Wait a bit for the polling to pick up the answer
      await playerPage.waitForTimeout(3000);

      // Host should see answer statistics update
      await expect(hostPage.getByText('Players answered')).toBeVisible();
      // Verify the answer tracking is working by checking if reveal button becomes enabled
      await expect(hostPage.getByRole('button', { name: 'Reveal Answer' })).toBeEnabled({ timeout: 15000 });

      // Host reveals answer
      const revealButton = hostPage.getByRole('button', { name: 'Reveal Answer' });
      await expect(revealButton).toBeEnabled();
      await revealButton.click();

      // Host should see the correct answer highlighted
      await expect(hostPage.locator('.border-green-500')).toBeVisible();

      // Host advances to next question or ends game
      const nextButton = hostPage.getByRole('button', { name: /Next Question|End Game/ });
      await expect(nextButton).toBeEnabled();
      await nextButton.click();

      // Should advance to next question or end game
      if (await nextButton.textContent() === 'Next Question') {
        // Should show Question 2 of X
        await expect(hostPage.getByText('Question 2 of')).toBeVisible({ timeout: 10000 });
        
        // Player should see the new question
        await expect(playerPage.locator('h2').first()).toBeVisible({ timeout: 10000 });
      } else {
        // Game ended, should navigate to results
        await expect(hostPage).toHaveURL(/\/host\/[A-Z0-9]{6}\/results$/, { timeout: 10000 });
        await expect(playerPage).toHaveURL(/\/play\/[A-Z0-9]{6}\/results$/, { timeout: 10000 });
      }
      
    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });

  test('multi-player game flow with final rankings', async ({ browser }) => {
    test.setTimeout(90000); // Extended timeout for multi-player test
    
    const hostContext = await browser.newContext();
    const player1Context = await browser.newContext();
    const player2Context = await browser.newContext();

    const hostPage = await hostContext.newPage();
    const player1Page = await player1Context.newPage();
    const player2Page = await player2Context.newPage();

    try {
      // Host creates game
      await hostPage.goto('/');
      await hostPage.getByRole('button', { name: 'Create Game' }).click();
      await hostPage.waitForSelector('[data-testid="question-pack"]', { timeout: 10000 });
      await hostPage.locator('[data-testid="question-pack"]').first().click();
      await hostPage.getByRole('button', { name: 'Create Game' }).click();
      
      const gameCode = await hostPage.locator('.text-5xl').textContent();
      expect(gameCode).toMatch(/^[A-Z0-9]{6}$/);

      // Player 1 joins
      await player1Page.goto('/');
      await player1Page.getByRole('button', { name: 'Join Game' }).click();
      await player1Page.locator('input[placeholder="ABC123"]').fill(gameCode!);
      await player1Page.getByRole('button', { name: 'Join' }).click();
      await player1Page.getByPlaceholder('Enter nickname').fill('Alice');
      await player1Page.getByRole('button', { name: 'Join Game' }).click();

      // Player 2 joins
      await player2Page.goto('/');
      await player2Page.getByRole('button', { name: 'Join Game' }).click();
      await player2Page.locator('input[placeholder="ABC123"]').fill(gameCode!);
      await player2Page.getByRole('button', { name: 'Join' }).click();
      await player2Page.getByPlaceholder('Enter nickname').fill('Bob');
      await player2Page.getByRole('button', { name: 'Join Game' }).click();

      // Wait for both players to appear in host lobby
      await hostPage.waitForSelector('text=Alice', { timeout: 10000 });
      await hostPage.waitForSelector('text=Bob', { timeout: 10000 });
      await expect(hostPage.getByText('Players (2)')).toBeVisible();

      // Start the game
      await hostPage.getByRole('button', { name: 'Start Game' }).click();
      
      // Wait for game views to load
      await expect(hostPage).toHaveURL(/\/host\/[A-Z0-9]{6}\/game$/);
      await expect(player1Page).toHaveURL(/\/play\/[A-Z0-9]{6}\/game$/, { timeout: 15000 });
      await expect(player2Page).toHaveURL(/\/play\/[A-Z0-9]{6}\/game$/, { timeout: 15000 });

      // Players answer the question
      const player1Answer = player1Page.getByRole('button').filter({ has: player1Page.locator('div:has-text("A")') }).first();
      const player2Answer = player2Page.getByRole('button').filter({ has: player2Page.locator('div:has-text("B")') }).first();
      
      await player1Answer.click();
      await player2Answer.click();

      // Wait for answers to be processed
      await player1Page.waitForTimeout(3000);

      // Host should see 2/2 players answered and be able to reveal answer
      await expect(hostPage.getByRole('button', { name: 'Reveal Answer' })).toBeEnabled({ timeout: 15000 });
      await hostPage.getByRole('button', { name: 'Reveal Answer' }).click();

      // Host advances to end the game (assuming only 1 question for simplicity)
      const nextButton = hostPage.getByRole('button', { name: /Next Question|End Game/ });
      await nextButton.click();

      // If there are more questions, just end here for test simplicity
      // Otherwise, should navigate to results
      if (await hostPage.url().includes('/results')) {
        // Verify final rankings page
        await expect(hostPage.getByText('Game Over!')).toBeVisible({ timeout: 10000 });
        await expect(hostPage.getByText('Full Leaderboard')).toBeVisible();
        
        // Players should also see results
        await expect(player1Page).toHaveURL(/\/play\/[A-Z0-9]{6}\/results$/, { timeout: 15000 });
        await expect(player2Page).toHaveURL(/\/play\/[A-Z0-9]{6}\/results$/, { timeout: 15000 });
        
        await expect(player1Page.getByText('Game Over!')).toBeVisible();
        await expect(player2Page.getByText('Game Over!')).toBeVisible();
      }

    } finally {
      await hostContext.close();
      await player1Context.close();
      await player2Context.close();
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

  test('player timeout behavior - server handles timeout when player doesnt answer', async ({ browser }) => {
    // Tests server-side timeout handling when a player doesn't answer
    // Note: Server timeout fires when ~1s remains on timer, not exactly at 0s
    test.setTimeout(15000); // 3s timeout + buffer for setup and processing
    
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();

    const hostPage = await hostContext.newPage();
    const playerPage = await playerContext.newPage();

    try {
      // Set up game with host and player
      await hostPage.goto('/');
      await hostPage.waitForLoadState('networkidle');
      await hostPage.getByRole('button', { name: 'Create Game' }).click();
      
      await hostPage.waitForSelector('[data-testid="question-pack"]', { timeout: 10000 });
      // Use the E2E Test Pack with 3-second timeouts
      const testPack = hostPage.locator('[data-testid="question-pack"]:has-text("E2E Test Pack")');
      await testPack.click();
      await hostPage.getByRole('button', { name: 'Create Game' }).click();

      const gameCode = await hostPage.locator('.text-5xl').textContent();
      
      // Player joins
      await playerPage.goto('/');
      await playerPage.getByRole('button', { name: 'Join Game' }).click();
      const codeInput = playerPage.locator('input[placeholder="ABC123"]');
      await codeInput.waitFor({ state: 'visible' });
      await codeInput.fill(gameCode!);
      await playerPage.getByRole('button', { name: 'Join' }).click();

      const nicknameInput = playerPage.getByPlaceholder('Enter nickname');
      await nicknameInput.waitFor({ state: 'visible' });
      await nicknameInput.fill('TimeoutTester');
      await playerPage.getByRole('button', { name: 'Join Game' }).click();

      // Wait for player to appear in host lobby
      await hostPage.waitForSelector('text=TimeoutTester', { timeout: 10000 });
      
      // Host starts the game
      const startButton = hostPage.getByRole('button', { name: 'Start Game' });
      await startButton.click();

      // Wait for the host to see the game view (question)
      await expect(hostPage).toHaveURL(/\/host\/[A-Z0-9]{6}\/game$/, { timeout: 10000 });
      
      // Wait for question to appear on player side
      await expect(playerPage).toHaveURL(/\/play\/[A-Z0-9]{6}\/game$/, { timeout: 10000 });
      await expect(playerPage.locator('h2').first()).toBeVisible({ timeout: 5000 });

      // Check that timer is counting down
      const timerElement = playerPage.locator('p').filter({ hasText: /^\d+s$/ });
      await expect(timerElement).toBeVisible();
      
      // DON'T click any answer - let server timeout handle it
      // Check what the answered count shows
      const answeredCountElement = hostPage.locator('p.text-2xl');
      await expect(answeredCountElement).toBeVisible({ timeout: 5000 });
      
      // Wait for the player count to update (WebSocket might take a moment)
      await expect(answeredCountElement).toHaveText(/^\d+ \/ \d+$/, { timeout: 5000 });
      
      const initialCount = await answeredCountElement.textContent();
      
      // It should show "0 / 1" initially since the player hasn't answered
      expect(initialCount).toMatch(/^0 \/ 1$/);
      
      // Verify WebSocket is connected on both pages
      const hostConnectionStatus = hostPage.locator('.w-2.h-2.rounded-full.bg-green-500');
      const playerConnectionStatus = playerPage.locator('.w-2.h-2.rounded-full.bg-green-500');
      
      await expect(hostConnectionStatus).toBeVisible({ timeout: 3000 });
      await expect(playerConnectionStatus).toBeVisible({ timeout: 3000 });
      
      // Wait for timer to reach 1s or 0s (timeout happens at ~1s remaining)
      await expect(timerElement).toHaveText(/^[01]s$/, { timeout: 5000 });
      
      // Wait for the result message to appear (timeout should fire soon)
      const resultDiv = playerPage.locator('.mt-6.text-center').first();
      await expect(resultDiv).toBeVisible({ timeout: 5000 });
      
      // Check that it shows the timeout message
      const timeoutMessage = playerPage.locator('p').filter({ hasText: 'You ran out of time' });
      await expect(timeoutMessage).toBeVisible({ timeout: 2000 });
      
      // After timeout, the server will have created a timeout answer
      // The host should now show 1/1 as the timeout answer is counted
      await expect(answeredCountElement).toHaveText('1 / 1', { timeout: 3000 });
      
      // Since timeout auto-reveals the answer, the host should see the answer revealed
      // Look for the correct answer indicator (green border)
      await expect(hostPage.locator('.border-green-500')).toBeVisible({ timeout: 3000 });
      
      // And should be able to go to next question or end game
      await expect(hostPage.getByRole('button', { name: /Next Question|End Game/ })).toBeEnabled({ timeout: 2000 });

    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });
});
