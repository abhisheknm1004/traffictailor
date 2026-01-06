
import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  status: 'good' | 'needs-improvement' | 'poor';
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, subtext, status }) => {
  const statusColors = {
    good: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    'needs-improvement': 'text-amber-600 bg-amber-50 border-amber-100',
    poor: 'text-rose-600 bg-rose-50 border-rose-100',
  };

  return (
    <div className={`p-4 rounded-xl border ${statusColors[status]} transition-all hover:shadow-sm`}>
      <div className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-75">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {subtext && <div className="text-xs mt-1">{subtext}</div>}
    </div>
  );
};

export default MetricCard;
