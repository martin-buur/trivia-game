# E2E Tests

This directory contains end-to-end tests for the Trivia Game web application using Playwright.

## Running Tests

```bash
# Run all tests
pnpm test:e2e

# Run tests with UI mode
pnpm test:e2e:ui

# Run tests in debug mode
pnpm test:e2e:debug

# Run specific test
pnpm playwright test -g "host can create"
```

## Test Structure

- `tests/` - Test files
  - `game-flow.spec.ts` - Core game flow tests
- `utils/` - Utility functions and helpers
  - `test-helpers.ts` - Common test helper functions

## Writing Tests

1. Use the helper functions from `utils/test-helpers.ts` for common actions
2. Always wait for network idle or specific elements before interacting
3. Use data-testid attributes for reliable element selection
4. Test both happy paths and error cases

## Current Test Coverage

✅ Host can create a game
✅ Player can join with valid code
✅ Player cannot join with invalid code
⏳ Game start and play flow (TODO)
⏳ Score tracking and game completion (TODO)
