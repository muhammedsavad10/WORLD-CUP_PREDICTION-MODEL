import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, AlertCircle, Database, ShieldAlert, Cpu, Heart } from 'lucide-react';
import { apiFetch, API_BASE_URL } from '../../../lib/api';

export const SystemPage: React.FC = () => {
  const { data: systemResponse, isLoading, isError, refetch } = useQuery({
    queryKey: ['system_status'],
    queryFn: async ({ signal }) => {
      const res = await apiFetch('/api/v1/public/system/status', { signal });
      return res.json();
    }
  });

  // Admin Mutations
  const flushRamCache = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/v1/admin/cache/flush-repository', { method: 'POST' });
      return res.json();
    },
    onSuccess: (data) => {
      alert(data.message || 'RAM cache flushed successfully!');
    }
  });

  const flushSqlCache = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/v1/admin/cache/flush-db-cache', { method: 'POST' });
      return res.json();
    },
    onSuccess: (data) => {
      alert(data.message || 'SQLite cache flushed successfully!');
    }
  });

  const rebuildSim = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/v1/admin/simulation/rebuild', { method: 'POST' });
      return res.json();
    },
    onSuccess: (data) => {
      alert(data.message || 'Monte Carlo probabilities re-built successfully!');
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <span className="text-slate-400 text-sm font-semibold">Testing API routing and database handles...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h3 className="text-lg font-bold text-slate-200">System Connection Failed</h3>
        <p className="text-slate-400 text-sm">Please verify the FastAPI backend is running on {API_BASE_URL}.</p>
        <button 
          onClick={() => refetch()} 
          className="mt-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-sm text-slate-100 font-bold transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const sys = systemResponse?.data || {};
  const db = sys.database || {};

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
          System Health
        </h2>
        <p className="text-slate-400 text-sm mt-1">Real-time status indicators and database operations commands.</p>
      </div>

      {/* Health status bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl flex items-center justify-between border border-emerald-500/10">
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Service Status</span>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500"></span>
              <span className="font-extrabold text-slate-100 uppercase tracking-tight">{sys.status}</span>
            </div>
          </div>
          <Heart className="w-10 h-10 text-emerald-500/20" />
        </div>

        <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Core Engine Version</span>
            <span className="font-extrabold text-slate-100">{sys.version}</span>
          </div>
          <Cpu className="w-10 h-10 text-slate-500/20" />
        </div>

        <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Completed Matches Ingested</span>
            <span className="font-extrabold text-slate-100">{db.completed_matches} / {db.total_matches}</span>
          </div>
          <Database className="w-10 h-10 text-slate-500/20" />
        </div>
      </div>

      {/* Admin Panel */}
      <div className="glass-card p-8 rounded-2xl space-y-6 border border-amber-500/10">
        <h3 className="text-md font-bold text-amber-500 flex items-center gap-2 border-b border-slate-800 pb-3">
          <ShieldAlert className="w-5 h-5 text-amber-500" />
          <span>System Maintenance & Actions</span>
        </h3>

        <p className="text-slate-400 text-sm leading-relaxed">
          The following operations flush dynamic cache keys or trigger deterministic Monte Carlo simulation updates. These processes can be triggered manually during debugging.
        </p>

        <div className="flex flex-wrap gap-4 pt-2">
          {/* Flush RAM cache */}
          <button 
            onClick={() => flushRamCache.mutate()}
            disabled={flushRamCache.isPending}
            className="px-5 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-sm font-semibold rounded-xl transition-all"
          >
            {flushRamCache.isPending ? 'Flushing...' : 'Flush Repository RAM Cache'}
          </button>

          {/* Flush SQL cache */}
          <button 
            onClick={() => flushSqlCache.mutate()}
            disabled={flushSqlCache.isPending}
            className="px-5 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-sm font-semibold rounded-xl transition-all"
          >
            {flushSqlCache.isPending ? 'Flushing...' : 'Flush SQLite XAI Cache'}
          </button>

          {/* Rebuild simulations */}
          <button 
            onClick={() => rebuildSim.mutate()}
            disabled={rebuildSim.isPending}
            className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-dark-950 text-sm font-bold rounded-xl shadow-lg transition-all"
          >
            {rebuildSim.isPending ? 'Rebuilding...' : 'Re-Run Monte Carlo Simulation'}
          </button>
        </div>
      </div>
    </div>
  );
};
