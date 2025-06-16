# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current Status

### ✅ Completed

- Turbo monorepo structure initialized
- Project documentation created (PRD.md, TASKS.md, STYLING.md)
- Git repository set up with proper .gitignore
- Tailwind v4 styling guide configured
- Frontend (apps/web) initialized with Vite + React 19 + TypeScript + Tailwind CSS v4
- Backend (apps/api) initialized with Hono + TypeScript
- Shared packages created (@trivia/types, @trivia/utils, @trivia/db)
- All dependencies updated to latest exact versions
- Basic routing structure with React Router v7
- Database schema defined with Drizzle ORM
- Supabase project created and credentials added to `.env`
- Database schema pushed to Supabase
- Seed data created (5 question packs, 25 questions)
- Core session API endpoints implemented:
  - POST /sessions - Create new game session
  - GET /sessions/:code - Get session details with players
  - PATCH /sessions/:code/status - Update session status (host only)
  - GET /question-packs - List available question packs
- Drizzle relations configured for all tables
- Fixed API module dependencies and ESM configuration
- API server running successfully on port 3001
- **PGlite setup for local development**:
  - Environment-based database client (PGlite for local, Supabase for production)
  - Filesystem persistence in `.pglite/data` directory
  - Automatic schema application using existing Drizzle definitions
- **Build system fully operational**:
  - All shared packages (@trivia/types, @trivia/utils, @trivia/db) have proper build scripts
  - TypeScript configurations updated with correct dist/ outputs
  - Turbo build pipeline working end-to-end
  - Individual package builds work in isolation
  - API test setup fixed with proper PGlite typing
- **Code quality tooling configured**:
  - ESLint 9 with flat config setup for the entire monorepo
  - Prettier configured for consistent code formatting
  - All packages have lint scripts integrated with Turbo
- **Frontend foundation implemented**:
  - Tailwind CSS v4 properly configured with @tailwindcss/vite plugin
  - Custom theme with colors, animations, and design tokens
  - Base UI components (Button, Input, Card) with responsive design
  - API client with typed endpoints and error handling
  - Homepage with Create/Join game options
  - Fully responsive layout (mobile-first, scales to desktop)

### 🚀 Next Steps

1. **Player Management API**: Implement player join/leave endpoints
2. **Game Flow API**: Questions, answers, scoring endpoints
3. **Real-time Integration**: Set up Supabase Realtime subscriptions
4. **Frontend Components**: Build UI components for host and player views
5. **State Management**: Implement Zustand stores for game state

## Project Overview

This is a real-time multiplayer trivia game built with:

- **Frontend**: Vite + React + TypeScript + Tailwind CSS (unified app for both host and player views)
- **Backend**: Hono + Drizzle ORM + PGlite (local) / Supabase (production) + PostgreSQL
- **Architecture**: Turbo monorepo with shared packages
- **Real-time**: Supabase Realtime for WebSocket communication
- **Local Development**: PGlite embedded PostgreSQL for offline development

## Key Architecture Decisions

1. **Unified Frontend**: Single React app with routing to handle both host (`/host/:code`) and player (`/play/:code`) experiences
2. **Session-Based**: No user authentication required; players identified by device ID
3. **Real-time First**: All game state changes broadcast via Supabase Realtime subscriptions
4. **Question Packs**: Pre-defined question sets that hosts select when creating games
5. **Environment-Based Database**: PGlite for local development, Supabase PostgreSQL for production

## Common Development Commands

```bash
# Install dependencies
pnpm install

# Run development servers (frontend + backend)
pnpm dev

# Build all packages
pnpm build

# Database operations (automatically uses PGlite locally, Supabase in production)
pnpm db:push       # Push schema to database (recommended for dev)
pnpm db:seed       # Seed question packs
pnpm db:generate   # Generate migrations (for production)
pnpm db:migrate    # Run migrations (for production)

# Type checking
pnpm typecheck

# Linting and formatting
pnpm lint          # Run ESLint across the monorepo
pnpm format        # Format code with Prettier

# Testing
pnpm test
pnpm test:watch

# API Testing (with dev server running)
curl http://localhost:3001/                    # Health check
curl http://localhost:3001/question-packs       # List question packs
curl -X POST http://localhost:3001/sessions \  # Create session
  -H "Content-Type: application/json" \
  -d '{"hostDeviceId": "test-123", "questionPackId": "<pack-id>"}'

# Git workflow
git status          # Check changes
git add .           # Stage all changes
git commit -m ""    # Commit with message
git push            # Push to remote
git pull            # Pull latest changes
git checkout -b     # Create new branch
```

## Database Schema (Drizzle)

Key tables and their relationships:

- `question_packs` → `questions` (one-to-many)
- `sessions` → `players` (one-to-many)
- `sessions` → `question_packs` (many-to-one)
- `players` → `answers` → `questions` (tracking responses)

Always use Drizzle ORM for database operations. Schema is defined in `packages/db/src/schema.ts`.

## Local Development with PGlite

The project uses PGlite (embedded PostgreSQL) for local development and Supabase PostgreSQL for production. This provides:

- **Offline Development**: No internet connection required for database operations
- **Fast Startup**: No external database setup needed
- **Isolated Development**: Each developer has their own database instance
- **Automatic Schema Sync**: Schema changes are applied using `drizzle-kit push`
- **Filesystem Persistence**: Database persists in `.pglite/data` directory

### First Time Setup

```bash
# Install dependencies
pnpm install

# Push schema to create local PGlite database
pnpm db:push

# Seed with test data
pnpm db:seed

# Start development servers
pnpm dev
```

### Database Reset

```bash
# Delete local database and start fresh
rm -rf .pglite
pnpm db:push
pnpm db:seed
```

The database client automatically detects the environment:

- `NODE_ENV !== 'production'` → Uses PGlite (`.pglite/data`)
- `NODE_ENV === 'production'` → Uses Supabase PostgreSQL

## Real-time Event Patterns

Subscribe to Supabase channels using consistent naming:

- Channel: `session:${sessionCode}`
- Events: `player_joined`, `game_started`, `question_revealed`, `answer_submitted`, `scores_updated`

## Important Patterns

1. **Error Handling**: Always wrap Supabase operations in try-catch with user-friendly error messages
2. **Device ID**: Store in localStorage, generate UUID if not present
3. **Session Codes**: 6-character alphanumeric, uppercase, excluding confusing characters (0, O, I, 1)
4. **State Management**: Use Zustand for client state, Supabase for server state
5. **Responsive Design**: Mobile-first for player views, desktop-optimized for host views

## Testing Approach

- Unit tests for utility functions and game logic
- Integration tests for API endpoints
- E2E tests for critical user flows (create game, join game, answer question)
- Load tests to ensure 100+ concurrent players work smoothly

## Code Quality Requirements

**IMPORTANT**: Before completing any coding task, you MUST:

1. Run `pnpm lint` to check for linting errors
2. Run `pnpm format` to format code with Prettier
3. Run `pnpm typecheck` to ensure no TypeScript errors
4. Fix any issues found before considering the task complete

The project uses:

- ESLint 9 with flat config format (eslint.config.js)
- Prettier for consistent code formatting
- TypeScript strict mode for type safety

## Context7 MCP Usage

Context7 MCP is available for looking up documentation for libraries and frameworks used in this project. Use it to:

- Find up-to-date API documentation for Hono, Drizzle ORM, Supabase, React Router, Zustand, etc.
- Get implementation examples and best practices
- Resolve library-specific issues

To use Context7:

1. First call `mcp__context7__resolve-library-id` with the library name to get the Context7-compatible ID
2. Then call `mcp__context7__get-library-docs` with that ID to retrieve documentation

Example libraries to reference:

- Hono (backend framework)
- Drizzle ORM (database)
- Supabase (auth, database, realtime)
- React Router (routing)
- Zustand (state management)
- Vite (build tool)
- Tailwind CSS v4 (styling)

## Puppeteer MCP for Visual Testing

Claude Code has access to Puppeteer MCP for taking screenshots and testing the UI. This is useful for:

- Verifying styling changes are working correctly
- Testing responsive layouts at different viewport sizes
- Debugging visual issues
- Demonstrating UI features

### Common Puppeteer Commands

```bash
# Navigate to a URL
mcp__puppeteer__puppeteer_navigate url="http://localhost:3000"

# Take a screenshot (default 800x600)
mcp__puppeteer__puppeteer_screenshot name="homepage"

# Take a mobile screenshot
mcp__puppeteer__puppeteer_screenshot name="mobile-view" width=375 height=812

# Take a desktop screenshot
mcp__puppeteer__puppeteer_screenshot name="desktop-view" width=1920 height=1080

# Click an element
mcp__puppeteer__puppeteer_click selector=".button-class"

# Fill an input
mcp__puppeteer__puppeteer_fill selector="#input-id" value="text"

# Execute JavaScript
mcp__puppeteer__puppeteer_evaluate script="document.querySelector('.class').click()"
```

### Testing Responsive Design

When building responsive features, test at these common viewport sizes:

- **Mobile**: 375x812 (iPhone 12/13/14)
- **Tablet**: 768x1024 (iPad)
- **Desktop**: 1920x1080 (Full HD)
- **Large Desktop**: 2560x1440 (2K)

Always ensure the development server is running (`pnpm dev`) before using Puppeteer commands.
