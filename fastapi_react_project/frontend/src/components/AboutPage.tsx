import { Cpu, BookOpen, Compass } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
          About the Prediction Engine
        </h1>
        <p className="text-slate-400 leading-relaxed">
          The FIFA World Cup 2026 Prediction Engine is a high-fidelity sports forecasting system combining machine learning classification, log-odds dynamic calibration, and Monte Carlo bracket walks.
        </p>
      </div>

      {/* Model Section */}
      <section className="glass-card p-8 rounded-2xl space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <Cpu className="w-6 h-6 text-amber-500" />
          <h2 className="text-2xl font-bold">1. Machine Learning Classifier</h2>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed">
          Match outcomes are modeled using a calibrated Logistic Regression classifier. The model operates on normalized matchday feature vectors:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-300">
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
            <span className="text-amber-400 block mb-1">Rank Metrics:</span>
            • Home team FIFA rank<br />
            • Away team FIFA rank<br />
            • FIFA rank difference (home - away)
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
            <span className="text-amber-400 block mb-1">Performance Metrics (log1p scaled):</span>
            • Weighted wins history<br />
            • Weighted goals scored<br />
            • Form factors coefficients
          </div>
        </div>
      </section>

      {/* Dynamic Calibration */}
      <section className="glass-card p-8 rounded-2xl space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <BookOpen className="w-6 h-6 text-amber-500" />
          <h2 className="text-2xl font-bold">2. Log-Odds Dynamic Calibration</h2>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed">
          To capture tournament momentum and prevent static predictions from becoming stale, win probabilities are adjusted dynamically using log-odds (logit) scaling:
        </p>
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl space-y-3 font-mono text-xs text-slate-300 leading-relaxed">
          <p>
            logit_base = log(p_base / (1.0 - p_base))
          </p>
          <p>
            logit_adj = gamma * (form_factor_home - form_factor_away)
          </p>
          <p>
            p_adjusted = 1.0 / (1.0 + exp(-(logit_base + logit_adj)))
          </p>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed">
          We configure a decay scalar <code className="text-amber-400">gamma = 0.15</code> and apply a win probability shift threshold cap of <code className="text-amber-400">0.12</code> to balance baseline strength against current form.
        </p>
      </section>

      {/* Monte Carlo Section */}
      <section className="glass-card p-8 rounded-2xl space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <Compass className="w-6 h-6 text-amber-500" />
          <h2 className="text-2xl font-bold">3. Monte Carlo Simulations</h2>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed">
          The tournament simulator executes 10,000 randomized iterations of the World Cup:
        </p>
        <ul className="list-disc list-inside text-sm text-slate-400 space-y-2 pl-4">
          <li><strong>Group Stage</strong>: Re-simulates all remaining round-robin matches using probabilistic outcome generation.</li>
          <li><strong>Group Tiebreakers</strong>: Resolves group rank using points, goal difference, goals scored, and expected simulation results.</li>
          <li><strong>Annex C Mapping</strong>: Simulates the 12 third-place candidates, ranking them and resolving bracket allocations according to official FIFA regulations.</li>
          <li><strong>Single-Elimination Knockouts</strong>: Walks the bracket nodes (Round of 32 to Final) to determine the champion.</li>
        </ul>
      </section>
    </div>
  );
};
