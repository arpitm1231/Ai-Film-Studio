import { useState, useEffect } from 'react';
import { BarChart3, Sparkles, Loader2, DollarSign, Calendar, MapPin, TrendingUp, Users, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';

interface Production {
  id: string;
  budget_estimate: {
    total: number;
    categories: { name: string; amount: number }[];
  };
  schedule: {
    days: { day: number; activity: string; location: string }[];
  };
  locations: { name: string; type: string; country: string }[];
  success_prediction: {
    audience_score: number;
    market_fit: string;
    demographics: string[];
    comparable_films: string[];
  };
  sentiment_score: number;
  market_reach: string;
}

interface AnalyticsPageProps {
  projectId: string;
}

export default function AnalyticsPage({ projectId }: AnalyticsPageProps) {
  const [production, setProduction] = useState<Production | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    loadProduction();
  }, [projectId]);

  const loadProduction = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('productions')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (data) setProduction(data as Production);
    setLoading(false);
  };

  const generateAnalytics = async () => {
    setGenerating(true);
    setError('');
    addToast('info', 'Analyzing production requirements...');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
          Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Analytics generation failed'); }
      await loadProduction();
      addToast('success', 'Production analysis complete!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate analytics';
      setError(msg);
      addToast('error', msg);
    } finally {
      setGenerating(false);
    }
  };

  const sentimentColor = production
    ? production.sentiment_score >= 70
      ? 'text-emerald-400'
      : production.sentiment_score >= 40
        ? 'text-amber-400'
        : 'text-red-400'
    : '';

  const sentimentBorder = production
    ? production.sentiment_score >= 70
      ? 'border-emerald-500/15'
      : production.sentiment_score >= 40
        ? 'border-amber-500/15'
        : 'border-red-500/15'
    : '';

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-xl font-bold text-white">Production & Analytics</h2>
              <span className="scene-badge">06</span>
            </div>
            <p className="text-sm text-slate-400/70">Budget, schedule, and success prediction</p>
          </div>
        </div>
        <button
          onClick={generateAnalytics}
          disabled={generating}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 active:scale-[0.98]"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{production ? 'Re-analyze' : 'Generate Analysis'}</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 mb-4 animate-scale-in">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="cinema-card p-5 h-32 animate-shimmer" />
            ))}
          </div>
          <div className="cinema-card p-6 h-48 animate-shimmer" />
        </div>
      )}

      {!loading && production && (
        <div className="space-y-4 animate-fade-in">
          {/* Top stats - cinema marquee cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Sentiment Score */}
            <div className={`cinema-card lens-flare p-5 animate-slide-up ${sentimentBorder}`}>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-slate-400" />
                  <span className="text-[9px] font-medium text-slate-400 uppercase tracking-[0.2em]">Success Score</span>
                </div>
                <p className={`text-4xl font-bold font-mono ${sentimentColor}`}>
                  {production.sentiment_score}
                  <span className="text-lg">%</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">{production.market_reach}</p>
              </div>
            </div>

            {/* Budget */}
            <div className="cinema-card lens-flare p-5 animate-slide-up stagger-1">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <span className="text-[9px] font-medium text-slate-400 uppercase tracking-[0.2em]">Est. Budget</span>
                </div>
                <p className="text-4xl font-bold text-white font-mono">
                  ${(production.budget_estimate?.total || 0).toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 mt-1">{production.budget_estimate?.categories?.length || 0} categories</p>
              </div>
            </div>

            {/* Schedule */}
            <div className="cinema-card lens-flare p-5 animate-slide-up stagger-2">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-[9px] font-medium text-slate-400 uppercase tracking-[0.2em]">Schedule</span>
                </div>
                <p className="text-4xl font-bold text-white font-mono">
                  {production.schedule?.days?.length || 0}
                  <span className="text-lg text-slate-400"> days</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">Production timeline</p>
              </div>
            </div>
          </div>

          {/* Budget Breakdown */}
          {production.budget_estimate?.categories?.length > 0 && (
            <div className="cinema-card p-6 animate-slide-up stagger-3">
              <div className="relative z-10">
                <h3 className="text-sm font-semibold text-white mb-4">Budget Breakdown</h3>
                <div className="space-y-3">
                  {production.budget_estimate.categories.map((cat, i) => {
                    const pct = production.budget_estimate.total > 0
                      ? Math.round((cat.amount / production.budget_estimate.total) * 100)
                      : 0;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-300">{cat.name}</span>
                          <span className="text-xs text-slate-400 font-mono">${cat.amount.toLocaleString()} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/20">
                          <div
                            className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Schedule & Locations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Schedule */}
            {production.schedule?.days?.length > 0 && (
              <div className="cinema-card p-6 animate-slide-up stagger-4">
                <div className="relative z-10">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    Production Schedule
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {production.schedule.days.slice(0, 10).map((day, i) => (
                      <div key={i} className="flex items-start gap-3 bg-slate-800/20 rounded-lg p-2.5 hover:bg-slate-800/30 transition-colors border border-amber-500/[0.03]">
                        <span className="scene-badge text-[9px]">D{day.day}</span>
                        <div>
                          <p className="text-xs text-white">{day.activity}</p>
                          <p className="text-[10px] text-slate-500">{day.location}</p>
                        </div>
                      </div>
                    ))}
                    {production.schedule.days.length > 10 && (
                      <p className="text-xs text-slate-500 text-center py-1">
                        +{production.schedule.days.length - 10} more days
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Locations */}
            {production.locations?.length > 0 && (
              <div className="cinema-card p-6 animate-slide-up stagger-5">
                <div className="relative z-10">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    Filming Locations
                  </h3>
                  <div className="space-y-2">
                    {production.locations.map((loc, i) => (
                      <div key={i} className="flex items-center gap-3 bg-slate-800/20 rounded-lg p-2.5 hover:bg-slate-800/30 transition-colors border border-amber-500/[0.03]">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/10 flex items-center justify-center flex-shrink-0">
                          <Globe className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-xs text-white">{loc.name}</p>
                          <p className="text-[10px] text-slate-500">{loc.type} - {loc.country}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Success Prediction */}
          {production.success_prediction && (
            <div className="cinema-card p-6 animate-slide-up stagger-6">
              <div className="relative z-10">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  Audience Success Prediction
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] mb-2">Target Demographics</p>
                    <div className="flex flex-wrap gap-1.5">
                      {production.success_prediction.demographics?.map((d, i) => (
                        <span key={i} className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] mb-2">Comparable Films</p>
                    <div className="flex flex-wrap gap-1.5">
                      {production.success_prediction.comparable_films?.map((f, i) => (
                        <span key={i} className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {production.success_prediction.market_fit && (
                  <div className="mt-4 bg-slate-800/20 rounded-lg p-3 border border-amber-500/[0.04]">
                    <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] mb-1">Market Fit Analysis</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{production.success_prediction.market_fit}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && !production && (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400 text-sm">No analytics generated yet</p>
          <p className="text-slate-500 text-xs mt-1">Generate a screenplay first, then analyze production requirements</p>
        </div>
      )}
    </div>
  );
}
