import React, { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Trophy, Activity, Flame, 
  TrendingUp, BarChart3, MonitorCheck, HelpCircle, 
  Sun, Moon, Sparkles, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useUIStore } from '../store/uiStore';

export const AppLayout: React.FC = () => {
  const { theme, setTheme, sidebarOpen, toggleSidebar, lastWsEvent, setLastWsEvent } = useUIStore();
  const location = useLocation();

  // Setup WebSocket connection for live events notifications
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//localhost:8000/api/v1/public/ws/live`;
    let ws: WebSocket;

    function connect() {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        if (event.data !== 'pong') {
          setLastWsEvent(event.data);
          setTimeout(() => {
            setLastWsEvent(null);
          }, 5000);
        }
      };
      ws.onopen = () => {
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 30000);
        ws.addEventListener('close', () => clearInterval(pingInterval));
      };
      ws.onclose = () => {
        setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      if (ws) ws.close();
    };
  }, [setLastWsEvent]);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Standings', path: '/standings', icon: Trophy },
    { name: 'Knockout Tree', path: '/simulation', icon: Activity },
    { name: 'Head-to-Head', path: '/head-to-head', icon: Flame },
    { name: 'Odds Timeline', path: '/timeline', icon: TrendingUp },
    { name: 'Model Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'System Status', path: '/system', icon: MonitorCheck },
    { name: 'About Engine', path: '/about', icon: HelpCircle },
  ];

  const isLanding = location.pathname === '/';

  if (isLanding) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-[#143d18]">
        <Outlet />
      </div>
    );
  }

  return (
    <div 
      className={`flex h-screen w-screen overflow-hidden font-sans relative ${theme === 'dark' ? 'bg-[#030712] text-slate-100' : 'bg-slate-50 text-slate-900'}`}
    >
      
      {/* Sidebar Navigation - Styled as a Premium Floating Dock */}
      <motion.aside 
        animate={{ width: sidebarOpen ? 260 : 80 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="glass-dock m-4 mr-0 rounded-3xl border border-white/5 transition-all flex flex-col z-20 overflow-hidden"
      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
          <Link to="/" className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
            {sidebarOpen && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-black text-lg bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent"
              >
                WORLD CUP AI
              </motion.span>
            )}
          </Link>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className="relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group"
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeNavBackground"
                    className="absolute inset-0 bg-gradient-to-r from-amber-500/90 to-orange-500 rounded-xl shadow-lg shadow-amber-500/10"
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
                
                <Icon className={`w-5 h-5 z-10 transition-transform duration-300 group-hover:scale-110 ${
                  isActive ? 'text-dark-950' : 'text-slate-400 group-hover:text-amber-400'
                }`} />
                
                {sidebarOpen && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`text-sm z-10 font-bold ${isActive ? 'text-dark-950 font-black' : 'text-slate-400 group-hover:text-slate-200'}`}
                  >
                    {item.name}
                  </motion.span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Floating dock footer action */}
        <div className="p-4 border-t border-white/5 flex justify-center">
          <button 
            onClick={toggleSidebar}
            className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-slate-200 transition-colors"
          >
            {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </motion.aside>

      {/* Main Content shell */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        
        {/* Topbar Navigation Header */}
        <header className="h-20 px-8 flex items-center justify-between bg-transparent backdrop-blur-sm z-10">
          <div className="flex items-center gap-4">
            <h1 className="font-black text-xl tracking-tight hidden md:block bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
              FIFA World Cup 2026 Predictive Control Center
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Websocket Notification Toast */}
            <AnimatePresence>
              {lastWsEvent && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-full text-xs font-semibold shadow-lg shadow-amber-500/5"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                  <span>{lastWsEvent}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dark/Light mode toggler */}
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 hover:bg-white/5 rounded-xl text-slate-400 hover:text-amber-400 transition-colors border border-white/5 bg-slate-950/20"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Connection Indicator */}
            <div className="flex items-center gap-2 border border-white/5 bg-slate-950/25 px-4 py-2 rounded-full text-xs font-bold text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/80 animate-pulse"></span>
              <span className="text-slate-400 hidden lg:inline">LIVE STATUS</span>
            </div>
          </div>
        </header>

        {/* Dynamic Outlet with slide-up transition page effects */}
        <main className="flex-1 overflow-y-auto px-8 pb-12 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
