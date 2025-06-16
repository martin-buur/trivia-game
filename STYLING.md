# Styling Guide - Trivia Game (Tailwind v4)

## Design Philosophy

- **Bright & Playful**: Bold colors that create excitement
- **Accessibility First**: Large text, high contrast, clear hierarchy
- **Art-Ready**: Placeholder system that can easily swap in real assets
- **Motion & Energy**: Smooth animations to enhance the fun factor

## Tailwind v4 Configuration

### CSS-based Configuration (app.css)

```css
@import 'tailwindcss';

@theme {
  /* Custom Colors */
  --color-primary: #8b5cf6;
  --color-primary-light: #a78bfa;
  --color-primary-dark: #7c3aed;

  --color-accent-pink: #ec4899;
  --color-accent-blue: #3b82f6;
  --color-accent-green: #84cc16;
  --color-accent-orange: #f97316;
  --color-accent-yellow: #fde047;
  --color-accent-red: #ef4444;

  /* Player Colors */
  --color-player-1: #3b82f6;
  --color-player-2: #f97316;
  --color-player-3: #10b981;
  --color-player-4: #ec4899;

  /* Animations */
  --animate-bounce-slow: bounce 3s infinite;
  --animate-pulse-slow: pulse 3s infinite;
  --animate-pop-in: popIn 0.4s ease-out;
  --animate-slide-up: slideUp 0.6s ease-out;
}

/* Custom Keyframes */
@keyframes popIn {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  90% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes slideUp {
  0% {
    transform: translateY(30px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}
```

### Using Custom Properties in Components

With Tailwind v4, you can use the custom properties directly:

```html
<!-- Using custom colors -->
<div class="bg-[--color-primary] text-white">
  <div class="bg-[--color-player-1]">
    <div class="animate-[--animate-pop-in]"></div>
  </div>
</div>
```

## Component Classes

### Buttons

```html
<!-- Primary Button -->
<button
  class="px-8 py-4 text-xl font-bold text-white rounded-2xl 
               bg-gradient-to-r from-accent-orange to-accent-pink
               transform transition-all duration-200 hover:scale-105 active:scale-95
               shadow-lg hover:shadow-xl"
>
  Create Game
</button>

<!-- Secondary Button -->
<button
  class="px-8 py-4 text-xl font-bold rounded-2xl 
               bg-white text-primary border-4 border-primary
               transform transition-all duration-200 hover:scale-105 active:scale-95"
>
  Join Game
</button>
```

### Cards

```html
<!-- Game Card -->
<div
  class="rounded-3xl p-8 shadow-2xl backdrop-blur-sm
            bg-white/90 border-4 border-primary/20"
>
  <!-- Content -->
</div>

<!-- Answer Option -->
<button
  class="w-full rounded-2xl p-6 text-xl font-semibold
               bg-white/80 border-4 border-transparent
               transform transition-all duration-200 hover:scale-105
               hover:border-primary hover:bg-white
               focus:outline-none focus:ring-4 focus:ring-primary/50"
>
  Answer Text
</button>
```

## Placeholder Avatars

### Using Tailwind Classes

```tsx
// Avatar component with geometric shapes
const avatarStyles = {
  circle: 'rounded-full',
  square: 'rounded-2xl',
  hexagon: 'mask mask-hexagon', // requires tailwind-mask plugin
  star: 'mask mask-star',
  diamond: 'rotate-45 rounded-lg',
};

const avatarColors = [
  'bg-player-1',
  'bg-player-2',
  'bg-player-3',
  'bg-player-4',
  'bg-gradient-to-br from-accent-pink to-accent-orange',
  'bg-gradient-to-br from-accent-blue to-primary',
];

// Usage
<div
  className={`w-20 h-20 ${avatarStyles.circle} ${avatarColors[0]} 
                flex items-center justify-center text-white text-3xl font-bold
                shadow-lg`}
>
  {playerInitial}
</div>;
```

### Emoji Avatars

```tsx
<div
  className="w-20 h-20 rounded-full bg-white shadow-lg
                flex items-center justify-center text-5xl"
>
  {playerEmoji}
</div>
```

## Host Character Placeholder

```html
<!-- Animated host circle -->
<div class="relative mx-auto w-48">
  <div
    class="w-32 h-32 mx-auto rounded-full 
              bg-gradient-to-br from-accent-orange to-accent-pink
              shadow-2xl shadow-accent-orange/50
              animate-bounce-slow"
  ></div>

  <!-- Speech bubble -->
  <div
    class="absolute -top-16 left-1/2 -translate-x-1/2
              bg-white rounded-3xl px-6 py-3 shadow-xl
              animate-pulse-slow"
  >
    <p class="text-heading text-center">Welcome!</p>
  </div>
</div>
```

## Responsive Text Utilities

```html
<!-- Session code display -->
<h1 class="text-6xl md:text-7xl lg:text-8xl font-black text-primary">ABC123</h1>

<!-- Question text -->
<h2 class="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800">
  What is the capital of France?
</h2>

<!-- Body text -->
<p class="text-lg md:text-xl text-gray-700">Choose your answer below</p>
```

## Animation Utilities

```html
<!-- Entrance animations -->
<div class="animate-slide-up">Content slides up on mount</div>
<div class="animate-pop-in">Content pops in</div>

<!-- Continuous animations -->
<div class="animate-pulse-slow">Gentle pulsing effect</div>
<div class="animate-bounce-slow">Slow bouncing</div>

<!-- Celebration -->
<div class="animate-spin">🎉</div>
```

## Accessibility Classes

```html
<!-- Focus states -->
<button class="... focus:outline-none focus:ring-4 focus:ring-primary/50">
  <!-- Screen reader only -->
  <span class="sr-only">Loading...</span>

  <!-- Reduced motion -->
  <div class="motion-safe:animate-bounce motion-reduce:animate-none"></div>
</button>
```

## Future Art Integration

```tsx
// Component ready for art assets
interface AvatarProps {
  imageUrl?: string;
  fallback: 'geometric' | 'emoji';
  playerColor: number;
}

<Avatar
  imageUrl={player.avatarUrl}
  fallback="geometric"
  playerColor={playerIndex}
/>;

// When art is available, component switches from placeholder to image
```
