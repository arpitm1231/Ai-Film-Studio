import { useState, useEffect, useRef, useCallback } from 'react';
import { Image, Sparkles, Loader2, ZoomIn } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';

interface SceneAsset {
  id: string;
  scene_id: string;
  url: string;
  status: string;
  metadata: { prompt?: string; progress?: string };
}

interface Scene {
  id: string;
  scene_number: number;
  location: string;
  time_of_day: string;
  visual_description: string;
  mood: string;
}

interface VisualsPageProps {
  projectId: string;
}

export default function VisualsPage({ projectId }: VisualsPageProps) {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [assets, setAssets] = useState<Record<string, SceneAsset>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { addToast } = useToast();

  const loadAssets = useCallback(async () => {
    const { data: assetData } = await supabase
      .from('assets')
      .select('id, scene_id, url, status, metadata')
      .eq('project_id', projectId)
      .eq('asset_type', 'image');

    if (assetData) {
      const map: Record<string, SceneAsset> = {};
      assetData.forEach((a) => { map[a.scene_id] = a as SceneAsset; });
      setAssets(map);

      const generating = assetData.filter((a) => a.status === 'generating');
      if (generating.length > 0) {
        const completed = assetData.filter((a) => a.status === 'completed').length;
        setProgress(`${completed}/${assetData.length} complete`);
      }

      return assetData;
    }
    return [];
  }, [projectId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: sceneData } = await supabase
      .from('scenes')
      .select('id, scene_number, location, time_of_day, visual_description, mood')
      .eq('project_id', projectId)
      .order('scene_number');

    if (sceneData) setScenes(sceneData as Scene[]);
    await loadAssets();
    setLoading(false);
  }, [projectId, loadAssets]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!generating) {
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
      return;
    }

    pollingRef.current = setInterval(async () => {
      const assetData = await loadAssets();
      if (assetData) {
        const allDone = assetData.every((a) => a.status === 'completed' || a.status === 'failed');
        if (allDone) {
          setGenerating(false);
          setProgress('');
          if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
          const completed = assetData.filter((a) => a.status === 'completed').length;
          addToast('success', `${completed} scene visuals generated!`);
        }
      }
    }, 3000);

    return () => { if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; } };
  }, [generating, loadAssets, addToast]);

  const generateVisuals = async () => {
    setGenerating(true);
    setError('');
    setProgress('Starting generation...');
    addToast('info', 'Generating scene visuals with AI...');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-visuals`;

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
          Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ projectId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Generation failed');
      }

      await loadAssets();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate visuals';
      setError(msg);
      addToast('error', msg);
      setGenerating(false);
      setProgress('');
    }
  };

  const completedCount = Object.values(assets).filter((a) => a.status === 'completed').length;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/10 flex items-center justify-center">
            <Image className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-xl font-bold text-white">Visual Storyboard</h2>
              <span className="scene-badge">03</span>
            </div>
            <p className="text-sm text-slate-400/70">
              {scenes.length > 0
                ? `${completedCount}/${scenes.length} scenes visualized`
                : 'Generate scene visuals from your screenplay'}
            </p>
          </div>
        </div>
        {scenes.length > 0 && (
          <button
            onClick={generateVisuals}
            disabled={generating}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 active:scale-[0.98]"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{progress || 'Generating...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{completedCount > 0 ? 'Regenerate Visuals' : 'Generate Visuals'}</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Progress bar during generation */}
      {generating && scenes.length > 0 && (
        <div className="mb-4 animate-fade-in">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-slate-400 uppercase tracking-wider">Rendering frames...</span>
            <span className="text-[10px] text-amber-400 font-bold font-mono">{completedCount}/{scenes.length}</span>
          </div>
          <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/20">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${scenes.length > 0 ? (completedCount / scenes.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 mb-4 animate-scale-in">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="cinema-card overflow-hidden animate-shimmer">
              <div className="aspect-video bg-slate-800/40" />
              <div className="p-3 h-12" />
            </div>
          ))}
        </div>
      )}

      {!loading && scenes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenes.map((scene, i) => {
            const asset = assets[scene.id];
            const isGenerating = asset?.status === 'generating';

            return (
              <div
                key={scene.id}
                className={`cinema-card lens-flare overflow-hidden group hover:border-amber-500/15 transition-all duration-300 animate-slide-up stagger-${Math.min(i + 1, 6)}`}
              >
                {/* Image area - cinema frame */}
                <div className="aspect-video bg-slate-800/40 relative overflow-hidden">
                  {asset?.status === 'completed' && asset.url ? (
                    <>
                      <img
                        src={asset.url}
                        alt={`Scene ${scene.scene_number}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      {/* Cinema vignette overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.3)] pointer-events-none" />
                      <button
                        onClick={() => setSelectedImage(asset.url)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-[#020617]/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-[#020617]/80 border border-amber-500/10"
                      >
                        <ZoomIn className="w-4 h-4 text-white" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {isGenerating ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                          <span className="text-[10px] text-slate-500 font-mono">Rendering...</span>
                        </div>
                      ) : (
                        <Image className="w-8 h-8 text-slate-700" />
                      )}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="scene-badge">SC{String(scene.scene_number).padStart(2, '0')}</span>
                    <span className="text-[10px] bg-slate-800/50 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700/30">
                      {scene.mood}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 truncate">
                    {scene.location} - {scene.time_of_day}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {scene.visual_description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && scenes.length === 0 && (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <Image className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400 text-sm">No scenes available</p>
          <p className="text-slate-500 text-xs mt-1">Generate a screenplay first to create scene visuals</p>
        </div>
      )}

      {/* Lightbox - cinema screening room */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-8 animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          {/* Film strip borders */}
          <div className="absolute left-0 top-0 bottom-0 w-[28px] border-r border-amber-500/[0.06] z-10"
            style={{ background: `repeating-linear-gradient(180deg, transparent 0px, transparent 6px, rgba(245,158,11,0.04) 6px, rgba(245,158,11,0.04) 10px, transparent 10px, transparent 20px)` }}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[28px] border-l border-amber-500/[0.06] z-10"
            style={{ background: `repeating-linear-gradient(180deg, transparent 0px, transparent 6px, rgba(245,158,11,0.04) 6px, rgba(245,158,11,0.04) 10px, transparent 10px, transparent 20px)` }}
          />
          <img src={selectedImage} alt="Scene" className="max-w-full max-h-full rounded-lg shadow-2xl animate-scale-in" />
        </div>
      )}
    </div>
  );
}
