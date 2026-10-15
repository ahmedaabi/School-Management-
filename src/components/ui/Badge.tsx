import { ReactNode } from 'react';

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple'
  | 'neutral';

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot = false,
}: BadgeProps) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 font-medium leading-tight',
    md: 'text-xs px-2.5 py-0.5 font-medium leading-tight',
  };

  const variantClasses: Record<BadgeVariant, { container: string; dot: string }> = {
    default: {
      container: 'bg-blue-50 text-blue-600 border border-blue-100',
      dot: 'bg-blue-600',
    },
    success: {
      container: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      dot: 'bg-emerald-500',
    },
    warning: {
      container: 'bg-amber-50 text-amber-600 border border-amber-100',
      dot: 'bg-amber-500',
    },
    danger: {
      container: 'bg-rose-50 text-rose-600 border border-rose-100',
      dot: 'bg-rose-500',
    },
    info: {
      container: 'bg-blue-50 text-blue-600 border border-blue-100',
      dot: 'bg-blue-500',
    },
    purple: {
      container: 'bg-purple-50 text-purple-700 border border-purple-100',
      dot: 'bg-purple-500',
    },
    neutral: {
      container: 'bg-slate-100 text-slate-700 border border-slate-200',
      dot: 'bg-slate-400',
    },
  };

  const selected = variantClasses[variant] || variantClasses.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full whitespace-nowrap select-none ${sizeClasses[size]} ${selected.container} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${selected.dot}`} />}
      <span className="truncate">{children}</span>
    </span>
  );
};
