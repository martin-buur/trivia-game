import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  variant?: 'default' | 'code';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, label, variant = 'default', className = '', ...props }, ref) => {
    const baseClasses =
      'w-full rounded-2xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed bg-white shadow-sm';

    const variantClasses = {
      default:
        'px-4 py-3 sm:px-6 sm:py-4 text-lg sm:text-xl text-text-primary border-border-medium focus:border-primary focus:ring-primary/20 placeholder:text-text-tertiary',
      code: 'px-6 py-4 sm:px-8 sm:py-6 text-3xl sm:text-4xl md:text-5xl font-bold text-center tracking-widest uppercase text-primary-dark border-border-medium focus:border-primary focus:ring-primary/20 placeholder:text-text-tertiary',
    };

    const errorClasses = error
      ? 'border-error focus:border-error focus:ring-error/20'
      : '';

    return (
      <div className="w-full">
        {label && (
          <label className="block mb-2 text-lg font-semibold text-text-primary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`${baseClasses} ${variantClasses[variant]} ${errorClasses} ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-error font-medium animate-slide-up">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
