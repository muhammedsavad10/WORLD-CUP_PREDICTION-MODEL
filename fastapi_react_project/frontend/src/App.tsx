import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/AppLayout';
import { LandingPage } from './components/LandingPage';
import { AboutPage } from './components/AboutPage';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { StandingsPage } from './features/standings/pages/StandingsPage';
import { SimulationPage } from './features/simulation/pages/SimulationPage';
import { HeadToHeadPage } from './features/head_to_head/pages/HeadToHeadPage';
import { TimelinePage } from './features/timeline/pages/TimelinePage';
import { AnalyticsPage } from './features/analytics/pages/AnalyticsPage';
import { SystemPage } from './features/system/pages/SystemPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/standings" element={<StandingsPage />} />
            <Route path="/simulation" element={<SimulationPage />} />
            <Route path="/head-to-head" element={<HeadToHeadPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/system" element={<SystemPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
