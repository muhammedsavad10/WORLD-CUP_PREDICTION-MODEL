import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, AlertCircle, Loader2, Sparkles, RefreshCw, BarChart2 } from 'lucide-react';

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

import { apiFetch } from '../../../lib/api';

export const HeadToHeadPage: React.FC = () => {
  const [selectedFixtureIdx, setSelectedFixtureIdx] = useState<number>(0);
  const [isSwapped, setIsSwapped] = useState<boolean>(false);
  const [polling, setPolling] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  // Fetch valid fixtures
  const { data: fixturesData, isLoading: isLoadingFixtures } = useQuery({
    queryKey: ['valid_fixtures'],
    queryFn: ({ signal }) => apiFetch('/api/v1/public/matches/h2h/fixtures', { signal }).then(res => res.json())
  });

  const fixtures = fixturesData?.data || [];
  const selectedFixture = fixtures[selectedFixtureIdx];
  const baseTeamA = selectedFixture ? selectedFixture.home_team : 'USA';
  const baseTeamB = selectedFixture ? selectedFixture.away_team : 'Germany';
  const teamA = isSwapped ? baseTeamB : baseTeamA;
  const teamB = isSwapped ? baseTeamA : baseTeamB;
  const currentStage = selectedFixture ? selectedFixture.stage : 'Group Stage';

  // Fetch prediction odds for selected teams
  const { data: predictionData } = useQuery({
    queryKey: ['h2h_predict', teamA, teamB],
    queryFn: async ({ signal }) => {
      if (teamA === teamB) return { data: { home_probability: 50.0, away_probability: 50.0 } };
      const res = await apiFetch(`/api/v1/public/matches/h2h/predict?home_team=${teamA}&away_team=${teamB}`, { signal });
      return res.json();
    },
    enabled: !!selectedFixture
  });

  // Fetch AI report status or trigger analysis
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      setAiReport(null);
      const res = await apiFetch('/api/v1/public/reasoning/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_number: 0, home_team: teamA, away_team: teamB })
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.data?.status === 'completed') {
        setAiReport(data.data.analysis);
      } else {
        setPolling(true);
        startPolling();
      }
    }
  });

  const startPolling = () => {
    const interval = setInterval(async () => {
      try {
        const res = await apiFetch(`/api/v1/public/reasoning/status?home_team=${teamA}&away_team=${teamB}`);
        const data = await res.json();
        if (data.data?.status === 'completed') {
          setAiReport(data.data.analysis);
          setPolling(false);
          clearInterval(interval);
        }
      } catch (err) {
        setPolling(false);
        clearInterval(interval);
      }
    }, 2000);
  };

  const pred = predictionData?.data || { home_probability: 50.0, away_probability: 50.0 };
  const homeProb = typeof pred.home_probability === 'number' ? pred.home_probability : 50.0;
  const awayProb = typeof pred.away_probability === 'number' ? pred.away_probability : 50.0;

  const advantage = Math.abs(homeProb - awayProb).toFixed(1);
  const favoredTeam = homeProb > awayProb ? teamA : teamB;
  const advantageText = homeProb === awayProb 
    ? "Matchup is perfectly balanced (50.0% vs 50.0%)" 
    : `${favoredTeam} is favored by ${advantage}%`;

  return (
    <div className="space-y-10">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/40 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Head-to-Head Intelligence
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Inspecting official fixture for: <span className="text-amber-400 font-extrabold">{currentStage}</span>
          </p>
        </div>
      </div>

      {/* Selectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        
        {/* Team A Display */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 rounded-2xl flex flex-col items-center gap-4 text-center border-l-4 border-l-amber-500"
        >
          <img 
            src={getFlagUrl(teamA)} 
            alt={teamA} 
            className="w-20 h-14 object-cover rounded-xl shadow-lg border border-white/10"
          />
          <div className="w-full space-y-1">
            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">Home Side / Team A</label>
            <span className="text-slate-100 text-2xl font-black block mt-2">{teamA}</span>
          </div>
        </motion.div>

        {/* Fixture Selector (Middle Column) */}
        <div className="glass-card p-6 rounded-2xl flex flex-col items-center gap-4 text-center border border-white/5 bg-slate-950/20">
          <label className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Official Tournament Matchup</label>
          
          {isLoadingFixtures ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              <span>Loading fixtures list...</span>
            </div>
          ) : (
            <select 
              value={selectedFixtureIdx} 
              onChange={(e) => {
                setSelectedFixtureIdx(Number(e.target.value));
                setIsSwapped(false);
              }}
              className="w-full bg-[#030712] border border-slate-800 rounded-xl px-3 py-3 text-slate-200 text-sm font-semibold focus:border-amber-500/50 focus:outline-none"
            >
              {fixtures.map((f: any, idx: number) => (
                <option key={idx} value={idx}>{f.label}</option>
              ))}
            </select>
          )}

          <button 
            onClick={() => setIsSwapped(!isSwapped)}
            className="mt-2 px-5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-full text-xs text-slate-400 font-bold transition-all inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Swap Sides</span>
          </button>
        </div>

        {/* Team B Display */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 rounded-2xl flex flex-col items-center gap-4 text-center border-r-4 border-r-orange-500"
        >
          <img 
            src={getFlagUrl(teamB)} 
            alt={teamB} 
            className="w-20 h-14 object-cover rounded-xl shadow-lg border border-white/10"
          />
          <div className="w-full space-y-1">
            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">Away Side / Team B</label>
            <span className="text-slate-100 text-2xl font-black block mt-2">{teamB}</span>
          </div>
        </motion.div>
      </div>

      {/* Probabilities Output Panel */}
      {teamA === teamB ? (
        <div className="glass-panel p-6 rounded-2xl border-rose-500/10 text-center flex items-center justify-center gap-2 text-rose-400 font-semibold text-sm">
          <AlertCircle className="w-5 h-5" />
          <span>Cannot simulate a match between identical teams. Please select a valid fixture.</span>
        </div>
      ) : (
        <div className="glass-card p-8 rounded-3xl space-y-8 border border-white/5 bg-slate-950/15">
          <h3 className="text-md font-bold text-slate-300 flex items-center gap-2 border-b border-slate-800/50 pb-3">
            <BarChart2 className="w-5 h-5 text-amber-500" />
            <span>Live Prediction Telemetry</span>
          </h3>

          <div className="space-y-6">
            <div className="flex justify-between items-center font-black text-lg">
              <div className="flex items-center gap-3 text-slate-100">
                <img 
                  src={getFlagUrl(teamA)} 
                  alt={teamA} 
                  className="w-8 h-5.5 object-cover rounded-sm shadow-md border border-white/5"
                />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Home Win Odds</span>
                  <span className="text-xl font-extrabold text-amber-400">{teamA} ({homeProb.toFixed(1)}%)</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-slate-100 text-right">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Away Win Odds</span>
                  <span className="text-xl font-extrabold text-orange-400">({awayProb.toFixed(1)}%) {teamB}</span>
                </div>
                <img 
                  src={getFlagUrl(teamB)} 
                  alt={teamB} 
                  className="w-8 h-5.5 object-cover rounded-sm shadow-md border border-white/5"
                />
              </div>
            </div>

            {/* Advantage banner */}
            <div className="py-3 px-4 bg-slate-950/60 border border-slate-900 rounded-xl text-center shadow-inner">
              <span className="text-sm font-semibold text-slate-400">
                Simulation Advantage:{' '}
                <span className="text-amber-400 font-black bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  {advantageText}
                </span>
              </span>
            </div>

            {/* Split Progress bar with 50% marker */}
            <div className="relative w-full bg-slate-950 h-8 rounded-2xl overflow-hidden flex border border-slate-900 p-1">
              <motion.div 
                initial={{ width: '50%' }}
                animate={{ width: `${homeProb}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="bg-gradient-to-r from-amber-500/80 to-amber-500 h-full rounded-l-xl flex items-center justify-end pr-3.5 text-[10px] font-black text-dark-950"
              >
                {homeProb > 20 && `${homeProb.toFixed(1)}%`}
              </motion.div>
              
              <motion.div 
                initial={{ width: '50%' }}
                animate={{ width: `${awayProb}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="bg-gradient-to-r from-orange-500 to-orange-500/80 h-full rounded-r-xl flex items-center justify-start pl-3.5 text-[10px] font-black text-dark-950"
              >
                {awayProb > 20 && `${awayProb.toFixed(1)}%`}
              </motion.div>

              {/* 50% split line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-100/25 z-10 pointer-events-none" />
            </div>
          </div>

          <div className="flex justify-center pt-4 border-t border-slate-800/40">
            <button 
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending || polling}
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-dark-950 font-black rounded-xl shadow-lg shadow-amber-500/5 hover:scale-105 transition-all"
            >
              {(analyzeMutation.isPending || polling) ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-dark-950" />
                  <span>AI Agent Formulating Tactical Report...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-5 h-5 text-dark-950" />
                  <span>Generate AI Tactical Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* AI Analysis Markdown Output */}
      <AnimatePresence>
        {(aiReport || polling) && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="glass-card p-8 rounded-3xl space-y-6 border border-white/5 bg-slate-950/15"
          >
            <div className="flex items-center justify-between border-b border-slate-800/50 pb-3">
              <h3 className="text-md font-bold text-amber-400 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span>Explainable AI (XAI) Tactical Intelligence</span>
              </h3>
              {polling && (
                <span className="text-xs text-slate-500 italic animate-pulse">Running LLM reasoning loop...</span>
              )}
            </div>

            {polling && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <p className="text-slate-400 text-xs text-center leading-relaxed max-w-sm">
                  Evaluating relative Log-Odds, scanning live rosters, computing Elo difference thresholds, and structuring report...
                </p>
              </div>
            )}

            {aiReport && (
              <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans bg-slate-950/45 p-6 rounded-2xl border border-slate-900">
                {aiReport}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
