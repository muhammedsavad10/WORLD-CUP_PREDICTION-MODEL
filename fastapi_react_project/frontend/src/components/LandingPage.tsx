import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const LandingPage: React.FC = () => {
  return (
    <div className="relative w-screen h-screen flex flex-col justify-center items-center overflow-hidden bg-[#143d18] select-none font-sans">
      
      {/* 1. Football Pitch Grass Stripes Background (Organic Greenery) */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: `repeating-linear-gradient(
            to right,
            #143d18,
            #143d18 6%,
            #18491d 6%,
            #18491d 12%
          )`
        }}
      />

      {/* Warm floodlight vignette covering the pitch */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/45 pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_0%,transparent_70%)] pointer-events-none z-0" />

      {/* 2. Headline Information - Clean & Interpretable */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center z-10 mb-8 space-y-3.5 max-w-2xl px-6"
      >
        <span className="text-[11px] text-amber-400 font-bold uppercase tracking-[0.25em] block drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
          [ TOURNAMENT FORECASTER ]
        </span>
        <h1 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tight drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
          WORLD CUP 2026
        </h1>
        <p className="text-sm sm:text-base text-slate-100 font-semibold max-w-lg mx-auto leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
          Explore match predictions, follow live group standings, and simulate the interactive tournament bracket.
        </p>
      </motion.div>

      {/* 3. Chalk-white pitch blueprint outline */}
      <div className="relative w-[85vw] h-[52vh] max-w-6xl max-h-[440px] border border-white/20 rounded-[100px] flex items-center justify-center z-10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] bg-black/5">
        
        {/* Secondary Seating Ring */}
        <div className="absolute inset-4 border border-white/10 rounded-[90px]" />
        
        {/* Tactical Pitch Lines Outline (Chalk White) */}
        <div className="absolute inset-12 border-2 border-white/40 rounded-lg flex items-center justify-center overflow-hidden bg-black/10">
          
          {/* Halfline */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/40" />
          
          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border-2 border-white/40 rounded-full" />
          
          {/* Penalty boxes */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-14 border-2 border-white/45 border-t-0 rounded-b" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-14 border-2 border-white/45 border-b-0 rounded-t" />

          {/* Penalty spots */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/70 rounded-full" />
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/70 rounded-full" />

          {/* Goal penalty arcs */}
          <div className="absolute top-14 left-1/2 -translate-x-1/2 w-16 h-6 border-2 border-white/35 border-t-0 rounded-b-full" />
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-16 h-6 border-2 border-white/35 border-b-0 rounded-t-full" />

          {/* Corner arcs */}
          <div className="absolute top-0 left-0 w-4 h-4 border-2 border-white/35 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute top-0 right-0 w-4 h-4 border-2 border-white/35 rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-2 border-white/35 rounded-full -translate-x-1/2 translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-2 border-white/35 rounded-full translate-x-1/2 translate-y-1/2" />

        </div>

        {/* 4. Centered Gateway Entry Button */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-3">
          <Link 
            to="/dashboard" 
            className="px-10 py-5 bg-white hover:bg-slate-100 text-emerald-950 font-sans font-black tracking-widest text-xs rounded-xl shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 whitespace-nowrap"
          >
            [ ENTER CONTROL CENTER ]
          </Link>
          <span className="text-[9px] text-white/60 font-bold tracking-widest drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            INTERACTIVE TOURNAMENT SIMULATOR
          </span>
        </div>

      </div>

    </div>
  );
};
