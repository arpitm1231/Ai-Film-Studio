import { useState, useEffect } from 'react';
import {
  Film,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
  BookOpen,
  FileText,
  Image,
  Music,
  Video,
  BarChart3,
  Plus,
  Zap,
  Clapperboard,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface Project {
  id: string;
  title: string;
  status: string;
  updated_at: string;
  story_idea: string;
}

interface DashboardPageProps {
  onNavigate: (stage: string) => void;
  onSelectProject: (id: string, title: string, status?: string) => void;
}

export default function DashboardPage({ onNavigate, onSelectProject }: DashboardPageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('projects')
      .select('id, title, status, updated_at, story_idea')
      .eq('user_id', user?.id)
      .order('updated_at', { ascending: false })
      .limit(5);

    if (data) setProjects(data as Project[]);
    setLoading(false);
  };

  const statusLabels: Record<string, { label: string; color: string; icon: typeof BookOpen; frame: string }> = {
    story: { label: 'Story', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: BookOpen, frame: '01' },
    script: { label: 'Script', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', icon: FileText, frame: '02' },
    visuals: { label: 'Visuals', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: Image, frame: '03' },
    audio: { label: 'Audio', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: Music, frame: '04' },
    trailer: { label: 'Trailer', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', icon: Video, frame: '05' },
    analytics: { label: 'Analytics', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: BarChart3, frame: '06' },
  };

  const pipelineSteps = [
    { id: 'story', label: 'Story', icon: BookOpen, desc: 'Write your concept', frame: '01' },
    { id: 'script', label: 'Script', icon: FileText, desc: 'AI screenplay', frame: '02' },
    { id: 'visuals', label: 'Visuals', icon: Image, desc: 'Scene images', frame: '03' },
    { id: 'audio', label: 'Audio', icon: Music, desc: 'Voice & music', frame: '04' },
    { id: 'trailer', label: 'Trailer', icon: Video, desc: 'Compose video', frame: '05' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, desc: 'Production data', frame: '06' },
  ];

  const totalProjects = projects.length;
  const completedProjects = projects.filter((p) => p.status === 'analytics').length;
  const inProgressProjects = totalProjects - completedProjects;

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Welcome header - cinema marquee */}
      <div className="animate-slide-up">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-px w-6 bg-gradient-to-r from-amber-500/40 to-transparent" />
          <span className="text-[9px] uppercase tracking-[0.3em] text-amber-400/40 font-medium">Now Showing</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Welcome back
        </h1>
        <p className="text-slate-400/70 text-sm mt-1">Your production overview</p>
      </div>

      {/* Stats cards - film canister style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Projects', value: totalProjects, icon: Film, accent: 'amber' },
          { label: 'In Progress', value: inProgressProjects, icon: TrendingUp, accent: 'cyan' },
          { label: 'Completed', value: completedProjects, icon: Sparkles, accent: 'emerald' },
          { label: 'Quick Create', value: '+', icon: Plus, accent: 'amber', action: true },
        ].map((stat, i) => {
          const Icon = stat.icon;
          const borderColors: Record<string, string> = {
            amber: 'border-amber-500/10 hover:border-amber-500/20',
            cyan: 'border-cyan-500/10 hover:border-cyan-500/20',
            emerald: 'border-emerald-500/10 hover:border-emerald-500/20',
          };
          const iconColors: Record<string, string> = {
            amber: 'text-amber-400',
            cyan: 'text-cyan-400',
            emerald: 'text-emerald-400',
          };
          const glowColors: Record<string, string> = {
            amber: 'shadow-amber-500/5',
            cyan: 'shadow-cyan-500/5',
            emerald: 'shadow-emerald-500/5',
          };
          return (
            <button
              key={stat.label}
              onClick={() => stat.action && onNavigate('projects')}
              className={`cinema-card lens-flare p-4 text-left hover:scale-[1.02] transition-all duration-200 animate-slide-up stagger-${Math.min(i + 1, 4)} ${borderColors[stat.accent]} shadow-lg ${glowColors[stat.accent]}`}
            >
              <div className="relative z-10">
                <Icon className={`w-4 h-4 ${iconColors[stat.accent]} mb-2`} />
                <p className="text-2xl font-bold text-white font-mono">{stat.value}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 uppercase tracking-wider">{stat.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Pipeline visualization - film strip style */}
      <div className="cinema-card p-5 sm:p-6 animate-slide-up stagger-2">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clapperboard className="w-4 h-4 text-amber-400/60" />
              <h2 className="text-sm font-semibold text-white">Production Pipeline</h2>
            </div>
            <span className="text-[10px] text-amber-400/40 font-mono uppercase tracking-wider">6 Stages</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
            {pipelineSteps.map((step) => {
              const Icon = step.icon;
              return (
                <button
                  key={step.id}
                  onClick={() => onNavigate(step.id)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-800/20 hover:bg-slate-800/40 border border-amber-500/[0.04] hover:border-amber-500/10 transition-all duration-200 group spotlight-hover"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/5 border border-amber-500/[0.06] flex items-center justify-center group-hover:bg-amber-500/10 group-hover:border-amber-500/10 transition-all">
                    <Icon className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors">{step.label}</p>
                    <p className="text-[10px] text-slate-600 font-mono hidden sm:block">{step.frame}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent projects - screening room style */}
      <div className="animate-slide-up stagger-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-px w-6 bg-gradient-to-r from-amber-500/40 to-transparent" />
            <h2 className="text-sm font-semibold text-white">Recent Projects</h2>
          </div>
          <button
            onClick={() => onNavigate('projects')}
            className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="cinema-card p-4 h-16 animate-shimmer" />
            ))}
          </div>
        )}

        {!loading && projects.length > 0 && (
          <div className="space-y-2">
            {projects.map((project) => {
              const status = statusLabels[project.status] || statusLabels.story;
              const StatusIcon = status.icon;
              return (
                <button
                  key={project.id}
                  onClick={() => onSelectProject(project.id, project.title, project.status)}
                  className="w-full flex items-center gap-3 sm:gap-4 cinema-card p-4 hover:border-amber-500/15 transition-all duration-200 group spotlight-hover"
                >
                  <div className="relative z-10 flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-lg ${status.color} border flex items-center justify-center flex-shrink-0`}>
                      <StatusIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-white truncate group-hover:text-amber-400 transition-colors">
                        {project.title}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {project.story_idea?.substring(0, 60) || 'No story yet'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-500">
                        <Clock className="w-3 h-3" />
                        {timeAgo(project.updated_at)}
                      </div>
                      <span className="scene-badge">{status.frame}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${status.color}`}>
                        {status.label}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-all group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {!loading && projects.length === 0 && (
          <div className="cinema-card p-8 text-center">
            <div className="relative z-10">
              <Zap className="w-8 h-8 text-amber-400/30 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No projects yet</p>
              <p className="text-xs text-slate-500 mt-1">Create your first project to get started</p>
              <button
                onClick={() => onNavigate('projects')}
                className="mt-4 inline-flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-medium px-4 py-2 rounded-lg transition-colors border border-amber-500/10"
              >
                <Plus className="w-3.5 h-3.5" />
                New Project
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard shortcut hint */}
      <div className="hidden sm:flex items-center justify-center gap-2 text-[10px] text-slate-600 py-2 animate-fade-in">
        <kbd className="bg-slate-800/50 px-1.5 py-0.5 rounded border border-amber-500/[0.06] text-slate-500">Ctrl</kbd>
        <span>+</span>
        <kbd className="bg-slate-800/50 px-1.5 py-0.5 rounded border border-amber-500/[0.06] text-slate-500">K</kbd>
        <span className="ml-1">to open command palette</span>
      </div>
    </div>
  );
}
