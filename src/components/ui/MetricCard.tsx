import { ReactNode } from 'react';

export interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: ReactNode;
  iconBgColor?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  onClick?: () => void;
  id?: string;
}

export const MetricCard = ({
  label,
  value,
  subtext,
  icon,
  iconBgColor = 'bg-blue-50 text-blue-600',
  trend,
  onClick,
  id,
}: MetricCardProps) => {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-xl p-5 shadow-sm transition-all duration-150 ${
        onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-md' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-slate-500 text-xs font-medium uppercase tracking-wider truncate">
          {label}
        </p>
        <div className={`p-2 rounded-lg shrink-0 ${iconBgColor}`}>{icon}</div>
      </div>

      <div className="flex items-baseline justify-between gap-2 mt-1">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900">{value}</h3>
        {trend && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${
              trend.isPositive
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-rose-50 text-rose-600'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtext && <p className="text-xs text-slate-500 mt-1.5 truncate">{subtext}</p>}
    </div>
  );
};
