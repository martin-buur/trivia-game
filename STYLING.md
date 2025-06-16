# Styling Guide - Trivia Game

## Design Philosophy
- **Bright & Playful**: Bold colors that create excitement
- **Accessibility First**: Large text, high contrast, clear hierarchy
- **Art-Ready**: Placeholder system that can easily swap in real assets
- **Motion & Energy**: Smooth animations to enhance the fun factor

## Color Palette

### Primary Colors
```css
--purple-primary: #8B5CF6;    /* Main brand color */
--pink-accent: #EC4899;       /* Exciting moments */
--blue-electric: #3B82F6;     /* Player 1 */
--green-lime: #84CC16;        /* Correct answers */
--orange-vibrant: #F97316;    /* Player 2 */
--yellow-bright: #FDE047;     /* Stars, achievements */
--red-alert: #EF4444;         /* Wrong answers, urgency */
```

### Gradient Combinations
```css
--gradient-sunset: linear-gradient(135deg, #F97316 0%, #EC4899 100%);
--gradient-ocean: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
--gradient-success: linear-gradient(135deg, #84CC16 0%, #10B981 100%);
--gradient-energy: linear-gradient(135deg, #FDE047 0%, #F97316 100%);
```

## Typography Scale

```css
/* Base size: 18px for mobile, 20px for desktop */
--text-xs: 0.75rem;     /* 13.5px - metadata */
--text-sm: 0.875rem;    /* 15.75px - captions */
--text-base: 1rem;      /* 18px - body text */
--text-lg: 1.25rem;     /* 22.5px - buttons */
--text-xl: 1.5rem;      /* 27px - subheadings */
--text-2xl: 2rem;       /* 36px - questions */
--text-3xl: 2.5rem;     /* 45px - scores */
--text-4xl: 3rem;       /* 54px - main headings */
--text-5xl: 4rem;       /* 72px - session codes */
--text-6xl: 5rem;       /* 90px - big numbers */
```

## Placeholder Avatar System

### Geometric Avatars
```tsx
// Generate unique avatar from player ID
const avatarShapes = ['circle', 'square', 'hexagon', 'star', 'diamond'];
const avatarColors = ['blue', 'green', 'orange', 'pink', 'purple'];

// CSS classes for each shape
.avatar-circle { clip-path: circle(50%); }
.avatar-square { border-radius: 20%; }
.avatar-hexagon { clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); }
.avatar-star { clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); }
.avatar-diamond { clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); }
```

### Emoji Fallbacks
```tsx
const playerEmojis = ['🦊', '🐸', '🦁', '🐙', '🦜', '🐢', '🦋', '🐝', '🦈', '🦩'];
```

## Component Styling Patterns

### Buttons
```css
.btn-primary {
  @apply px-8 py-4 text-xl font-bold text-white rounded-2xl 
         transform transition-all duration-200 active:scale-95
         shadow-lg hover:shadow-xl;
  background: var(--gradient-sunset);
}

.btn-secondary {
  @apply px-8 py-4 text-xl font-bold rounded-2xl 
         bg-white text-purple-600 border-4 border-purple-600
         transform transition-all duration-200 active:scale-95;
}
```

### Cards
```css
.game-card {
  @apply rounded-3xl p-8 shadow-2xl backdrop-blur-sm;
  background: rgba(255, 255, 255, 0.9);
  border: 3px solid rgba(139, 92, 246, 0.2);
}

.answer-option {
  @apply rounded-2xl p-6 text-xl font-semibold cursor-pointer
         transform transition-all duration-200 hover:scale-105;
  background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%);
  border: 3px solid transparent;
}

.answer-option:hover {
  border-color: var(--purple-primary);
}
```

## Animation Library

```css
/* Entrance animations */
@keyframes slideInBounce {
  0% { transform: translateY(30px); opacity: 0; }
  60% { transform: translateY(-10px); opacity: 1; }
  100% { transform: translateY(0); }
}

@keyframes popIn {
  0% { transform: scale(0.8); opacity: 0; }
  90% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}

/* Celebration animations */
@keyframes confetti {
  0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}

/* Utility classes */
.animate-slide-bounce { animation: slideInBounce 0.6s ease-out; }
.animate-pop { animation: popIn 0.4s ease-out; }
.animate-pulse-slow { animation: pulse 3s infinite; }
```

## Host Character Placeholder

```tsx
// Simple animated host using CSS
<div className="host-placeholder">
  <div className="host-head animate-bounce" />
  <div className="host-speech-bubble animate-pulse-slow">
    <p className="text-2xl">Welcome to Trivia Time!</p>
  </div>
</div>

// CSS
.host-placeholder {
  @apply relative w-48 h-48 mx-auto;
}

.host-head {
  @apply w-32 h-32 mx-auto rounded-full;
  background: var(--gradient-sunset);
  box-shadow: 0 0 40px rgba(249, 115, 22, 0.5);
}

.host-speech-bubble {
  @apply absolute -top-16 left-1/2 transform -translate-x-1/2
         bg-white rounded-3xl px-6 py-3 shadow-xl;
}
```

## Responsive Breakpoints

```css
/* Mobile first approach */
@media (min-width: 640px) {  /* Tablet */
  :root { font-size: 19px; }
}

@media (min-width: 1024px) { /* Desktop */
  :root { font-size: 20px; }
}

@media (min-width: 1920px) { /* Large screens */
  :root { font-size: 22px; }
}
```

## Future Art Asset Integration

```tsx
// Component structure ready for art assets
<Avatar 
  placeholder="geometric" // or "emoji"
  shape="hexagon"
  color="purple"
  imageUrl={player.avatarUrl} // When available
/>

<GameHost
  placeholder="animated-circle"
  characterUrl={host.characterUrl} // When available
  speechBubble={currentMessage}
/>
```

## Accessibility Features

- All interactive elements have `:focus` states with visible outlines
- Color combinations meet WCAG AAA standards
- Animations respect `prefers-reduced-motion`
- Touch targets minimum 44x44px
- Clear visual hierarchy with size and weight differences