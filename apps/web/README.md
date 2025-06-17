# Trivia Web App

This is the frontend application for the Trivia game, built with Vite, React, TypeScript, and Tailwind CSS.

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

## E2E Testing

The project uses Playwright for end-to-end testing with a separate test database to ensure test isolation.

### Running E2E Tests

```bash
# Run tests (reuses existing dev servers if running)
pnpm test:e2e

# Run tests with fresh servers (RECOMMENDED for CI and consistent results)
pnpm test:e2e:clean

# Run tests in UI mode
pnpm test:e2e:ui

# Debug tests
pnpm test:e2e:debug
```

### Important Notes

1. **Test Database**: E2E tests use a separate PGlite database (`.pglite/e2e-data`) with minimal test data, not the development database.

2. **Server Reuse Issue**: By default, Playwright reuses existing dev servers to speed up test runs. However, if you have a dev server already running without the `E2E_TEST` environment variable, tests will fail because they'll use the wrong database.

   **Solution**: Use `pnpm test:e2e:clean` or set `CI=true` to force fresh server starts with the correct environment variables.

3. **WebSocket Testing**: The timeout test verifies that server-side timeouts work correctly when players don't answer questions. The timeout fires when ~1 second remains on the timer.

4. **Test Data**: The E2E test database is automatically cleaned and reseeded before each test run with:
   - 1 test question pack ("E2E Test Pack")
   - 5 simple questions with 3-second timeouts

### Troubleshooting

If tests are failing with "question pack not found" errors:

1. Kill any running dev servers:
   ```bash
   lsof -ti:3000,3001 | xargs kill -9
   ```

2. Run tests with fresh servers:
   ```bash
   pnpm test:e2e:clean
   ```

3. Check that the API server is using the E2E database by looking for this log:
   ```
   Using PGlite with filesystem persistence for E2E tests
   ```