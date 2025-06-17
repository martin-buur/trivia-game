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
        'p-6 sm:p-8 shadow-lg bg-white border border-border-medium',
      floating:
        'p-6 sm:p-8 shadow-xl bg-white border border-border-light hover:shadow-2xl',
      answer:
        'p-4 sm:p-6 bg-white border-2 border-border-light hover:border-primary hover:bg-primary-light/5 transform hover:scale-105 focus-within:ring-4 focus-within:ring-primary/50 shadow-md hover:shadow-lg',
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
