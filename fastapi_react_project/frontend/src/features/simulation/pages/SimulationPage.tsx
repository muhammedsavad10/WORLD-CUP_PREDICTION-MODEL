import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, RefreshCw, Trophy, Activity } from 'lucide-react';

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
  if (!teamName) return 'https://flagcdn.com/w40/un.png';
  const trimmed = teamName.trim();
  const code = ISO_2_CODES[teamName] || ISO_2_CODES[trimmed] || 'un';
  return `https://flagcdn.com/w40/${code}.png`;
};

const COUNTRY_CODES: Record<string, string> = {
  'Argentina': 'ARG', 'Canada': 'CAN', 'Mexico': 'MEX', 'USA': 'USA', 'Germany': 'GER',
  'France': 'FRA', 'Brazil': 'BRA', 'England': 'ENG', 'Spain': 'ESP', 'Portugal': 'POR',
  'Italy': 'ITA', 'Netherlands': 'NED', 'Belgium': 'BEL', 'Croatia': 'CRO', 'Morocco': 'MAR',
  'Japan': 'JPN', 'South Korea': 'KOR', 'Uruguay': 'URU', 'Senegal': 'SEN', 'South Africa': 'RSA',
  'Switzerland': 'SUI', 'Denmark': 'DEN', 'Ukraine': 'UKR', 'Austria': 'AUT', 'Turkey': 'TUR',
  'Iran': 'IRN', 'Australia': 'AUS', 'Colombia': 'COL', 'Ecuador': 'ECU', 'Peru': 'PER',
  'Chile': 'CHI', 'Sweden': 'SWE', 'Norway': 'NOR', 'Poland': 'POL', 'Czechia': 'CZE',
  'Paraguay': 'PAR', 'Bosnia and Herzegovina': 'BIH', 'Qatar': 'QAT', 'Morocco ': 'MAR',
  'Haiti': 'HAI', 'Scotland': 'SCO', 'Ivory Coast': 'CIV', 'Curacao': 'CUW', 'Tunisia': 'TUN',
  'Egypt': 'EGY', 'New Zealand': 'NZL', 'Saudi Arabia': 'KSA', 'Cape Verde': 'CPV',
  'Norway ': 'NOR', 'Iraq': 'IRQ', 'Algeria': 'ALG', 'Austria ': 'AUT', 'Jordan': 'JOR',
  'Uzbekistan': 'UZB', 'DR Congo': 'COD', 'Ghana': 'GHA', 'Panama': 'PAN'
};

import { apiFetch, API_BASE_URL } from '../../../lib/api';

export const SimulationPage: React.FC = () => {
  const { data: treeResponse, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['bracket_tree'],
    queryFn: async ({ signal }) => {
      const res = await apiFetch('/api/v1/public/simulation/tree', { signal });
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <span className="text-slate-400 text-sm font-semibold">Running Monte Carlo bracket walker...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h3 className="text-lg font-bold text-slate-200">Simulation Error</h3>
        <p className="text-slate-400 text-sm">Please verify the FastAPI backend is running on {API_BASE_URL}.</p>
      </div>
    );
  }

  const simData = treeResponse?.data || {};
  const bracket = simData.bracket || {};
  const champion = simData.champion || 'Unknown';

  const renderMatch = (matchId: string, delayIdx: number) => {
    const m = bracket[matchId];
    if (!m) return null;

    const codeH = COUNTRY_CODES[m.home_team] || (m.home_team ? m.home_team.substring(0, 3).toUpperCase() : 'UNK');
    const codeA = COUNTRY_CODES[m.away_team] || (m.away_team ? m.away_team.substring(0, 3).toUpperCase() : 'UNK');
    const isHomeWinner = m.winner === m.home_team;
    const isAwayWinner = m.winner === m.away_team;

    return (
      <motion.div 
        key={matchId} 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: delayIdx * 0.04, ease: [0.16, 1, 0.3, 1] }}
        className="glass-card p-4 rounded-2xl space-y-3 text-xs w-48 flex flex-col justify-between border border-white/5 hover:border-amber-500/20 shadow-lg relative group overflow-hidden bg-slate-950/20"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-tr from-transparent to-white/[0.01] pointer-events-none" />
        
        <div className="flex items-center justify-between border-b border-slate-800/40 pb-2 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
          <span>M{m.match_number} • {m.label}</span>
          <span className="text-[8px] bg-slate-900 border border-slate-800/40 px-2 py-0.5 rounded-full text-slate-400">
            {m.stage.replace('_', ' ')}
          </span>
        </div>

        <div className="space-y-2.5">
          {/* Home team */}
          <div className="flex items-center justify-between" title={m.home_team}>
            <div className={`flex items-center gap-2 font-black transition-colors text-sm ${
              isHomeWinner ? 'text-amber-400' : 'text-slate-300'
            }`}>
              <img 
                src={getFlagUrl(m.home_team)} 
                alt={m.home_team} 
                className="w-5.5 h-4 object-cover rounded-sm shadow-sm border border-white/5"
              />
              <span>{codeH}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono font-bold">{m.home_probability}%</span>
          </div>

          {/* Away team */}
          <div className="flex items-center justify-between" title={m.away_team}>
            <div className={`flex items-center gap-2 font-black transition-colors text-sm ${
              isAwayWinner ? 'text-amber-400' : 'text-slate-300'
            }`}>
              <img 
                src={getFlagUrl(m.away_team)} 
                alt={m.away_team} 
                className="w-5.5 h-4 object-cover rounded-sm shadow-sm border border-white/5"
              />
              <span>{codeA}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono font-bold">{m.away_probability}%</span>
          </div>
        </div>

        {/* Small winner indicator label */}
        {m.winner && (
          <div className="pt-2 border-t border-slate-800/20 flex items-center justify-between text-[9px] text-slate-500 font-semibold italic">
            <span>Winner:</span>
            <span className="text-amber-400 font-bold not-italic">{m.winner}</span>
          </div>
        )}
      </motion.div>
    );
  };

  // Stage ranges matching FIFA 2026 48-team layout
  const colRoundOf32 = Array.from({ length: 16 }, (_, i) => String(73 + i));
  const colRoundOf16 = Array.from({ length: 8 }, (_, i) => String(89 + i));
  const colQuarterFinals = Array.from({ length: 4 }, (_, i) => String(97 + i));
  const colSemiFinals = Array.from({ length: 2 }, (_, i) => String(101 + i));

  return (
    <div className="space-y-8 h-full flex flex-col overflow-hidden">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/40 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent flex items-center gap-2">
            <Activity className="w-8 h-8 text-amber-500 animate-pulse" />
            <span>Knockout Bracket Walker</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">Deterministic results are locked; future rounds are stochastically simulated.</p>
        </div>

        <div className="flex items-center gap-3">
          {champion !== 'Unknown' && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold text-amber-400 shadow-md shadow-amber-500/5"
            >
              <Trophy className="w-4 h-4 text-amber-400 animate-bounce" />
              <div className="flex items-center gap-1.5">
                <span>Simulated Champion:</span>
                <img 
                  src={getFlagUrl(champion)} 
                  alt={champion} 
                  className="w-5.5 h-4 object-cover rounded-sm shadow-sm border border-white/5"
                />
                <span>{champion}</span>
              </div>
            </motion.div>
          )}

          <button 
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-xs text-slate-300 font-bold transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin text-amber-400' : ''}`} />
            <span>Re-run Bracket Walk</span>
          </button>
        </div>
      </div>

      {/* Bracket Tree Columns Layout - Unified Outer Scrollable Area */}
      <div className="flex-1 overflow-auto pb-6 select-none flex items-stretch gap-8 max-h-[78vh] pr-4 stadium-grid p-4 rounded-3xl border border-white/5 bg-slate-950/10">
        
        {/* Round of 32 */}
        <div className="flex flex-col justify-between py-2 min-w-[240px]">
          <div className="text-center font-bold text-slate-500 border-b border-slate-800/40 pb-2 text-[10px] uppercase tracking-widest mb-4">Round of 32</div>
          <div className="flex flex-col gap-4">
            {colRoundOf32.map((id, idx) => renderMatch(id, idx))}
          </div>
        </div>

        {/* Round of 16 */}
        <div className="flex flex-col justify-between py-2 min-w-[240px]">
          <div className="text-center font-bold text-slate-500 border-b border-slate-800/40 pb-2 text-[10px] uppercase tracking-widest mb-4">Round of 16</div>
          <div className="flex-1 flex flex-col justify-around">
            {colRoundOf16.map((id, idx) => renderMatch(id, idx * 2))}
          </div>
        </div>

        {/* Quarter Finals */}
        <div className="flex flex-col justify-between py-2 min-w-[240px]">
          <div className="text-center font-bold text-slate-500 border-b border-slate-800/40 pb-2 text-[10px] uppercase tracking-widest mb-4">Quarter Finals</div>
          <div className="flex-1 flex flex-col justify-around">
            {colQuarterFinals.map((id, idx) => renderMatch(id, idx * 4))}
          </div>
        </div>

        {/* Semi Finals */}
        <div className="flex flex-col justify-between py-2 min-w-[240px]">
          <div className="text-center font-bold text-slate-500 border-b border-slate-800/40 pb-2 text-[10px] uppercase tracking-widest mb-4">Semi Finals</div>
          <div className="flex-1 flex flex-col justify-around">
            {colSemiFinals.map((id, idx) => renderMatch(id, idx * 8))}
          </div>
        </div>

        {/* Final & 3rd Place */}
        <div className="flex flex-col justify-between py-2 min-w-[240px]">
          <div className="text-center font-bold text-slate-500 border-b border-slate-800/40 pb-2 text-[10px] uppercase tracking-widest mb-4">Final & 3rd Place</div>
          <div className="flex-1 flex flex-col justify-around">
            {renderMatch("104", 12)}
            {renderMatch("103", 14)}
          </div>
        </div>
      </div>
    </div>
  );
};
