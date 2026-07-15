import { useState, useEffect } from 'react';
import { FileText, Sparkles, Loader2, ChevronDown, ChevronUp, User, Save, Pencil, Clapperboard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';

interface Scene {
  scene_number: number;
  location: string;
  time_of_day: string;
  description: string;
  visual_description: string;
  dialogue: { character: string; line: string }[];
  mood: string;
  duration_seconds: number;
}

interface Screenplay {
  id: string;
  title: string;
  genre: string;
  logline: string;
  characters: { name: string; description: string }[];
  raw_json: { scenes: Scene[] };
}

interface ScriptPageProps {
  projectId: string;
  onScriptGenerated: () => void;
}

export default function ScriptPage({ projectId, onScriptGenerated }: ScriptPageProps) {
  const [screenplay, setScreenplay] = useState<Screenplay | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [expandedScene, setExpandedScene] = useState<number | null>(null);
  const [editingScene, setEditingScene] = useState<number | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editVisual, setEditVisual] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    loadScreenplay();
  }, [projectId]);

  const loadScreenplay = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('screenplays')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) setScreenplay(data as Screenplay);
    setLoading(false);
  };

  const generateScript = async () => {
    setGenerating(true);
    setError('');
    addToast('info', 'Generating screenplay with AI...');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-screenplay`;

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

      const result = await res.json();
      setScreenplay(result.screenplay as Screenplay);
      onScriptGenerated();
      addToast('success', `Screenplay generated with ${result.sceneCount || ''} scenes!`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate screenplay';
      setError(msg);
      addToast('error', msg);
    } finally {
      setGenerating(false);
    }
  };

  const startEditing = (sceneIndex: number) => {
    const scene = scenes[sceneIndex];
    if (!scene) return;
    setEditingScene(sceneIndex);
    setEditDescription(scene.description);
    setEditVisual(scene.visual_description);
  };

  const saveSceneEdit = async () => {
    if (editingScene === null || !screenplay) return;
    setSaving(true);

    try {
      const scene = scenes[editingScene];
      const { data: dbScenes } = await supabase
        .from('scenes')
        .select('id')
        .eq('project_id', projectId)
        .eq('scene_number', scene.scene_number)
        .limit(1);

      if (dbScenes && dbScenes.length > 0) {
        await supabase
          .from('scenes')
          .update({ description: editDescription, visual_description: editVisual })
          .eq('id', dbScenes[0].id);
      }

      const updatedScreenplay = { ...screenplay };
      const updatedScenes = [...updatedScreenplay.raw_json.scenes];
      updatedScenes[editingScene] = { ...updatedScenes[editingScene], description: editDescription, visual_description: editVisual };
      updatedScreenplay.raw_json = { ...updatedScreenplay.raw_json, scenes: updatedScenes };
      setScreenplay(updatedScreenplay);
      setEditingScene(null);
      addToast('success', `Scene ${scene.scene_number} updated`);
    } catch {
      addToast('error', 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const scenes = screenplay?.raw_json?.scenes || [];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-xl font-bold text-white">Screenplay</h2>
              <span className="scene-badge">02</span>
            </div>
            <p className="text-sm text-slate-400/70">AI-generated script from your story</p>
          </div>
        </div>
        <button
          onClick={generateScript}
          disabled={generating}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 active:scale-[0.98]"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{screenplay ? 'Regenerate' : 'Generate Script'}</span>
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
          {[1, 2, 3].map((i) => (
            <div key={i} className="cinema-card p-4 animate-shimmer" />
          ))}
        </div>
      )}

      {!loading && screenplay && (
        <div className="space-y-4 animate-fade-in">
          {/* Logline card */}
          <div className="cinema-card lens-flare p-6 animate-slide-up">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Clapperboard className="w-3.5 h-3.5 text-amber-400/60" />
                <span className="text-[9px] font-semibold text-amber-400/60 uppercase tracking-[0.25em]">Logline</span>
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20">{screenplay.genre}</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{screenplay.logline}</p>
            </div>
          </div>

          {/* Characters */}
          {screenplay.characters?.length > 0 && (
            <div className="cinema-card p-6 animate-slide-up stagger-1">
              <div className="relative z-10">
                <h3 className="text-[9px] font-semibold text-amber-400/60 uppercase tracking-[0.25em] mb-3">Cast</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {screenplay.characters.map((char, i) => (
                    <div key={i} className="flex items-start gap-3 bg-slate-800/20 rounded-xl p-3 hover:bg-slate-800/30 transition-colors border border-amber-500/[0.04]">
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{char.name}</p>
                        <p className="text-xs text-slate-400">{char.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Scenes - film strip style */}
          <div className="space-y-2 animate-slide-up stagger-2">
            <div className="flex items-center gap-2 px-1">
              <div className="h-px w-6 bg-gradient-to-r from-amber-500/40 to-transparent" />
              <h3 className="text-[9px] font-semibold text-amber-400/60 uppercase tracking-[0.25em]">
                Scenes ({scenes.length})
              </h3>
            </div>
            {scenes.map((scene, i) => (
              <div
                key={i}
                className="cinema-card overflow-hidden hover:border-amber-500/15 transition-colors"
              >
                <button
                  onClick={() => setExpandedScene(expandedScene === i ? null : i)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-800/20 transition-colors"
                >
                  <span className="scene-badge">SC{String(scene.scene_number).padStart(2, '0')}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {scene.location} - {scene.time_of_day}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{scene.description}</p>
                  </div>
                  <span className="text-[10px] bg-slate-800/50 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700/30 hidden sm:inline-block">
                    {scene.mood}
                  </span>
                  {expandedScene === i ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                {expandedScene === i && (
                  <div className="px-4 pb-4 space-y-3 border-t border-amber-500/[0.06] animate-fade-in">
                    {editingScene === i ? (
                      <div className="pt-3 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1.5">Scene Description</label>
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            rows={3}
                            className="w-full bg-slate-800/50 border border-amber-500/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/30 focus:ring-1 focus:ring-amber-500/10 transition-all resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1.5">Visual Description</label>
                          <textarea
                            value={editVisual}
                            onChange={(e) => setEditVisual(e.target.value)}
                            rows={4}
                            className="w-full bg-slate-800/50 border border-amber-500/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/30 focus:ring-1 focus:ring-amber-500/10 transition-all resize-none"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditingScene(null)}
                            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={saveSceneEdit}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 rounded-lg hover:from-amber-400 hover:to-amber-500 transition-colors disabled:opacity-50"
                          >
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="pt-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[9px] font-semibold text-amber-400/50 uppercase tracking-[0.2em]">Visual Direction</p>
                            <button
                              onClick={() => startEditing(i)}
                              className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-amber-400 transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                              Edit
                            </button>
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed">{scene.visual_description}</p>
                        </div>
                        {scene.dialogue?.length > 0 && (
                          <div>
                            <p className="text-[9px] font-semibold text-amber-400/50 uppercase tracking-[0.2em] mb-2">Dialogue</p>
                            <div className="space-y-2">
                              {scene.dialogue.map((d, j) => (
                                <div key={j} className="flex gap-3 bg-slate-800/20 rounded-lg p-2 border border-amber-500/[0.03]">
                                  <span className="text-xs font-bold text-cyan-400 min-w-[80px] text-right pt-0.5">
                                    {d.character}:
                                  </span>
                                  <span className="text-sm text-slate-300 italic">"{d.line}"</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex gap-4 text-xs text-slate-500">
                          <span className="font-mono">Duration: {scene.duration_seconds}s</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !screenplay && !generating && (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400 text-sm">No screenplay generated yet</p>
          <p className="text-slate-500 text-xs mt-1">Click "Generate Script" to create one from your story</p>
        </div>
      )}
    </div>
  );
}
