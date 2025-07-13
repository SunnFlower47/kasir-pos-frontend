import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'red' | 'yellow' | 'indigo';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  loading?: boolean;
}

const colorClasses = {
  blue: {
    gradient: 'from-blue-500 to-blue-600',
    icon: 'text-blue-600',
    bg: 'bg-blue-100',
    text: 'text-blue-100'
  },
  green: {
    gradient: 'from-green-500 to-green-600',
    icon: 'text-green-600',
    bg: 'bg-green-100',
    text: 'text-green-100'
  },
  purple: {
    gradient: 'from-purple-500 to-purple-600',
    icon: 'text-purple-600',
    bg: 'bg-purple-100',
    text: 'text-purple-100'
  },
  red: {
    gradient: 'from-red-500 to-red-600',
    icon: 'text-red-600',
    bg: 'bg-red-100',
    text: 'text-red-100'
  },
  yellow: {
    gradient: 'from-yellow-500 to-yellow-600',
    icon: 'text-yellow-600',
    bg: 'bg-yellow-100',
    text: 'text-yellow-100'
  },
  indigo: {
    gradient: 'from-indigo-500 to-indigo-600',
    icon: 'text-indigo-600',
    bg: 'bg-indigo-100',
    text: 'text-indigo-100'
  }
};

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
  onClick,
  loading = false
}) => {
  const colors = colorClasses[color];

  if (loading) {
    return (
      <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gray-200 rounded-lg"></div>
          </div>
          <div className="ml-2 sm:ml-3 lg:ml-4 flex-1">
            <div className="h-3 bg-gray-200 rounded mb-2"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        bg-gradient-to-r ${colors.gradient} p-3 sm:p-4 lg:p-6 rounded-lg shadow-lg text-white
        ${onClick ? 'cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-200' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
        </div>
        <div className="ml-3 sm:ml-4 min-w-0 flex-1">
          <h3 className={`text-xs sm:text-sm font-medium ${colors.text} truncate`}>
            {title}
          </h3>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
            {typeof value === 'number' && value > 999999
              ? `${(value / 1000000).toFixed(1)}M`
              : typeof value === 'number' && value > 999
              ? `${(value / 1000).toFixed(1)}K`
              : value
            }
          </p>
          {subtitle && (
            <p className={`text-xs ${colors.text}`}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center mt-1">
              <span className={`text-xs ${colors.text}`}>
                {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;
