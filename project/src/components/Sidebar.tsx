import {
  FileText,
  Image,
  Music,
  Video,
  BarChart3,
  BookOpen,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Menu,
  X,
  Check,
  FolderOpen,
  LayoutDashboard,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const stages = [
  { id: 'story', label: 'Story', icon: BookOpen, frame: '01' },
  { id: 'script', label: 'Script', icon: FileText, frame: '02' },
  { id: 'visuals', label: 'Visuals', icon: Image, frame: '03' },
  { id: 'audio', label: 'Audio', icon: Music, frame: '04' },
  { id: 'trailer', label: 'Trailer', icon: Video, frame: '05' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, frame: '06' },
];

interface SidebarProps {
  currentStage: string;
  onStageChange: (stage: string) => void;
  projectName: string;
}

export default function Sidebar({ currentStage, onStageChange, projectName }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut, user } = useAuth();

  const handleStageChange = (stage: string) => {
    onStageChange(stage);
    setMobileOpen(false);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentIndex = stages.findIndex((s) => s.id === currentStage);
  const progressPct = currentStage === 'projects' || currentStage === 'dashboard' ? 0 : Math.round(((currentIndex + 1) / stages.length) * 100);

  const sidebarContent = (
    <>
      {/* Logo - cinema marquee style */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-amber-500/[0.08] relative">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/25 animate-glow">
          <Clapperboard className="w-5 h-5 text-slate-900" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-white tracking-wide">AI Film Studio</h1>
            <p className="text-[9px] text-amber-400/40 uppercase tracking-[0.2em]">Production Suite</p>
          </div>
        )}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/50"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Project name + progress - film counter style */}
      {!collapsed && projectName && (
        <div className="px-4 py-3 border-b border-amber-500/[0.06]">
          <p className="text-[9px] uppercase tracking-[0.25em] text-amber-400/40 mb-1.5 font-medium">Current Reel</p>
          <p className="text-xs text-amber-400 font-medium truncate">{projectName}</p>
          <div className="mt-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-slate-500 uppercase tracking-wider">Progress</span>
              <span className="text-[10px] text-amber-400 font-bold font-mono">{progressPct}%</span>
            </div>
            <div className="h-1 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/30">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Dashboard + Projects */}
      <div className="px-2 pt-3 space-y-0.5">
        <button
          onClick={() => handleStageChange('dashboard')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 spotlight-hover ${
            currentStage === 'dashboard'
              ? 'bg-amber-500/[0.08] text-amber-400 border border-amber-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
          }`}
        >
          <LayoutDashboard className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Dashboard</span>}
        </button>
        <button
          onClick={() => handleStageChange('projects')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 spotlight-hover ${
            currentStage === 'projects'
              ? 'bg-amber-500/[0.08] text-amber-400 border border-amber-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
          }`}
        >
          <FolderOpen className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Projects</span>}
        </button>
      </div>

      {/* Navigation - film frame pipeline */}
      <nav className="flex-1 py-2 px-2 space-y-0.5">
        <p className="px-3 py-1.5 text-[9px] uppercase tracking-[0.25em] text-amber-400/30 font-semibold">
          {!collapsed ? 'Production Pipeline' : ''}
        </p>
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = currentStage === stage.id;
          const stageIndex = stages.findIndex((s) => s.id === stage.id);
          const isCompleted = stageIndex < currentIndex;

          return (
            <button
              key={stage.id}
              onClick={() => handleStageChange(stage.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative spotlight-hover ${
                isActive
                  ? 'bg-amber-500/[0.08] text-amber-400 border border-amber-500/10'
                  : isCompleted
                    ? 'text-slate-300 hover:bg-slate-800/50 border border-transparent'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              {/* Film frame connector line */}
              {index < stages.length - 1 && !collapsed && (
                <div className="absolute left-[26px] top-[calc(50%+14px)] w-px h-[calc(100%-4px)] bg-gradient-to-b from-amber-500/10 to-transparent" />
              )}
              <div className="relative flex-shrink-0">
                {isCompleted ? (
                  <div className="w-[18px] h-[18px] rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                ) : isActive ? (
                  <div className="w-[18px] h-[18px] rounded-md bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                    <Icon className="w-3 h-3 text-amber-400" />
                  </div>
                ) : (
                  <Icon className="w-[18px] h-[18px]" />
                )}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{stage.label}</span>
                </div>
              )}
              {!collapsed && (
                <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-amber-400/60' : 'text-slate-700'}`}>
                  {stage.frame}
                </span>
              )}
              {isActive && !collapsed && (
                <div className="ml-1 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer - cinema credits style */}
      <div className="border-t border-amber-500/[0.06] p-3 space-y-2">
        {!collapsed && user && (
          <div className="px-2 py-1.5">
            <p className="text-[9px] text-amber-400/30 uppercase tracking-[0.2em] font-medium">Director</p>
            <p className="text-xs text-slate-300 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-colors"
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span className="text-sm">Sign Out</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full hidden lg:flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-[18px] h-[18px] flex-shrink-0" />
          ) : (
            <ChevronLeft className="w-[18px] h-[18px] flex-shrink-0" />
          )}
          {!collapsed && <span className="text-sm">Collapse</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile header bar - cinema top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-amber-500/[0.08] z-50 flex items-center px-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 ml-3">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20">
            <Clapperboard className="w-4 h-4 text-slate-900" />
          </div>
          <span className="text-sm font-bold text-white">AI Film Studio</span>
        </div>
        {projectName && (
          <span className="ml-auto text-xs text-amber-400/70 font-medium truncate max-w-[140px]">{projectName}</span>
        )}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-screen w-[260px] bg-[#0a0a0a] border-r border-amber-500/[0.08] flex flex-col z-50 transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 h-screen bg-[#0a0a0a] border-r border-amber-500/[0.08] flex-col transition-all duration-300 z-50 ${
          collapsed ? 'w-[72px]' : 'w-[240px]'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
