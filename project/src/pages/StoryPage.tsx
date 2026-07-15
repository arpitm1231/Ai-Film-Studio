import { useState, useEffect } from 'react';
import { BookOpen, Sparkles, ArrowRight, Loader2, Lightbulb } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';

interface StoryPageProps {
  projectId: string | null;
  onProjectCreated: (id: string, title: string) => void;
}

export default function StoryPage({ projectId, onProjectCreated }: StoryPageProps) {
  const [title, setTitle] = useState('');
  const [storyIdea, setStoryIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    if (projectId) loadProject();
  }, [projectId]);

  const loadProject = async () => {
    const { data } = await supabase
      .from('projects')
      .select('title, story_idea')
      .eq('id', projectId)
      .maybeSingle();

    if (data) {
      setTitle(data.title || '');
      setStoryIdea(data.story_idea || '');
    }
  };

  const handleGenerate = async () => {
    if (!title.trim() || !storyIdea.trim()) return;
    setLoading(true);
    setError('');

    try {
      if (projectId) {
        const { error: updateError } = await supabase
          .from('projects')
          .update({ title, story_idea: storyIdea, status: 'story' })
          .eq('id', projectId);
        if (updateError) throw updateError;
        onProjectCreated(projectId, title);
        addToast('success', 'Story saved successfully');
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error: insertError } = await supabase
          .from('projects')
          .insert({ title, story_idea: storyIdea, status: 'story', user_id: user.id })
          .select()
          .single();

        if (insertError) throw insertError;
        onProjectCreated(data.id, data.title);
        addToast('success', 'Project created! Now generate your screenplay.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create project';
      setError(msg);
      addToast('error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-slide-up">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-xl font-bold text-white">Your Story</h2>
              <span className="scene-badge">01</span>
            </div>
            <p className="text-sm text-slate-400/70">Start with an idea, we'll build the film</p>
          </div>
        </div>
      </div>

      {/* Form - cinema slate style */}
      <div className="cinema-card lens-flare p-6 space-y-5 animate-slide-up stagger-1">
        <div className="relative z-10 space-y-5">
          <div>
            <label className="block text-[9px] font-medium text-amber-400/50 uppercase tracking-[0.25em] mb-2">Project Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Last Horizon"
              className="w-full bg-slate-800/50 border border-amber-500/[0.08] rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/30 focus:ring-1 focus:ring-amber-500/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-[9px] font-medium text-amber-400/50 uppercase tracking-[0.25em] mb-2">Story Idea</label>
            <textarea
              value={storyIdea}
              onChange={(e) => setStoryIdea(e.target.value)}
              placeholder="Describe your story concept in detail. The more vivid your description, the better the AI can craft your screenplay. Include genre, setting, main characters, and key plot points..."
              rows={8}
              className="w-full bg-slate-800/50 border border-amber-500/[0.08] rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/30 focus:ring-1 focus:ring-amber-500/10 transition-all resize-none"
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[10px] text-slate-500 font-mono">{storyIdea.length} chars</p>
              {storyIdea.length > 0 && storyIdea.length < 50 && (
                <p className="text-[10px] text-amber-500/50">Add more detail for better results</p>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 animate-scale-in">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || !title.trim() || !storyIdea.trim()}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Story...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Save & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tips - film strip style */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-slide-up stagger-2">
        {[
          { label: 'Genre', desc: 'Specify the genre for tone' },
          { label: 'Characters', desc: 'Name key characters' },
          { label: 'Setting', desc: 'Describe the world' },
        ].map((tip) => (
          <div key={tip.label} className="cinema-card p-4 hover:border-amber-500/15 transition-colors">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="w-3 h-3 text-amber-400/60" />
                <p className="text-xs font-semibold text-amber-400/70">{tip.label}</p>
              </div>
              <p className="text-[11px] text-slate-500">{tip.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
