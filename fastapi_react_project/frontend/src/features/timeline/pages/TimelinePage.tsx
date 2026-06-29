import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { Loader2, AlertCircle, TrendingUp } from 'lucide-react';

export const TimelinePage: React.FC = () => {
  const { data: timelineResponse, isLoading, isError } = useQuery({
    queryKey: ['odds_timeline'],
    queryFn: async () => {
      const res = await fetch('http://localhost:8000/api/v1/public/simulation/timeline');
      if (!res.ok) throw new Error('Timeline API error');
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <span className="text-slate-400 text-sm font-semibold">Scanning snapshots directory...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h3 className="text-lg font-bold text-slate-200">Error loading timeline</h3>
        <p className="text-slate-400 text-sm">Please verify the backend is running.</p>
      </div>
    );
  }

  const rawSnaps = timelineResponse?.data || [];
  
  if (rawSnaps.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
          Probability Timeline
        </h2>
        <div className="glass-card p-12 text-center rounded-2xl">
          <p className="text-slate-500 text-sm">No historical snapshots found in snapshots directory.</p>
        </div>
      </div>
    );
  }

  // Format data for Recharts
  const chartData = rawSnaps.map((snap: any) => {
    // Format timestamp like "YYYY-MM-DD HH:MM" from ISO string "YYYY-MM-DDTHH-MM"
    const displayTime = snap.timestamp.replace('T', ' ').replace('-', ':');
    return {
      name: displayTime,
      ...snap.champion_probabilities
    };
  });

  // Identify top teams in the latest snapshot
  const latestSnap = rawSnaps[rawSnaps.length - 1];
  const sortedLatest = Object.entries(latestSnap.champion_probabilities)
    .map(([team, val]) => ({ team, val: val as number }))
    .sort((a, b) => b.val - a.val);

  // Take top 5 teams
  const topTeams = sortedLatest.slice(0, 5).map(t => t.team);
  const COLORS = ['#fbbf24', '#3b82f6', '#10b981', '#f43f5e', '#8b5cf6'];

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
          Probability Timeline
        </h2>
        <p className="text-slate-400 text-sm mt-1">Championship probability trends of top contenders across snapshot runs.</p>
      </div>

      <div className="glass-card p-8 rounded-2xl space-y-6">
        <h3 className="text-md font-bold text-slate-300 flex items-center gap-2 border-b border-slate-800 pb-3">
          <TrendingUp className="w-5 h-5 text-amber-500" />
          <span>Contender Odds Trend</span>
        </h3>

        <div className="w-full h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                  borderColor: 'rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '12px'
                }}
                formatter={(value: any) => [`${(value * 100).toFixed(2)}%`]}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              {topTeams.map((team, idx) => (
                <Line 
                  key={team} 
                  type="monotone" 
                  dataKey={team} 
                  stroke={COLORS[idx % COLORS.length]} 
                  strokeWidth={2.5} 
                  dot={{ r: 4 }} 
                  activeDot={{ r: 6 }} 
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
