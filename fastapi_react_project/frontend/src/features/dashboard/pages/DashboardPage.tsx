import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Loader2, AlertCircle, ArrowUpRight, 
  ArrowDownRight, RefreshCw, BarChart2, Calendar, Target, HelpCircle
} from 'lucide-react';

const ISO_2_CODES: Record<string, string> = {
  'Argentina': 'ar', 'Canada': 'ca', 'Mexico': 'mx', 'USA': 'us', 'Germany': 'de',
  'France': 'fr', 'Brazil': 'br', 'England': 'gb-eng', 'Spain': 'es', 'Portugal': 'pt',
  'Italy': 'it', 'Netherlands': 'nl', 'Belgium': 'be', 'Croatia': 'hr', 'Morocco': 'ma',
  'Japan': 'jp', 'South Korea': 'kr', 'Uruguay': 'uy', 'Senegal': 'sn', 'South Africa': 'za',
  'Switzerland': 'ch', 'Denmark': 'dk', 'Ukraine': 'ua', 'Austria': 'at', 'Turkey': 'tr',
  'Iran': 'ir', 'Australia': 'au', 'Colombia': 'co', 'Ecuador': 'ec', 'Peru': 'pe',
  'Chile': 'cl', 'Sweden': 'se', 'Norway': 'no', 'Poland': 'pl', 'Czechia': 'cz',
  'Paraguay': 'py', 'Bosnia and Herzegovina': 'ba', 'Qatar': 'qa', 'Morocco ': 'ma',
  'Haiti': 'ht', 'Scotland': 'gb-sct', 'Ivory Coast': 'ci', 'Curacao': 'cw', 'Tunisia': 'tn',
  'Egypt': 'eg', 'New Zealand': 'nz', 'Saudi Arabia': 'sa', 'Cape Verde': 'cv',
  'Norway ': 'no', 'Iraq': 'iq', 'Algeria': 'dz', 'Austria ': 'at', 'Jordan': 'jo',
  'Uzbekistan': 'uz', 'DR Congo': 'cd', 'Ghana': 'gh', 'Panama': 'pa'
};

const getFlagUrl = (teamName: string) => {
  const code = ISO_2_CODES[teamName] || ISO_2_CODES[teamName.trim()] || 'un';
  return `https://flagcdn.com/w40/${code}.png`;
};

export const DashboardPage: React.FC = () => {
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8000/api/v1/public/dashboard');
      if (!response.ok) throw new Error('API fetch error');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <span className="text-slate-400 text-sm font-semibold">Warming up forecast engines...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h3 className="text-lg font-bold text-slate-200">Failed to load statistics</h3>
        <p className="text-slate-400 text-sm">Please verify the FastAPI backend is running on port 8000.</p>
        <button 
          onClick={() => refetch()} 
          className="mt-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-sm text-slate-100 font-bold transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const summary = data?.data || {};
  const topOdds = summary.top_odds || [];
  const risers = summary.momentum?.risers || [];
  const fallers = summary.momentum?.fallers || [];

  const cardsData = [
    { 
      label: 'Completed Matches', 
      value: summary.matches_completed, 
      sub: `Of 104 matches played`, 
      icon: Calendar,
      accent: 'border-emerald-500/10 hover:border-emerald-500/30'
    },
    { 
      label: 'Remaining Matches', 
      value: summary.matches_remaining, 
      sub: `Simulated stochastically`, 
      icon: HelpCircle,
      accent: 'border-blue-500/10 hover:border-blue-500/30'
    },
    { 
      label: 'Model Accuracy', 
      value: summary.model_accuracy, 
      sub: `${summary.correct_predictions} / ${summary.total_predictions} correct`, 
      icon: Target,
      accent: 'border-amber-500/10 hover:border-amber-500/30'
    },
    { 
      label: 'Monte Carlo Iterations', 
      value: '10,000', 
      sub: `Stochastic walks run`, 
      icon: BarChart2,
      accent: 'border-indigo-500/10 hover:border-indigo-500/30'
    }
  ];

  return (
    <div className="space-y-10">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/40 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Forecast Dashboard
          </h2>
          <p className="text-slate-400 text-sm mt-1">Live updates from simulated and completed fixtures.</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-xs font-semibold">Last Ingest: {summary.last_updated}</span>
          <button 
            onClick={() => refetch()} 
            disabled={isRefetching}
            className="p-2.5 hover:bg-slate-800/80 rounded-xl text-slate-400 hover:text-slate-200 border border-slate-800 bg-slate-950/30 backdrop-blur-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardsData.map((card, idx) => {
          const IconComp = card.icon;
          return (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className={`glass-card p-6 rounded-2xl flex flex-col justify-between border ${card.accent}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">{card.label}</span>
                <IconComp className="w-5 h-5 text-slate-500" />
              </div>
              <span className="text-4xl font-black block text-slate-100 mt-6 tracking-tight">{card.value}</span>
              <span className="text-slate-500 text-xs mt-3 block font-semibold">{card.sub}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Lists / Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Top Championship Candidates */}
        <div className="glass-card p-8 rounded-3xl lg:col-span-2 space-y-6 border border-slate-800/50">
          <h3 className="text-lg font-black text-slate-200 flex items-center justify-between pb-3 border-b border-slate-800/50">
            <span>Title Contenders (Championship Probabilities)</span>
            <span className="text-xs text-slate-400 font-bold uppercase">Monte Carlo Odds</span>
          </h3>
          
          <div className="space-y-5">
            {topOdds.map((item: any, idx: number) => {
              return (
                <motion.div 
                  key={item.team} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between text-sm font-bold">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-xs font-black w-4">{idx + 1}.</span>
                      <img 
                        src={getFlagUrl(item.team)} 
                        alt={item.team} 
                        className="w-5 h-3.5 object-cover rounded-sm shadow-sm border border-white/5"
                      />
                      <span className="text-slate-200">{item.team}</span>
                    </div>
                    <span className="text-amber-400 font-black text-md">{item.probability}%</span>
                  </div>
                  
                  {/* Slider Progress Bar */}
                  <div className="w-full bg-slate-950 border border-slate-900 rounded-full h-3.5 overflow-hidden p-0.5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.probability}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: idx * 0.05 }}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Momentum (Risers and Fallers) */}
        <div className="space-y-6 flex flex-col justify-start">
          
          {/* Risers */}
          <div className="glass-card p-6 rounded-2xl flex-1 space-y-4 border border-emerald-500/5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400 border-b border-slate-800/40 pb-2">
              Biggest Risers
            </h3>
            {risers.length > 0 ? (
              <div className="space-y-3">
                {risers.map((item: any, idx: number) => {
                  return (
                    <motion.div 
                      key={item.team} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between py-1.5 border-b border-slate-800/10 last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <img 
                          src={getFlagUrl(item.team)} 
                          alt={item.team} 
                          className="w-5 h-3.5 object-cover rounded-sm shadow-sm border border-white/5"
                        />
                        <span className="text-sm text-slate-200 font-semibold">{item.team}</span>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-400 text-[11px] font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/15">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>{item.change}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <span className="text-slate-500 text-xs block py-2">No performance increases recorded.</span>
            )}
          </div>

          {/* Fallers */}
          <div className="glass-card p-6 rounded-2xl flex-1 space-y-4 border border-rose-500/5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-rose-400 border-b border-slate-800/40 pb-2">
              Biggest Fallers
            </h3>
            {fallers.length > 0 ? (
              <div className="space-y-3">
                {fallers.map((item: any, idx: number) => {
                  return (
                    <motion.div 
                      key={item.team} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between py-1.5 border-b border-slate-800/10 last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <img 
                          src={getFlagUrl(item.team)} 
                          alt={item.team} 
                          className="w-5 h-3.5 object-cover rounded-sm shadow-sm border border-white/5"
                        />
                        <span className="text-sm text-slate-200 font-semibold">{item.team}</span>
                      </div>
                      <div className="flex items-center gap-1 text-rose-400 text-[11px] font-bold bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/15">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        <span>{item.change}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <span className="text-slate-500 text-xs block py-2">No performance drops recorded.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
