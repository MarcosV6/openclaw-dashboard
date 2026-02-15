'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface UsageData {
  date: string;
  tokens: number;
  cost: number;
}

interface UsageOverTimeProps {
  data: UsageData[];
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function UsageOverTime({ data }: UsageOverTimeProps) {
  const formattedData = data.map(item => ({
    ...item,
    date: formatDate(item.date),
    tokensFormatted: formatNumber(item.tokens),
  }));

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Token Usage Over Time</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
            <XAxis
              dataKey="date"
              stroke="rgba(128,128,128,0.4)"
              tick={{ fill: '#6b7280' }}
              fontSize={12}
            />
            <YAxis
              stroke="rgba(128,128,128,0.4)"
              tick={{ fill: '#6b7280' }}
              fontSize={12}
              tickFormatter={(value) => formatNumber(value)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#fff'
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.8)' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="tokens" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
              name="Tokens"
            />
            <Line 
              type="monotone" 
              dataKey="cost" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2 }}
              name="Cost ($)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}