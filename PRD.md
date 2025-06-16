# Product Requirements Document - Trivia Game

## Overview

A web-based real-time multiplayer trivia game designed for social gatherings, classrooms, and virtual events. The game features a host screen for display on a big screen and player screens for mobile devices.

## Core Features

### MVP (Phase 1)

1. **Game Creation & Joining**

   - Hosts create sessions with unique 6-character codes
   - Players join via code without authentication
   - Device ID-based session persistence

2. **Question Packs**

   - Pre-defined packs: General, Europe, US, Gaming, Sports
   - Host selects pack during game creation
   - Simple trivia format: 1 question, 4 options, 1 correct answer

3. **Real-time Gameplay**

   - Synchronized question display across all devices
   - Time-limited answering (configurable by host)
   - Live score updates after each question
   - Player rankings displayed on host screen

4. **Player Experience**
   - Name entry on join
   - Simple, mobile-optimized answer interface
   - Personal score tracking
   - Basic customization options (avatar color/icon)

### Future Phases

- Phase 2: Multiple question types (true/false, image-based, fill-in-blank)
- Phase 3: Custom question pack creation and sharing
- Phase 4: Tournament mode, team play

## User Stories

### As a Host

- I want to create a game session quickly without signing up
- I want to see all connected players before starting
- I want to control game pacing (next question, pause)
- I want to display scores and winners prominently

### As a Player

- I want to join games using just a code
- I want to see questions clearly on my phone
- I want immediate feedback on my answers
- I want to track my score throughout the game

## Technical Requirements

- Support 2-100 concurrent players per session
- < 100ms latency for real-time updates
- Mobile-first player interface
- Responsive host interface for various screen sizes
- No user accounts required for MVP

## Success Metrics

- Average session has 10+ players
- 80% of players complete full game session
- < 5% disconnection rate
- Game creation to first question < 2 minutes
