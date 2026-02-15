'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface TokenData {
  name: string;
  value: number;
}

interface TokenDistributionProps {
  data: TokenData[];
}

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const shortenName = (name: string) => {
  // Strip provider prefix (e.g. "anthropic/claude-sonnet-4.5" -> "claude-sonnet-4.5")
  const base = name.split('/').pop() || name;
  // Clean up: dashes to spaces, title case
  return base
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(':free', ' (Free)');
};

export default function TokenDistribution({ data }: TokenDistributionProps) {
  const formattedData = data.map((item, index) => ({
    ...item,
    name: shortenName(item.name),
    fill: COLORS[index % COLORS.length],
  }));

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-white dark:text-white mb-4">Token Distribution</h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={formattedData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
              label={false}
              labelLine={false}
            >
              {formattedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: number | undefined) => [value !== undefined ? formatNumber(value) : '-', 'Tokens']}
              labelStyle={{ color: 'rgba(255,255,255,0.8)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Custom legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3">
        {formattedData.map((item, index) => {
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : '0';
          return (
            <div key={index} className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.fill }} />
              <span className="text-gray-700 dark:text-white/70">{item.name} {pct}%</span>
            </div>
          );
        })}
      </div>
      <div className="text-center mt-3">
        <p className="text-gray-500 dark:text-white/60 text-sm">Total Tokens</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(total)}</p>
      </div>
    </div>
  );
}