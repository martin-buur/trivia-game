# Development Tasks - Trivia Game

## Current Sprint - Next Steps

### Immediate Tasks (Priority: High)
1. **Frontend Setup (apps/web)** ✅
   - [x] Initialize Vite + React + TypeScript ✅
   - [x] Install and configure Tailwind CSS v4 ✅
   - [x] Create base routing structure (React Router) ✅
   - [ ] Set up basic layout components

2. **Backend Setup (apps/api)** ✅
   - [x] Initialize Hono server ✅
   - [x] Set up TypeScript configuration ✅
   - [x] Create basic health check endpoint ✅
   - [x] Configure CORS for local development ✅

3. **Shared Packages** ✅
   - [x] Create @trivia/types package for shared TypeScript types ✅
   - [x] Create @trivia/utils package for common utilities ✅
   - [x] Set up @trivia/db package with Drizzle ORM ✅

### Next Priority Tasks
1. **Supabase Integration**
   - [ ] Create Supabase project
   - [ ] Add credentials to .env file
   - [ ] Test database connection

2. **Core API Development**
   - [ ] Implement session creation endpoint
   - [ ] Add player join functionality
   - [ ] Create question retrieval logic

## Phase 1: MVP Setup & Core Features

### 1. Project Setup
- [x] Initialize Turbo monorepo structure ✅
- [x] Create project documentation (PRD.md, TASKS.md, CLAUDE.md) ✅
- [x] Set up Git repository ✅
- [x] Create styling guide with Tailwind v4 ✅
- [x] Configure TypeScript, ESLint, Prettier ✅
- [x] Set up shared packages (types, utils) ✅
- [ ] Configure environment variables

### 2. Database Setup
- [ ] Set up Supabase project
- [x] Create Drizzle schema for all tables ✅
- [ ] Write migration scripts
- [ ] Seed database with default question packs
- [x] Set up Drizzle ORM configuration ✅

### 3. Backend API (Hono)
- [ ] Session management endpoints
  - [ ] POST /api/sessions - Create new session
  - [ ] GET /api/sessions/:code - Get session details
  - [ ] PATCH /api/sessions/:code - Update session state
- [ ] Player management
  - [ ] POST /api/sessions/:code/players - Join session
  - [ ] PATCH /api/players/:id - Update player details
- [ ] Question/Answer flow
  - [ ] GET /api/sessions/:code/current-question
  - [ ] POST /api/players/:id/answer
  - [ ] GET /api/sessions/:code/scores
- [ ] Real-time WebSocket setup with Supabase

### 4. Frontend Foundation
- [x] Set up Vite + React + Tailwind ✅
- [x] Create routing structure ✅
- [ ] Design component library (Button, Card, Modal, etc.)
- [ ] Implement responsive layout system

### 5. Core Game Flow
- [ ] Homepage with Create/Join options
- [ ] Host view
  - [ ] Session creation with pack selection
  - [ ] Player list with join notifications
  - [ ] Question display with timer
  - [ ] Score leaderboard
  - [ ] Game controls (next, pause, end)
- [ ] Player view  
  - [ ] Join screen with code input
  - [ ] Name entry and customization
  - [ ] Answer selection interface
  - [ ] Personal score display
  - [ ] Waiting screens between questions

### 6. Real-time Features
- [ ] Implement Supabase Realtime subscriptions
- [ ] Player join/leave notifications
- [ ] Synchronized timers
- [ ] Live score updates
- [ ] Connection status indicators

### 7. Testing & Polish
- [ ] Unit tests for critical functions
- [ ] Integration tests for API endpoints
- [ ] Load testing with 50+ concurrent players
- [ ] Mobile device testing
- [ ] Error handling and reconnection logic

## Phase 2: Enhanced Question Types
- [ ] True/False questions
- [ ] Image-based questions
- [ ] Multiple correct answers
- [ ] Fill-in-the-blank
- [ ] Question difficulty levels
- [ ] Bonus/penalty scoring system

## Phase 3: User-Generated Content
- [ ] Question pack creator interface
- [ ] Pack sharing system
- [ ] Moderation tools
- [ ] Import/export functionality
- [ ] Public pack marketplace

## Phase 4: Advanced Features
- [ ] Team mode
- [ ] Tournament brackets
- [ ] Achievements/badges
- [ ] Historical statistics
- [ ] Voice/video integration for remote play