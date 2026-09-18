import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  footerText?: string;
  icon: LucideIcon;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  color?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose';
  trend?: {
    value: string;
    isPositive: boolean;
  };
  change?: {
    value: string;
    trend?: 'up' | 'down';
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  footerText,
  icon: Icon,
  variant,
  color,
  trend,
  change,
}) => {
  // Map variant to color if variant is provided
  let activeColor = color || 'blue';
  if (variant) {
    if (variant === 'primary') activeColor = 'blue';
    else if (variant === 'success') activeColor = 'emerald';
    else if (variant === 'warning') activeColor = 'amber';
    else if (variant === 'danger') activeColor = 'rose';
    else if (variant === 'neutral') activeColor = 'purple';
  }

  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border-blue-100 dark:border-blue-900/50',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-100 dark:border-amber-900/50',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border-purple-100 dark:border-purple-900/50',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border-rose-100 dark:border-rose-900/50',
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </span>
          <div className={`p-2.5 rounded-xl border ${colorMap[activeColor]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </span>

          {trend && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                trend.isPositive
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
              }`}
            >
              {trend.value}
            </span>
          )}

          {change && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                change.trend === 'up'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : change.trend === 'down'
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {change.trend === 'up' && <ArrowUpRight className="w-3 h-3 mr-0.5" />}
              {change.trend === 'down' && <ArrowDownRight className="w-3 h-3 mr-0.5" />}
              {change.value}
            </span>
          )}
        </div>
      </div>

      {(subtitle || footerText) && (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          {subtitle || footerText}
        </p>
      )}
    </div>
  );
};
