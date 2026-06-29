import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle } from 'lucide-react';

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

import { apiFetch, API_BASE_URL } from '../../../lib/api';

export const StandingsPage: React.FC = () => {
  const standingsQuery = useQuery({
    queryKey: ['standings'],
    queryFn: async ({ signal }) => {
      const res = await apiFetch('/api/v1/public/matches/standings', { signal });
      return res.json();
    }
  });

  const isLoading = standingsQuery.isLoading;
  const isError = standingsQuery.isError;

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <span className="text-slate-400 text-sm font-semibold">Calculating group standings and tiebreakers...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h3 className="text-lg font-bold text-slate-200">Error calculating standings</h3>
        <p className="text-slate-400 text-sm">Please verify the FastAPI backend is running on {API_BASE_URL}.</p>
      </div>
    );
  }

  const standings = standingsQuery.data?.data || {};
  const groups = Object.keys(standings).sort();

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
          Group Standings
        </h2>
        <p className="text-slate-400 text-sm mt-1">Official points tables for the 12 groups, sorted by tiebreaker rules.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((groupLetter) => {
          const groupTeams = standings[groupLetter] || [];
          return (
            <div key={groupLetter} className="glass-card p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-lg font-bold text-amber-400">Group {groupLetter}</h3>
                <span className="text-xs text-slate-500 font-medium">Group Stage</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="text-slate-500 font-bold border-b border-slate-800/50">
                      <th className="py-2 w-8">#</th>
                      <th className="py-2">Team</th>
                      <th className="py-2 text-center w-8">PL</th>
                      <th className="py-2 text-center w-12">W-D-L</th>
                      <th className="py-2 text-center w-8">GD</th>
                      <th className="py-2 text-right w-10">PTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupTeams.map((team: any, idx: number) => {
                      const isTopTwo = idx < 2;
                      return (
                        <tr key={team.team} className="border-b border-slate-800/10 hover:bg-slate-800/10 transition-colors">
                          <td className={`py-3 font-semibold ${isTopTwo ? 'text-amber-500' : 'text-slate-400'}`}>
                            {idx + 1}
                          </td>
                          <td className="py-3 font-bold text-slate-200 flex items-center gap-1.5 truncate max-w-[120px]">
                            <img 
                              src={getFlagUrl(team.team)} 
                              alt={team.team} 
                              className="w-5 h-3.5 object-cover rounded-sm shadow-sm border border-white/5"
                            />
                            <span className="truncate">{team.team}</span>
                          </td>
                          <td className="py-3 text-center text-slate-300">{team.matches_played}</td>
                          <td className="py-3 text-center text-slate-400 font-mono">
                            {team.wins}-{team.draws}-{team.losses}
                          </td>
                          <td className={`py-3 text-center font-bold ${team.goal_difference > 0 ? 'text-emerald-400' : team.goal_difference < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                            {team.goal_difference > 0 ? `+${team.goal_difference}` : team.goal_difference}
                          </td>
                          <td className="py-3 text-right font-extrabold text-slate-100">{team.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
