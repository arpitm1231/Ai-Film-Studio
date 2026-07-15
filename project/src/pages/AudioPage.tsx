import { useState, useEffect, useRef } from 'react';
import { Music, Mic, Sparkles, Loader2, Play, Pause, Volume2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';

interface AudioAsset {
  id: string;
  scene_id: string | null;
  url: string;
  status: string;
  asset_type: string;
  metadata: Record<string, string>;
}

interface Scene {
  id: string;
  scene_number: number;
  location: string;
  time_of_day: string;
  mood: string;
  dialogue: { character: string; line: string }[];
}

interface AudioPageProps {
  projectId: string;
}

export default function AudioPage({ projectId }: AudioPageProps) {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [audioAssets, setAudioAssets] = useState<AudioAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingVoice, setGeneratingVoice] = useState(false);
  const [generatingMusic, setGeneratingMusic] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    loadData();
    return () => { if (audioRef.current) audioRef.current.pause(); };
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    const { data: sceneData } = await supabase
      .from('scenes')
      .select('id, scene_number, location, time_of_day, mood, dialogue')
      .eq('project_id', projectId)
      .order('scene_number');

    if (sceneData) setScenes(sceneData as Scene[]);

    const { data: assetData } = await supabase
      .from('assets')
      .select('*')
      .eq('project_id', projectId)
      .in('asset_type', ['voiceover', 'music']);

    if (assetData) setAudioAssets(assetData as AudioAsset[]);
    setLoading(false);
  };

  const generateVoiceovers = async () => {
    setGeneratingVoice(true);
    setError('');
    addToast('info', 'Generating voiceovers with AI...');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-voiceover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
          Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Voiceover generation failed'); }
      await loadData();
      addToast('success', 'Voiceovers generated!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate voiceovers';
      setError(msg);
      addToast('error', msg);
    } finally {
      setGeneratingVoice(false);
    }
  };

  const generateMusic = async () => {
    setGeneratingMusic(true);
    setError('');
    addToast('info', 'Composing background scores...');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-music`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
          Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Music generation failed'); }
      await loadData();
      addToast('success', 'Background scores composed!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate music';
      setError(msg);
      addToast('error', msg);
    } finally {
      setGeneratingMusic(false);
    }
  };

  const playAudio = (url: string, id: string) => {
    if (playingId === id) { audioRef.current?.pause(); setPlayingId(null); return; }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(url);
    audio.onended = () => setPlayingId(null);
    audio.play().catch(() => {});
    audioRef.current = audio;
    setPlayingId(id);
  };

  const voiceovers = audioAssets.filter((a) => a.asset_type === 'voiceover');
  const musicTracks = audioAssets.filter((a) => a.asset_type === 'music');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 animate-slide-up">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/10 flex items-center justify-center">
          <Music className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-xl font-bold text-white">Sound Stage</h2>
            <span className="scene-badge">04</span>
          </div>
          <p className="text-sm text-slate-400/70">Voiceovers and background scores</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 mb-4 animate-scale-in">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="cinema-card p-6 animate-shimmer" />
          ))}
        </div>
      )}

      {!loading && (
        <div className="space-y-6">
          {/* Voiceovers Section */}
          <div className="cinema-card p-6 animate-slide-up">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white">Voiceovers</h3>
                  <span className="text-[10px] bg-slate-800/50 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700/30">
                    {voiceovers.length} tracks
                  </span>
                </div>
                <button
                  onClick={generateVoiceovers}
                  disabled={generatingVoice || scenes.length === 0}
                  className="flex items-center gap-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 active:scale-[0.98] border border-cyan-500/10"
                >
                  {generatingVoice ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {generatingVoice ? 'Generating...' : 'Generate'}
                </button>
              </div>

              {voiceovers.length > 0 ? (
                <div className="space-y-2">
                  {voiceovers.map((asset, i) => (
                    <div
                      key={asset.id}
                      className={`flex items-center gap-3 bg-slate-800/20 rounded-xl px-4 py-3 hover:bg-slate-800/30 transition-colors border border-amber-500/[0.04] animate-slide-up stagger-${Math.min(i + 1, 6)}`}
                    >
                      <button
                        onClick={() => playAudio(asset.url, asset.id)}
                        className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/10 flex items-center justify-center hover:bg-cyan-500/20 transition-colors"
                      >
                        {playingId === asset.id ? <Pause className="w-3.5 h-3.5 text-cyan-400" /> : <Play className="w-3.5 h-3.5 text-cyan-400 ml-0.5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{asset.metadata?.character || `Scene ${asset.metadata?.scene_number || ''}`}</p>
                        <p className="text-xs text-slate-500 truncate">{asset.metadata?.line || 'Voiceover track'}</p>
                      </div>
                      <Volume2 className="w-4 h-4 text-slate-600" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Mic className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No voiceovers generated yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Music Section */}
          <div className="cinema-card p-6 animate-slide-up stagger-1">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-white">Background Score</h3>
                  <span className="text-[10px] bg-slate-800/50 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700/30">
                    {musicTracks.length} tracks
                  </span>
                </div>
                <button
                  onClick={generateMusic}
                  disabled={generatingMusic || scenes.length === 0}
                  className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 active:scale-[0.98] border border-amber-500/10"
                >
                  {generatingMusic ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {generatingMusic ? 'Generating...' : 'Generate'}
                </button>
              </div>

              {musicTracks.length > 0 ? (
                <div className="space-y-2">
                  {musicTracks.map((asset, i) => (
                    <div
                      key={asset.id}
                      className={`flex items-center gap-3 bg-slate-800/20 rounded-xl px-4 py-3 hover:bg-slate-800/30 transition-colors border border-amber-500/[0.04] animate-slide-up stagger-${Math.min(i + 1, 6)}`}
                    >
                      <button
                        onClick={() => playAudio(asset.url, asset.id)}
                        className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/10 flex items-center justify-center hover:bg-amber-500/20 transition-colors"
                      >
                        {playingId === asset.id ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-amber-400 ml-0.5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{asset.metadata?.mood || 'Background Score'}</p>
                        <p className="text-xs text-slate-500 truncate">{asset.metadata?.description || 'AI-generated music track'}</p>
                      </div>
                      <Volume2 className="w-4 h-4 text-slate-600" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Music className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No music tracks generated yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
