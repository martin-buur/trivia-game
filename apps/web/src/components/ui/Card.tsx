import { type HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'floating' | 'answer';
  animate?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      animate = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'rounded-3xl transition-all duration-200';

    const variantClasses = {
      default:
        'p-6 sm:p-8 shadow-2xl backdrop-blur-sm bg-white/90 border-4 border-primary/20',
      floating:
        'p-6 sm:p-8 shadow-2xl backdrop-blur-sm bg-white/95 border-4 border-primary/10 hover:shadow-3xl',
      answer:
        'p-4 sm:p-6 bg-white/80 border-4 border-transparent hover:border-primary hover:bg-white transform hover:scale-105 focus-within:ring-4 focus-within:ring-primary/50',
    };

    const animationClass = animate ? 'animate-pop-in' : '';

    return (
      <div
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${animationClass} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
