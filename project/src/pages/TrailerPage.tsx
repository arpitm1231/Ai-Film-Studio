import { useState, useEffect } from 'react';
import { Video, Sparkles, Loader2, Play, X, Film, Monitor } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';

interface TrailerAsset {
  id: string;
  url: string;
  status: string;
  metadata: Record<string, string>;
}

interface TrailerPageProps {
  projectId: string;
}

export default function TrailerPage({ projectId }: TrailerPageProps) {
  const [trailer, setTrailer] = useState<TrailerAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    loadTrailer();
  }, [projectId]);

  const loadTrailer = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('assets')
      .select('*')
      .eq('project_id', projectId)
      .eq('asset_type', 'trailer')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) setTrailer(data as TrailerAsset);
    setLoading(false);
  };

  const generateTrailer = async () => {
    setGenerating(true);
    setError('');
    addToast('info', 'Composing your trailer... This may take a moment.');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-trailer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
          Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Trailer generation failed'); }
      await loadTrailer();
      addToast('success', 'Trailer composed successfully!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate trailer';
      setError(msg);
      addToast('error', msg);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/10 flex items-center justify-center">
            <Video className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-xl font-bold text-white">Trailer Composer</h2>
              <span className="scene-badge">05</span>
            </div>
            <p className="text-sm text-slate-400/70">Stitch scenes, audio, and effects into a final trailer</p>
          </div>
        </div>
        <button
          onClick={generateTrailer}
          disabled={generating}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 active:scale-[0.98]"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Composing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{trailer ? 'Recompose Trailer' : 'Compose Trailer'}</span>
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
        <div className="cinema-card overflow-hidden animate-shimmer">
          <div className="aspect-video bg-slate-800/40" />
          <div className="p-4 h-16" />
        </div>
      )}

      {!loading && trailer && trailer.status === 'completed' && (
        <div className="space-y-4 animate-fade-in">
          {/* Preview card - cinema screening room */}
          <div
            className="cinema-card lens-flare overflow-hidden cursor-pointer group hover:border-amber-500/15 transition-all duration-300"
            onClick={() => setShowPlayer(true)}
          >
            <div className="aspect-video bg-slate-800/40 flex items-center justify-center relative">
              <video src={trailer.url} className="w-full h-full object-cover" muted />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/30 transition-colors">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-amber-500/20 border border-amber-500/20">
                  <Play className="w-7 h-7 text-amber-400 ml-1" />
                </div>
              </div>
              {/* Cinema top bar */}
              <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-center">
                <span className="text-[9px] text-amber-400/60 tracking-[0.3em] uppercase font-medium">Preview Trailer</span>
              </div>
              {/* Film strip borders */}
              <div className="absolute left-0 top-0 bottom-0 w-[20px] border-r border-amber-500/[0.06]"
                style={{ background: `repeating-linear-gradient(180deg, transparent 0px, transparent 6px, rgba(245,158,11,0.04) 6px, rgba(245,158,11,0.04) 10px, transparent 10px, transparent 20px)` }}
              />
              <div className="absolute right-0 top-0 bottom-0 w-[20px] border-l border-amber-500/[0.06]"
                style={{ background: `repeating-linear-gradient(180deg, transparent 0px, transparent 6px, rgba(245,158,11,0.04) 6px, rgba(245,158,11,0.04) 10px, transparent 10px, transparent 20px)` }}
              />
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-white">Final Trailer</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Click to play the full trailer</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 animate-slide-up stagger-1">
            {[
              { label: 'Format', value: 'MP4', icon: Film },
              { label: 'Resolution', value: '1920x1080', icon: Monitor },
              { label: 'Status', value: 'Ready', icon: Video },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="cinema-card p-3 text-center hover:border-amber-500/15 transition-colors">
                  <div className="relative z-10">
                    <Icon className="w-4 h-4 text-slate-500 mx-auto mb-1" />
                    <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em]">{stat.label}</p>
                    <p className="text-sm font-medium text-white mt-1 font-mono">{stat.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && trailer && trailer.status === 'generating' && (
        <div className="cinema-card p-12 text-center animate-fade-in">
          <div className="relative z-10">
            <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto mb-4" />
            <p className="text-white font-medium">Composing your trailer...</p>
            <p className="text-xs text-slate-400 mt-1">This may take a few minutes</p>
          </div>
        </div>
      )}

      {!loading && (!trailer || trailer.status === 'pending') && (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400 text-sm">No trailer composed yet</p>
          <p className="text-slate-500 text-xs mt-1">Generate visuals and audio first, then compose your trailer</p>
        </div>
      )}

      {/* Full-screen player - cinema screening */}
      {showPlayer && trailer && (
        <div className="fixed inset-0 bg-black/98 z-50 flex items-center justify-center animate-fade-in">
          {/* Film strip borders */}
          <div className="absolute left-0 top-0 bottom-0 w-[28px] border-r border-amber-500/[0.06] z-10"
            style={{ background: `repeating-linear-gradient(180deg, transparent 0px, transparent 6px, rgba(245,158,11,0.04) 6px, rgba(245,158,11,0.04) 10px, transparent 10px, transparent 20px)` }}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[28px] border-l border-amber-500/[0.06] z-10"
            style={{ background: `repeating-linear-gradient(180deg, transparent 0px, transparent 6px, rgba(245,158,11,0.04) 6px, rgba(245,158,11,0.04) 10px, transparent 10px, transparent 20px)` }}
          />
          <button
            onClick={() => setShowPlayer(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-20 border border-amber-500/10"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <video
            src={trailer.url}
            controls
            autoPlay
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl animate-scale-in"
          />
        </div>
      )}
    </div>
  );
}
