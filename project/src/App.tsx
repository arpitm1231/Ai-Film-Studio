import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './components/Toast';
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';
import CommandPalette from './components/CommandPalette';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import StoryPage from './pages/StoryPage';
import ScriptPage from './pages/ScriptPage';
import VisualsPage from './pages/VisualsPage';
import AudioPage from './pages/AudioPage';
import TrailerPage from './pages/TrailerPage';
import AnalyticsPage from './pages/AnalyticsPage';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentStage, setCurrentStage] = useState('dashboard');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center film-grain scan-lines relative">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25 animate-glow">
            <svg className="w-7 h-7 text-slate-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="2" y1="7" x2="7" y2="7" />
              <line x1="2" y1="17" x2="7" y2="17" />
              <line x1="17" y1="7" x2="22" y2="7" />
              <line x1="17" y1="17" x2="22" y2="17" />
            </svg>
          </div>
          <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleProjectSelect = (id: string, title: string, status?: string) => {
    setProjectId(id);
    setProjectTitle(title);
    setCurrentStage(status && status !== 'story' ? status : 'story');
  };

  const handleStageChange = (stage: string) => {
    if (stage === 'dashboard' || stage === 'projects' || projectId) {
      setCurrentStage(stage);
    }
  };

  const handleNewProject = () => {
    setCurrentStage('projects');
  };

  const renderPage = () => {
    if (currentStage === 'dashboard') {
      return <DashboardPage onNavigate={handleStageChange} onSelectProject={handleProjectSelect} />;
    }

    if (currentStage === 'projects') {
      return <ProjectsPage onSelectProject={handleProjectSelect} />;
    }

    if (!projectId) {
      return <ProjectsPage onSelectProject={handleProjectSelect} />;
    }

    switch (currentStage) {
      case 'story':
        return (
          <StoryPage
            projectId={projectId}
            onProjectCreated={(id, title) => {
              setProjectId(id);
              setProjectTitle(title);
            }}
          />
        );
      case 'script':
        return <ScriptPage projectId={projectId} onScriptGenerated={() => {}} />;
      case 'visuals':
        return <VisualsPage projectId={projectId} />;
      case 'audio':
        return <AudioPage projectId={projectId} />;
      case 'trailer':
        return <TrailerPage projectId={projectId} />;
      case 'analytics':
        return <AnalyticsPage projectId={projectId} />;
      default:
        return <StoryPage projectId={projectId} onProjectCreated={() => {}} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] film-grain scan-lines relative">
      {/* Cinema ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] bg-amber-500/[0.015] rounded-full blur-[150px] animate-projector" />
        <div className="absolute -bottom-1/2 -right-1/4 w-[600px] h-[600px] bg-cyan-500/[0.01] rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-amber-500/[0.008] rounded-full blur-[100px]" />
      </div>

      <Sidebar
        currentStage={currentStage}
        onStageChange={handleStageChange}
        projectName={currentStage !== 'projects' && currentStage !== 'dashboard' ? projectTitle : ''}
      />
      <main className="lg:ml-[240px] pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8 min-h-screen relative z-10">
        <div className="animate-fade-in">
          {renderPage()}
        </div>
      </main>

      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={handleStageChange}
        onNewProject={handleNewProject}
        projectName={projectTitle}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
