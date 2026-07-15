import { useState, useEffect } from 'react';
import { Plus, Film, Trash2, ArrowRight, Sparkles, Clapperboard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

interface Project {
  id: string;
  title: string;
  story_idea: string;
  status: string;
  created_at: string;
}

interface ProjectsPageProps {
  onSelectProject: (id: string, title: string, status?: string) => void;
}

export default function ProjectsPage({ onSelectProject }: ProjectsPageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const { user } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user?.id)
      .order('updated_at', { ascending: false });

    if (data) setProjects(data as Project[]);
    setLoading(false);
  };

  const createProject = async () => {
    if (!newTitle.trim()) return;
    const { data, error } = await supabase
      .from('projects')
      .insert({ title: newTitle, story_idea: '', status: 'story', user_id: user?.id })
      .select()
      .single();

    if (!error && data) {
      setProjects([data as Project, ...projects]);
      setShowNew(false);
      setNewTitle('');
      onSelectProject(data.id, data.title, 'story');
      addToast('success', 'Project created! Start by writing your story.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('projects').delete().eq('id', deleteTarget.id);
    setProjects(projects.filter((p) => p.id !== deleteTarget.id));
    addToast('info', `"${deleteTarget.title}" deleted`);
    setDeleteTarget(null);
  };

  const statusLabels: Record<string, string> = {
    story: 'Story',
    script: 'Script',
    visuals: 'Visuals',
    audio: 'Audio',
    trailer: 'Trailer',
    analytics: 'Analytics',
  };

  const statusColors: Record<string, string> = {
    story: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    script: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    visuals: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    audio: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    trailer: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    analytics: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  };

  const statusFrames: Record<string, string> = {
    story: '01',
    script: '02',
    visuals: '03',
    audio: '04',
    trailer: '05',
    analytics: '06',
  };

  const statusProgress: Record<string, number> = {
    story: 16,
    script: 33,
    visuals: 50,
    audio: 66,
    trailer: 83,
    analytics: 100,
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 animate-slide-up">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-px w-6 bg-gradient-to-r from-amber-500/40 to-transparent" />
            <span className="text-[9px] uppercase tracking-[0.3em] text-amber-400/40 font-medium">Your Reels</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Your Projects</h2>
          <p className="text-sm text-slate-400/70 mt-0.5">Select a project or create a new one</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* New project form */}
      {showNew && (
        <div className="cinema-card lens-flare p-6 mb-6 animate-scale-in">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Clapperboard className="w-4 h-4 text-amber-400/60" />
              <h3 className="text-sm font-semibold text-white">New Production</h3>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter project title..."
                className="flex-1 bg-slate-800/50 border border-amber-500/[0.08] rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/30 focus:ring-1 focus:ring-amber-500/10 transition-all"
                onKeyDown={(e) => e.key === 'Enter' && createProject()}
                autoFocus
              />
              <button
                onClick={createProject}
                disabled={!newTitle.trim()}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-semibold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-40"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="cinema-card p-5 animate-shimmer" />
          ))}
        </div>
      )}

      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projects.map((project, i) => (
            <div
              key={project.id}
              className={`cinema-card lens-flare p-5 group hover:border-amber-500/15 transition-all duration-300 cursor-pointer animate-slide-up stagger-${Math.min(i + 1, 6)}`}
              onClick={() => onSelectProject(project.id, project.title, project.status)}
            >
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/15 group-hover:border-amber-500/20 transition-all">
                    <Film className="w-5 h-5 text-amber-400" />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(project);
                    }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1 truncate group-hover:text-amber-400 transition-colors">{project.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                  {project.story_idea || 'No story added yet'}
                </p>

                {/* Progress bar - film counter style */}
                <div className="mb-2">
                  <div className="h-1 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/20">
                    <div
                      className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${statusProgress[project.status] || 16}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="scene-badge">{statusFrames[project.status] || '01'}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColors[project.status] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                      {statusLabels[project.status] || project.status}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-all group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && projects.length === 0 && !showNew && (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/10 flex items-center justify-center mx-auto mb-6 animate-glow">
            <Sparkles className="w-10 h-10 text-amber-400/40" />
          </div>
          <p className="text-slate-300 text-lg font-medium">Begin your first production</p>
          <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
            Create a project and watch AI transform your story idea into a complete cinematic experience
          </p>
          <button
            onClick={() => setShowNew(true)}
            className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Project</span>
          </button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Project"
        message={`This will permanently delete "${deleteTarget?.title}" and all its screenplay, scenes, assets, and analytics data. This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
