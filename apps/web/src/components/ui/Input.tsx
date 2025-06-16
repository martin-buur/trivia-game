import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  variant?: 'default' | 'code';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, label, variant = 'default', className = '', ...props }, ref) => {
    const baseClasses =
      'w-full rounded-2xl border-4 transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
      default:
        'px-4 py-3 sm:px-6 sm:py-4 text-lg sm:text-xl border-gray-300 focus:border-primary focus:ring-primary/20',
      code: 'px-6 py-4 sm:px-8 sm:py-6 text-3xl sm:text-4xl md:text-5xl font-bold text-center tracking-widest uppercase border-gray-300 focus:border-primary focus:ring-primary/20',
    };

    const errorClasses = error
      ? 'border-accent-red focus:border-accent-red focus:ring-accent-red/20'
      : '';

    return (
      <div className="w-full">
        {label && (
          <label className="block mb-2 text-lg font-semibold text-gray-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`${baseClasses} ${variantClasses[variant]} ${errorClasses} ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-accent-red animate-slide-up">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
