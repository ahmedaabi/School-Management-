import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'subtle';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      children,
      id,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'text-xs px-3 py-1.5 h-8 gap-1.5 font-semibold rounded-lg',
      md: 'text-xs px-4 py-2 h-9 gap-2 font-semibold rounded-lg',
      lg: 'text-sm px-5 py-2.5 h-10.5 gap-2.5 font-bold rounded-lg',
    };

    const variantClasses = {
      primary:
        'bg-blue-600 hover:bg-blue-700 text-white shadow-sm border border-blue-700/40 active:scale-[0.98]',
      secondary:
        'bg-slate-900 hover:bg-slate-800 text-white shadow-sm border border-slate-800 active:scale-[0.98]',
      outline:
        'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 shadow-sm active:scale-[0.98]',
      subtle:
        'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 active:scale-[0.98]',
      danger:
        'bg-rose-600 hover:bg-rose-700 text-white shadow-sm border border-rose-700/60 active:scale-[0.98]',
      ghost:
        'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
    };

    return (
      <button
        ref={ref}
        id={id}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center whitespace-nowrap transition-colors duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
