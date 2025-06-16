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
- ESLint configuration for entire project
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

### 🚀 Next Steps
1. **Player Management API**: Implement player join/leave endpoints
2. **Game Flow API**: Questions, answers, scoring endpoints
3. **Real-time Integration**: Set up Supabase Realtime subscriptions
4. **Frontend Components**: Build UI components for host and player views
5. **State Management**: Implement Zustand stores for game state

## Project Overview

This is a real-time multiplayer trivia game built with:
- **Frontend**: Vite + React + TypeScript + Tailwind CSS (unified app for both host and player views)
- **Backend**: Hono + Drizzle ORM + Supabase + PostgreSQL
- **Architecture**: Turbo monorepo with shared packages
- **Real-time**: Supabase Realtime for WebSocket communication

## Key Architecture Decisions

1. **Unified Frontend**: Single React app with routing to handle both host (`/host/:code`) and player (`/play/:code`) experiences
2. **Session-Based**: No user authentication required; players identified by device ID
3. **Real-time First**: All game state changes broadcast via Supabase Realtime subscriptions
4. **Question Packs**: Pre-defined question sets that hosts select when creating games

## Common Development Commands

```bash
# Install dependencies
pnpm install

# Run development servers (frontend + backend)
pnpm dev

# Build all packages
pnpm build

# Database operations
pnpm db:generate    # Generate Drizzle migrations
pnpm db:push       # Push schema to database
pnpm db:migrate    # Run migrations
pnpm db:seed       # Seed question packs

# Type checking
pnpm typecheck

# Linting
pnpm lint
pnpm lint:fix

# Testing
pnpm test
pnpm test:watch

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