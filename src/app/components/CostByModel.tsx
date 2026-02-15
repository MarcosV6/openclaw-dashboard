'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ModelData {
  model: string;
  cost: number;
  tokens: number;
}

interface CostByModelProps {
  data: ModelData[];
}

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

const formatCost = (num: number) => `$${num.toFixed(2)}`;
const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const shortenModelName = (name: string) => {
  const base = name.split('/').pop() || name;
  return base
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(':free', ' (Free)');
};

export default function CostByModel({ data }: CostByModelProps) {
  const formattedData = data.map((item, index) => ({
    ...item,
    model: shortenModelName(item.model),
    costFormatted: formatCost(item.cost),
    fill: COLORS[index % COLORS.length],
  }));

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Cost by Model</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" horizontal={false} />
            <XAxis
              type="number"
              stroke="rgba(128,128,128,0.4)"
              tick={{ fill: '#6b7280' }}
              fontSize={12}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
            />
            <YAxis
              type="category"
              dataKey="model"
              stroke="rgba(128,128,128,0.4)"
              tick={{ fill: '#6b7280' }}
              fontSize={11}
              width={120}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: number | undefined, name: string | undefined) => [
                value !== undefined && name !== undefined
                  ? (name === 'cost' ? `$${value.toFixed(4)}` : formatNumber(value))
                  : '-',
                (name === 'cost' ? 'Cost' : name || 'Tokens')
              ]}
              labelStyle={{ color: 'rgba(255,255,255,0.8)' }}
            />
            <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
              {formattedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}