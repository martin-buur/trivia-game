import { type ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'large';
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      fullWidth = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'font-bold rounded-2xl transform transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100';

    const variantClasses = {
      primary:
        'px-6 py-3 sm:px-8 sm:py-4 text-lg sm:text-xl text-white bg-gradient-to-r from-accent-orange to-accent-pink shadow-lg hover:shadow-xl focus:ring-accent-pink/50',
      secondary:
        'px-6 py-3 sm:px-8 sm:py-4 text-lg sm:text-xl bg-white text-primary border-4 border-primary focus:ring-primary/50',
      large:
        'px-8 py-4 sm:px-10 sm:py-5 lg:px-12 lg:py-6 text-xl sm:text-2xl md:text-3xl text-white bg-gradient-to-r from-accent-orange to-accent-pink shadow-2xl hover:shadow-3xl focus:ring-accent-pink/50',
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
