# Automatic Answer Reveal Feature Plan

## Overview
Implement automatic answer reveal when:
1. Time runs out (timeout occurs)
2. All players have answered AND at least 5 seconds have passed

## Current State Analysis
- Server already handles timeouts in `handleQuestionTimeout()` function
- Timeout creates answers for non-responding players and broadcasts `question_completed` event
- Host currently must manually click "Reveal Answer" button
- `answer_revealed` event exists but is only triggered by manual host action

## Implementation Plan

### 1. Server-Side Changes (apps/api/src/routes/sessions.ts)

#### A. Track Question Start Time
- Add `questionStartTime` to active question tracking
- Store timestamp when question is sent to players

#### B. Modify Answer Submission Logic
- In the answer submission endpoint, when all players have answered:
  - Check if 5+ seconds have passed since question start
  - If yes, automatically trigger answer reveal
  - Clear timeout and broadcast both `answer_revealed` and `question_completed` events

#### C. Update Timeout Handler
- Modify `handleQuestionTimeout()` to also broadcast `answer_revealed` event before `question_completed`
- This ensures answer is revealed when time runs out

#### D. Add Auto-Reveal Logic
- Create shared function `revealAndCompleteQuestion()` to handle both timeout and all-answered scenarios
- Broadcasts answer reveal, waits briefly, then broadcasts completion

### 2. Client-Side Changes

#### A. Host View (apps/web/src/pages/HostGameView.tsx)
- Listen for automatic `answer_revealed` events (already implemented)
- Hide "Reveal Answer" button when answer is auto-revealed
- Show status message: "Answer revealed automatically"

#### B. Player View (apps/web/src/pages/PlayerGameView.tsx)
- Already handles `answer_revealed` events properly
- No changes needed

### 3. Testing Updates
- Update E2E tests to verify automatic reveal behavior
- Add test for timeout scenario
- Add test for all-answered + 5 seconds scenario

## Benefits
- Better game flow without manual intervention
- Consistent timing for all players
- Prevents host from forgetting to reveal answers
- Maintains game momentum

## Implementation Status

### Completed ✅
1. **Server-side changes**:
   - Added `questionStartTimes` Map to track when each question starts
   - Created `revealAndCompleteQuestion()` function to handle answer reveal and completion
   - Updated timeout handler to use the new function
   - Modified answer submission to check for auto-reveal conditions
   - Added automatic reveal when all players answer and 5+ seconds have passed

2. **Client-side changes**:
   - Added `autoRevealed` state to track automatic reveals
   - Updated UI to show "Answer revealed automatically" message
   - Reset auto-reveal state when question changes

3. **Testing**:
   - TypeScript compilation passes
   - Dev servers run without errors

### How It Works
1. When a question starts, the server records the start time
2. When a player submits an answer:
   - If all players have answered:
     - Check elapsed time since question start
     - If ≥5 seconds: reveal immediately
     - If <5 seconds: schedule reveal for remaining time
3. When timeout occurs:
   - Create timeout answers for non-responding players
   - Automatically reveal answer and complete question
4. Host sees "Answer revealed automatically" message when auto-reveal happens