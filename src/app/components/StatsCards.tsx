'use client';

interface StatsCardsProps {
  totalTokens: number;
  totalCost: number;
  sessionCount: number;
  avgCostPerSession: number;
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(2);
};

export default function StatsCards({ 
  totalTokens, 
  totalCost, 
  sessionCount, 
  avgCostPerSession 
}: StatsCardsProps) {
  const stats = [
    {
      label: 'Total Tokens',
      value: formatNumber(totalTokens),
      icon: '📊',
      color: 'border-l-4 border-l-purple-500',
    },
    {
      label: 'Total Cost',
      value: `$${totalCost.toFixed(4)}`,
      icon: '💰',
      color: 'border-l-4 border-l-green-500',
    },
    {
      label: 'Sessions',
      value: sessionCount.toString(),
      icon: '💬',
      color: 'border-l-4 border-l-amber-500',
    },
    {
      label: 'Avg Cost/Session',
      value: `$${avgCostPerSession.toFixed(4)}`,
      icon: '📈',
      color: 'border-l-4 border-l-cyan-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <div 
          key={stat.label}
          className={`glass-card p-4 ${stat.color}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{stat.icon}</span>
            <span className="text-white/60 text-sm">{stat.label}</span>
          </div>
          <p className="text-2xl font-bold text-white">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}