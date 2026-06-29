import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, BarChart, Bar, AreaChart, Area
} from 'recharts';
import { Loader2, AlertCircle, BarChart3, Target, ShieldCheck } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { data: analyticsResponse, isLoading, isError } = useQuery({
    queryKey: ['model_analytics'],
    queryFn: async () => {
      const res = await fetch('http://localhost:8000/api/v1/public/system/analytics');
      if (!res.ok) throw new Error('Analytics API error');
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <span className="text-slate-400 text-sm font-semibold">Compiling metrics, calibration curves, and Brier scores...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h3 className="text-lg font-bold text-slate-200">Error loading analytics</h3>
        <p className="text-slate-400 text-sm">Please verify the backend is running.</p>
      </div>
    );
  }

  const metrics = analyticsResponse?.data || {};
  const rollingData = metrics.rolling_accuracy || [];
  const histData = metrics.confidence_histogram || [];
  const calCurve = metrics.calibration_curve || [];
  
  const brierScore = (typeof metrics.overall_brier_score === 'number') 
    ? metrics.overall_brier_score.toFixed(4) 
    : 'N/A';

  // Format rolling data to make it scan better
  const formattedRolling = rollingData.map((d: any) => ({
    match: `M${d.match_number}`,
    accuracy: Math.round(d.accuracy)
  }));

  // Format calibration curve data
  const formattedCal = calCurve.map((d: any) => ({
    name: d.bin,
    predicted: Math.round(d.predicted),
    actual: Math.round(d.actual)
  }));

  return (
    <div className="space-y-10">
      
      {/* Header & Brier score card */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-slate-800/40 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Model Analytics
          </h2>
          <p className="text-slate-400 text-sm mt-1">Mathematical validation, calibration quality, and historical accuracy tracking.</p>
        </div>

        {/* Speedometer Telemetry widget */}
        <div className="glass-card px-6 py-4 rounded-2xl flex items-center gap-4 border border-amber-500/25 bg-slate-950/20 shadow-md">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest block">Brier Score (Calibration Error)</span>
            <span className="text-3xl font-black text-amber-400 tracking-tight">{brierScore}</span>
          </div>
          <div className="text-slate-500 text-[10px] max-w-[150px] leading-relaxed font-semibold pl-2 border-l border-slate-800/60">
            Measures predictive calibration error. Lower is better (0.0 represents perfect foresight).
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Rolling Accuracy Chart */}
        <div className="glass-card p-6 rounded-3xl space-y-4 border border-slate-800/40 bg-slate-950/10">
          <h3 className="text-sm font-bold text-slate-300 border-b border-slate-800/40 pb-2 flex items-center gap-2">
            <BarChart3 className="w-4.5 h-4.5 text-amber-500" />
            <span>Rolling Prediction Accuracy (%)</span>
          </h3>
          <div className="w-full h-[300px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedRolling}>
                <defs>
                  <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="match" stroke="#475569" fontSize={9} tickLine={false} />
                <YAxis stroke="#475569" fontSize={9} tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(3, 7, 18, 0.9)', borderColor: 'rgba(255,255,255,0.05)', fontSize: '11px', borderRadius: '12px' }}
                  formatter={(v) => [`${v}%`, 'Accuracy']}
                />
                <Area type="monotone" dataKey="accuracy" stroke="#fbbf24" fillOpacity={1} fill="url(#colorAcc)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confidence Histogram Chart */}
        <div className="glass-card p-6 rounded-3xl space-y-4 border border-slate-800/40 bg-slate-950/10">
          <h3 className="text-sm font-bold text-slate-300 border-b border-slate-800/40 pb-2 flex items-center gap-2">
            <ShieldCheck className="w-4.5 h-4.5 text-emerald-500" />
            <span>Confidence Distribution (Correct vs Incorrect)</span>
          </h3>
          <div className="w-full h-[300px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="bin" stroke="#475569" fontSize={9} tickLine={false} />
                <YAxis stroke="#475569" fontSize={9} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(3, 7, 18, 0.9)', borderColor: 'rgba(255,255,255,0.05)', fontSize: '11px', borderRadius: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Bar dataKey="correct" stackId="a" fill="#10b981" name="Correct" radius={[0, 0, 0, 0]} />
                <Bar dataKey="incorrect" stackId="a" fill="#f43f5e" name="Incorrect" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Calibration Curve Chart */}
        <div className="glass-card p-6 rounded-3xl space-y-4 lg:col-span-2 border border-slate-800/40 bg-slate-950/10">
          <h3 className="text-sm font-bold text-slate-300 border-b border-slate-800/40 pb-2 flex items-center gap-2">
            <BarChart3 className="w-4.5 h-4.5 text-blue-500" />
            <span>Calibration Curve (Predicted vs Observed Probability)</span>
          </h3>
          <div className="w-full h-[350px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedCal}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(3, 7, 18, 0.9)', borderColor: 'rgba(255,255,255,0.05)', fontSize: '11px', borderRadius: '12px' }}
                  formatter={(v) => [`${v}%`]}
                />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="predicted" stroke="#3b82f6" name="Expected Probability" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="actual" stroke="#10b981" name="Observed Win Rate" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
